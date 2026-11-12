import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import {
  contaPublica,
  contarEnviosHoje,
  gravarLead,
  hojeIso,
  lerConfig,
  lerLead,
  listarEnvios,
  registrarEnvio,
  registrarEvento,
} from "@/lib/prospeccao/store";
import { enviarTexto } from "@/lib/prospeccao/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 60;

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

/**
 * POST /api/painel/prospeccao/whatsapp/enviar
 * Envia a mensagem do lead pela conta conectada (Cloud API oficial) e registra
 * o envio com o wamid — a partir daí o webhook atualiza o status real.
 *
 * body: { lead_id, texto? }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const leadId = String(body.lead_id || "").trim();
  if (!leadId) return NextResponse.json({ erro: "Informe o lead_id." }, { status: 400 });

  const lead = await lerLead(leadId);
  if (!lead) return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });

  const config = await lerConfig();
  const contaId = String(body.conta_id || lead.conta_whatsapp || "");
  const conta = config.contas.find((c) => c.id === contaId);
  if (!conta) {
    return NextResponse.json(
      { erro: "Selecione uma conta WhatsApp conectada para este lead." },
      { status: 400 },
    );
  }
  if (conta.provedor !== "cloud_api" || !conta.token || !conta.phone_number_id) {
    return NextResponse.json(
      { erro: `A conta "${conta.nome}" não está conectada à API oficial. Conecte-a para enviar direto pelo painel.` },
      { status: 400 },
    );
  }

  const texto = String(body.texto || lead.mensagem_gerada || "").trim();
  if (!texto) return NextResponse.json({ erro: "Gere a mensagem antes de enviar." }, { status: 400 });

  // Limite diário derivado do log real de envios
  const enviosAtuais = await listarEnvios();
  if (contarEnviosHoje(enviosAtuais, contaId) >= conta.limite_diario) {
    return NextResponse.json(
      { erro: `Limite diário de ${conta.limite_diario} mensagens na ${conta.nome} atingido.` },
      { status: 429 },
    );
  }

  let wamid = "";
  try {
    const r = await enviarTexto(conta.phone_number_id, conta.token, lead.telefone, texto);
    wamid = r.wamid;
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Falha ao enviar pela API oficial." },
      { status: 502 },
    );
  }

  const envio = await registrarEnvio({
    lead_id: lead.id,
    nome: lead.nome,
    telefone: lead.telefone,
    nicho: lead.nicho,
    conta_id: conta.id,
    conta_nome: conta.nome,
    mensagem: texto,
    canal: "cloud_api",
    wamid,
    status: "sent",
  });

  const agora = new Date().toISOString();
  lead.conta_whatsapp = conta.id;
  lead.status = "enviado";
  lead.data_ultimo_contato = agora;
  lead.updated_at = agora;
  registrarEvento(lead, {
    tipo: "enviado",
    conta_whatsapp: conta.id,
    conta_nome: conta.nome,
    mensagem: texto,
  });
  await gravarLead(lead);

  const envios = await listarEnvios(200);
  const contas = config.contas.map((c) => ({
    ...contaPublica(c),
    enviados_hoje: contarEnviosHoje(envios, c.id, hojeIso()),
  }));

  return NextResponse.json({ ok: true, lead, envio, wamid, envios, contas });
}
