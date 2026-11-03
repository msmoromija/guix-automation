import { NextRequest, NextResponse } from "next/server";
import { validarSessaoCliente } from "@/lib/agendamentos/cliente";
import {
  gravarAgendamento,
  iniciaEmISO,
  novoCancelToken,
  novoIdAgendamento,
  novoManageToken,
  ocupadosNoDia,
  sanitizarSiteIdPublico,
} from "@/lib/agendamentos/cofre";
import { enviarEmailNegocio, linkWhatsappNegocio, urlCancelamento, urlGestao } from "@/lib/agendamentos/notificar";
import type { Agendamento } from "@/lib/agendamentos/tipos";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const siteId = sanitizarSiteIdPublico(String(req.nextUrl.searchParams.get("siteId") || ""));
  const data = String(req.nextUrl.searchParams.get("data") || "");
  const profissional = String(req.nextUrl.searchParams.get("profissional") || "");
  if (!siteId || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ erro: "Informe siteId e data." }, { status: 400 });
  }
  try {
    const ocupados = await ocupadosNoDia(siteId, data, profissional || undefined);
    return NextResponse.json({ ocupados });
  } catch {
    return NextResponse.json({ ocupados: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = sanitizarSiteIdPublico(String(body.siteId || ""));
    const sessaoToken = String(body.sessaoToken || "").trim();
    const servico = String(body.servico || "").trim().slice(0, 80);
    const profissional = String(body.profissional || "Sem preferência").trim().slice(0, 80);
    const data = String(body.data || "").trim();
    const hora = String(body.hora || "").trim();
    const negocioNome = String(body.negocioNome || "Negócio").trim().slice(0, 80);
    const negocioWhatsapp = String(body.negocioWhatsapp || "").replace(/\D/g, "");
    const negocioEmail = String(body.negocioEmail || "").trim();
    const nicho = String(body.nicho || "").trim().slice(0, 40);
    const observacao = String(body.observacao || "").trim().slice(0, 280);
    const modoRaw = String(body.modoConfirmacao || "manual");
    const modoConfirmacao =
      modoRaw === "automatico" || modoRaw === "whatsapp" ? modoRaw : "manual";

    if (!siteId) return NextResponse.json({ erro: "Site inválido." }, { status: 400 });
    const sessao = await validarSessaoCliente(siteId, sessaoToken);
    if (!sessao) {
      return NextResponse.json(
        { erro: "Confirme seu e-mail ou telefone antes de solicitar horário.", codigo: "SEM_SESSAO" },
        { status: 401 },
      );
    }

    const nomeCompleto = sessao.nomeCompleto;
    const email = sessao.email;
    const telefone = sessao.telefone;

    if (!servico) return NextResponse.json({ erro: "Escolha o serviço." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
      return NextResponse.json({ erro: "Escolha dia e horário." }, { status: 400 });
    }

    const iniciaEm = iniciaEmISO(data, hora);
    if (!iniciaEm || new Date(iniciaEm).getTime() <= Date.now()) {
      return NextResponse.json({ erro: "Escolha um horário futuro." }, { status: 400 });
    }

    const ocupados = await ocupadosNoDia(siteId, data, profissional);
    if (ocupados.some((o) => o.hora === hora && (profissional === "Sem preferência" || o.profissional === profissional))) {
      return NextResponse.json({ erro: "Este horário acabou de ser preenchido. Escolha outro." }, { status: 409 });
    }

    const automatico = modoConfirmacao === "automatico";
    const ag: Agendamento = {
      id: novoIdAgendamento(),
      cancelToken: novoCancelToken(),
      manageToken: novoManageToken(),
      siteId,
      nicho: nicho || undefined,
      negocioNome,
      negocioWhatsapp,
      negocioEmail,
      servico,
      profissional,
      data,
      hora,
      iniciaEm,
      nomeCompleto,
      email,
      telefone,
      observacao: observacao || undefined,
      status: automatico ? "confirmado" : "pendente",
      criadoEm: new Date().toISOString(),
      respondidoEm: automatico ? new Date().toISOString() : undefined,
      respostaNota: automatico ? "Confirmado automaticamente pelo site." : undefined,
    };

    await gravarAgendamento(ag);
    const tipoAviso = automatico ? "confirmado" : "solicitacao";
    const emailRes = await enviarEmailNegocio(ag, tipoAviso);
    const whatsappUrl = linkWhatsappNegocio(ag, tipoAviso);

    let aviso: string;
    if (automatico) {
      aviso = "Horário confirmado automaticamente. Você recebe o link para acompanhar ou cancelar.";
    } else if (modoConfirmacao === "whatsapp") {
      aviso = whatsappUrl
        ? "Solicitação pronta. Abra o WhatsApp do negócio para ele confirmar."
        : "Solicitação registrada. O profissional confirma pelo WhatsApp (número do negócio ausente).";
    } else if (emailRes.ok) {
      aviso = "Solicitação enviada. O profissional precisa confirmar o horário.";
    } else if (emailRes.motivo?.includes("RESEND")) {
      aviso = "Solicitação registrada. Avise o negócio pelo WhatsApp se o e-mail ainda não estiver ligado.";
    } else {
      aviso = emailRes.motivo || "Solicitação registrada. Aguardando confirmação do profissional.";
    }

    return NextResponse.json({
      ok: true,
      id: ag.id,
      status: ag.status,
      modoConfirmacao,
      cancelUrl: urlCancelamento(ag),
      gestaoUrl: urlGestao(ag),
      whatsappUrl,
      emailEnviado: emailRes.ok,
      aviso,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json(
      { erro: msg.includes("R2") ? "Falha ao gravar a solicitação. Tente de novo." : "Não foi possível solicitar o horário." },
      { status: 500 },
    );
  }
}
