import { NextRequest, NextResponse } from "next/server";
import { cancelarAgendamento, lerAgendamento, podeCancelar, sanitizarSiteIdPublico } from "@/lib/agendamentos/cofre";
import { ANTECEDENCIA_CANCEL_HORAS } from "@/lib/agendamentos/tipos";
import { enviarEmailNegocio, linkWhatsappNegocio, urlCancelamento } from "@/lib/agendamentos/notificar";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const siteId = sanitizarSiteIdPublico(String(req.nextUrl.searchParams.get("s") || ""));
  const token = String(req.nextUrl.searchParams.get("t") || "");
  if (!siteId || !id) return NextResponse.json({ erro: "Link incompleto." }, { status: 400 });
  const ag = await lerAgendamento(siteId, id);
  if (!ag || ag.cancelToken !== token) return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
  return NextResponse.json({
    agendamento: {
      id: ag.id,
      status: ag.status,
      servico: ag.servico,
      profissional: ag.profissional,
      data: ag.data,
      hora: ag.hora,
      nomeCompleto: ag.nomeCompleto,
      negocioNome: ag.negocioNome,
      podeCancelar: ag.status === "confirmado" && podeCancelar(ag),
      antecedenciaHoras: ANTECEDENCIA_CANCEL_HORAS,
      cancelUrl: urlCancelamento(ag),
    },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const siteId = sanitizarSiteIdPublico(String(body.siteId || req.nextUrl.searchParams.get("s") || ""));
  const token = String(body.cancelToken || req.nextUrl.searchParams.get("t") || "");
  const acao = String(body.acao || "cancelar");
  if (acao !== "cancelar") return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
  if (!siteId || !token) return NextResponse.json({ erro: "Link incompleto." }, { status: 400 });

  const atual = await lerAgendamento(siteId, id);
  if (!atual) return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
  if (atual.status === "cancelado") {
    return NextResponse.json({ ok: true, status: "cancelado", whatsappUrl: linkWhatsappNegocio(atual, "cancelado") });
  }
  if (!podeCancelar(atual)) {
    return NextResponse.json(
      { erro: `Só é possível cancelar com pelo menos ${ANTECEDENCIA_CANCEL_HORAS} horas de antecedência.` },
      { status: 403 },
    );
  }

  const res = await cancelarAgendamento(siteId, id, token);
  if (!res.ok) return NextResponse.json({ erro: res.erro }, { status: 400 });
  await enviarEmailNegocio(res.ag, "cancelado");
  return NextResponse.json({
    ok: true,
    status: "cancelado",
    whatsappUrl: linkWhatsappNegocio(res.ag, "cancelado"),
  });
}
