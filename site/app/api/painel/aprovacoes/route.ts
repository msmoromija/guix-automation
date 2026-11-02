import { NextRequest, NextResponse } from "next/server";
import { listarJobsAprovados, atualizarStatusJob } from "@/lib/prototipos/ops";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const esperado = (process.env.PAINEL_MIDIA_TOKEN || process.env.GUIX_OPS_TOKEN || "").trim();
  if (!esperado) return false;
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("token") || "";
  return bearer === esperado || q === esperado;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const itens = await listarJobsAprovados(80);
  return NextResponse.json({ ok: true, itens });
}

export async function PATCH(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const status = String(body.status || "").trim();
  if (!token || !["pago", "em_integracao", "publicado", "aprovado"].includes(status)) {
    return NextResponse.json({ erro: "Informe token e status válido." }, { status: 400 });
  }
  const item = await atualizarStatusJob(token, status as "pago" | "em_integracao" | "publicado" | "aprovado");
  if (!item) return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}
