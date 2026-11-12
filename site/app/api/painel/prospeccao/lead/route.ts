import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import {
  buscarLeadPorTelefone,
  contaPublica,
  contarEnviosHoje,
  gravarLead,
  hojeIso,
  leadEnviadoHoje,
  lerConfig,
  lerLead,
  listarEnvios,
  normalizarTelefone,
  novoIdLead,
  registrarEnvio,
  registrarEvento,
  removerLead,
} from "@/lib/prospeccao/store";
import { linkWhatsApp, renderizarTemplate, varsDoLead } from "@/lib/prospeccao/mensagem";
import type { Lead, StatusLead } from "@/lib/prospeccao/tipos";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

const STATUS_VALIDOS: StatusLead[] = [
  "novo",
  "mensagem_gerada",
  "enviado",
  "respondeu",
  "descartado",
];

/**
 * POST /api/painel/prospeccao/lead — gera mensagem e cria/atualiza lead.
 * body: { nome, telefone, cidade, nicho, endereco, categoria?, external_id?, fonte? }
 * Também aceita { id } para atualizar um lead existente.
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const config = await lerConfig();
  const agora = new Date().toISOString();

  // Se for atualização de lead existente (apenas gerar mensagem de novo)
  if (body.id) {
    const lead = await lerLead(String(body.id));
    if (!lead) return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });

    const nichoCfg = config.nichos.find((n) => n.slug === lead.nicho);
    const modeloUrl = nichoCfg?.modelo_url || lead.modelo_usado || "";
    const template = config.templates.find((t) => t.id === config.template_ativo) || config.templates[0];
    const mensagem = renderizarTemplate(template, varsDoLead(lead, modeloUrl, config.remetente));

    lead.mensagem_gerada = mensagem;
    // Não regride o status de leads já contatados (enviado/respondeu/descartado)
    if (lead.status === "novo") lead.status = "mensagem_gerada";
    lead.updated_at = agora;
    registrarEvento(lead, { tipo: "mensagem_gerada", mensagem });
    await gravarLead(lead);

    return NextResponse.json({
      ok: true,
      lead,
      mensagem,
      whatsapp_url: linkWhatsApp(lead.telefone, mensagem),
    });
  }

  // Criação de novo lead a partir de um lugar encontrado
  const nome = String(body.nome || "").trim();
  const telefone = String(body.telefone || "").trim();
  const cidade = String(body.cidade || "").trim();
  const nicho = String(body.nicho || "").trim();

  if (!nome || !telefone || !cidade || !nicho) {
    return NextResponse.json(
      { erro: "Informe nome, telefone, cidade e nicho." },
      { status: 400 },
    );
  }

  const telNorm = normalizarTelefone(telefone);
  if (telNorm.length < 10) {
    return NextResponse.json({ erro: "Telefone inválido." }, { status: 400 });
  }

  const nichoCfg = config.nichos.find((n) => n.slug === nicho);
  if (!nichoCfg) {
    return NextResponse.json({ erro: "Nicho não cadastrado." }, { status: 400 });
  }

  // Evita duplicata por telefone
  let lead = await buscarLeadPorTelefone(telNorm);
  const jaExistia = Boolean(lead);
  if (!lead) {
    lead = {
      id: novoIdLead(),
      nome,
      telefone,
      cidade,
      nicho,
      endereco: String(body.endereco || ""),
      categoria: body.categoria ? String(body.categoria) : undefined,
      status: "novo",
      data_ultimo_contato: null,
      conta_whatsapp: null,
      modelo_usado: nichoCfg.modelo_url,
      mensagem_gerada: null,
      observacoes: "",
      external_id: body.external_id ? String(body.external_id) : null,
      fonte: body.fonte ? String(body.fonte) : "google",
      created_at: agora,
      updated_at: agora,
    };
  }

  const template = config.templates.find((t) => t.id === config.template_ativo) || config.templates[0];
  const mensagem = renderizarTemplate(template, varsDoLead(lead, nichoCfg.modelo_url, config.remetente));

  lead.nome = nome;
  lead.cidade = cidade;
  lead.nicho = nicho;
  lead.endereco = String(body.endereco || lead.endereco || "");
  lead.mensagem_gerada = mensagem;
  lead.modelo_usado = nichoCfg.modelo_url;
  // Não regride o status de leads já contatados (enviado/respondeu/descartado)
  if (lead.status === "novo") lead.status = "mensagem_gerada";
  lead.updated_at = agora;
  registrarEvento(lead, { tipo: "mensagem_gerada", mensagem });

  await gravarLead(lead);

  return NextResponse.json({
    ok: true,
    lead,
    mensagem,
    criado: !jaExistia,
    whatsapp_url: linkWhatsApp(lead.telefone, mensagem),
  });
}

/**
 * PATCH /api/painel/prospeccao/lead — atualiza status, observações, conta.
 * body: { id, status?, observacoes?, conta_whatsapp?, marcar_enviado?: boolean }
 *
 * `marcar_enviado` grava um registro imutável no log de envios (R2), que é a
 * fonte da verdade dos contadores por conta e do histórico por lead. Chamadas
 * repetidas no mesmo dia para o mesmo lead não duplicam o envio (idempotente),
 * mas garantem que o status do lead fique como "enviado".
 */
export async function PATCH(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ erro: "Informe o id do lead." }, { status: 400 });

  const lead = await lerLead(id);
  if (!lead) return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });

  const agora = new Date().toISOString();
  const statusAnterior = lead.status;
  const config = await lerConfig();

  if (typeof body.conta_whatsapp === "string" && body.conta_whatsapp) {
    lead.conta_whatsapp = body.conta_whatsapp;
  }

  if (typeof body.observacoes === "string") {
    const novo = body.observacoes.slice(0, 1000);
    if (novo !== lead.observacoes) {
      lead.observacoes = novo;
      registrarEvento(lead, { tipo: "observacao", observacao: novo });
    }
  }

  // Marca/envia: grava no log de envios e atualiza lead + contador (derivado)
  let envioRegistrado = false;
  if (body.marcar_enviado === true) {
    const contaId = String(body.conta_whatsapp || lead.conta_whatsapp || "");
    const conta = config.contas.find((c) => c.id === contaId);
    if (!conta) {
      return NextResponse.json({ erro: "Conta WhatsApp inválida." }, { status: 400 });
    }

    const envios = await listarEnvios();
    // Idempotência: não conta duas vezes o mesmo lead no mesmo dia.
    if (!leadEnviadoHoje(envios, lead.id)) {
      if (contarEnviosHoje(envios, contaId) >= conta.limite_diario) {
        return NextResponse.json(
          { erro: `Limite diário de ${conta.limite_diario} mensagens na ${conta.nome} atingido.` },
          { status: 429 },
        );
      }
      await registrarEnvio({
        lead_id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        nicho: lead.nicho,
        conta_id: conta.id,
        conta_nome: conta.nome,
        mensagem: lead.mensagem_gerada || "",
        canal: "link",
      });
      envioRegistrado = true;
    }

    lead.conta_whatsapp = contaId;
    lead.status = "enviado";
    lead.data_ultimo_contato = agora;
    registrarEvento(lead, {
      tipo: "enviado",
      conta_whatsapp: conta.id,
      conta_nome: conta.nome,
      mensagem: lead.mensagem_gerada,
    });
  } else if (body.status && STATUS_VALIDOS.includes(body.status as StatusLead)) {
    const novoStatus = body.status as StatusLead;
    if (novoStatus !== statusAnterior) {
      lead.status = novoStatus;
      if (novoStatus === "enviado") lead.data_ultimo_contato = agora;
      registrarEvento(lead, { tipo: novoStatus, mensagem: lead.mensagem_gerada });
    }
  }

  lead.updated_at = agora;
  await gravarLead(lead);

  const envios = await listarEnvios(200);
  const contasComContagem = config.contas.map((c) => ({
    ...contaPublica(c),
    enviados_hoje: contarEnviosHoje(envios, c.id, hojeIso()),
  }));

  return NextResponse.json({
    ok: true,
    lead,
    envios,
    contas: contasComContagem,
    enviado_registrado: envioRegistrado,
  });
}

/**
 * DELETE /api/painel/prospeccao/lead?id=... — remove um lead do histórico.
 */
export async function DELETE(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || req.nextUrl.searchParams.get("id") || "");
  if (!id) return NextResponse.json({ erro: "Informe o id do lead." }, { status: 400 });

  const lead = await lerLead(id);
  if (!lead) return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });

  await removerLead(id);
  return NextResponse.json({ ok: true, removido: id });
}
