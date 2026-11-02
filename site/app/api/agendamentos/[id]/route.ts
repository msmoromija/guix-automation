import { NextRequest, NextResponse } from "next/server";
import {
  cancelarAgendamento,
  lerAgendamento,
  podeCancelar,
  responderAgendamento,
  sanitizarSiteIdPublico,
} from "@/lib/agendamentos/cofre";
import { ANTECEDENCIA_CANCEL_HORAS, rotuloStatus } from "@/lib/agendamentos/tipos";
import {
  enviarEmailCliente,
  enviarEmailNegocio,
  linkWhatsappNegocio,
  urlCancelamento,
  urlGestao,
} from "@/lib/agendamentos/notificar";
import { lerPacote } from "@/lib/prototipos/cofre";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const siteId = sanitizarSiteIdPublico(String(req.nextUrl.searchParams.get("s") || ""));
  const token = String(req.nextUrl.searchParams.get("t") || "");
  const manage = String(req.nextUrl.searchParams.get("m") || "");
  if (!siteId || !id) return NextResponse.json({ erro: "Link incompleto." }, { status: 400 });
  const ag = await lerAgendamento(siteId, id);
  if (!ag) return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });

  const comoCliente = Boolean(token && ag.cancelToken === token);
  const comoGestao = Boolean(manage && (ag.manageToken === manage || ag.cancelToken === manage));
  if (!comoCliente && !comoGestao) {
    return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    agendamento: {
      id: ag.id,
      status: ag.status,
      statusRotulo: rotuloStatus(ag.status),
      servico: ag.servico,
      profissional: ag.profissional,
      data: ag.data,
      hora: ag.hora,
      nomeCompleto: ag.nomeCompleto,
      email: comoGestao ? ag.email : undefined,
      telefone: comoGestao ? ag.telefone : undefined,
      negocioNome: ag.negocioNome,
      respostaNota: ag.respostaNota,
      podeCancelar: comoCliente && (ag.status === "pendente" || ag.status === "confirmado") && podeCancelar(ag),
      podeResponder: comoGestao && ag.status === "pendente",
      antecedenciaHoras: ANTECEDENCIA_CANCEL_HORAS,
      cancelUrl: urlCancelamento(ag),
      gestaoUrl: urlGestao(ag),
      papel: comoGestao ? "gestao" : "cliente",
    },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const siteId = sanitizarSiteIdPublico(String(body.siteId || req.nextUrl.searchParams.get("s") || ""));
  const cancelToken = String(body.cancelToken || req.nextUrl.searchParams.get("t") || "");
  const manageToken = String(body.manageToken || req.nextUrl.searchParams.get("m") || "");
  const prototipoToken = String(body.prototipoToken || "").trim();
  const acao = String(body.acao || "cancelar");
  const nota = String(body.nota || "").trim().slice(0, 200);

  if (!siteId) return NextResponse.json({ erro: "Link incompleto." }, { status: 400 });

  if (acao === "aceitar" || acao === "recusar") {
    let tokenGestao = manageToken;
    if (!tokenGestao && prototipoToken) {
      const pacote = await lerPacote(prototipoToken);
      if (!pacote || pacote.token !== siteId) {
        return NextResponse.json({ erro: "Sem permissão para gerir esta agenda." }, { status: 403 });
      }
      const atual = await lerAgendamento(siteId, id);
      if (!atual) return NextResponse.json({ erro: "Solicitação não encontrada." }, { status: 404 });
      tokenGestao = atual.manageToken;
    }
    if (!tokenGestao) return NextResponse.json({ erro: "Link de gestão incompleto." }, { status: 400 });

    const res = await responderAgendamento(siteId, id, tokenGestao, acao, nota);
    if (!res.ok) return NextResponse.json({ erro: res.erro }, { status: 400 });
    const tipo = acao === "aceitar" ? "confirmado" : "recusado";
    await enviarEmailCliente(res.ag, tipo);
    return NextResponse.json({
      ok: true,
      status: res.ag.status,
      statusRotulo: rotuloStatus(res.ag.status),
      whatsappUrl: linkWhatsappNegocio(res.ag, tipo),
    });
  }

  if (acao !== "cancelar") return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
  if (!cancelToken) return NextResponse.json({ erro: "Link incompleto." }, { status: 400 });

  const atual = await lerAgendamento(siteId, id);
  if (!atual) return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
  if (atual.status === "cancelado" || atual.status === "recusado") {
    return NextResponse.json({ ok: true, status: atual.status, whatsappUrl: linkWhatsappNegocio(atual, "cancelado") });
  }
  if (!podeCancelar(atual)) {
    return NextResponse.json(
      { erro: `Só é possível cancelar com pelo menos ${ANTECEDENCIA_CANCEL_HORAS} horas de antecedência.` },
      { status: 403 },
    );
  }

  const res = await cancelarAgendamento(siteId, id, cancelToken);
  if (!res.ok) return NextResponse.json({ erro: res.erro }, { status: 400 });
  await enviarEmailNegocio(res.ag, "cancelado");
  return NextResponse.json({
    ok: true,
    status: "cancelado",
    whatsappUrl: linkWhatsappNegocio(res.ag, "cancelado"),
  });
}
