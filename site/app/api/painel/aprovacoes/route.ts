import { NextRequest, NextResponse } from "next/server";
import { listarJobsAprovados, atualizarStatusJob } from "@/lib/prototipos/ops";
import {
  avisarClienteFilaPublicacao,
  avisarClienteSitePublicado,
} from "@/lib/automacao/emails-institucionais";
import { senhaComercialConfere } from "@/lib/cupons/auth";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const esperado = (process.env.PAINEL_MIDIA_TOKEN || process.env.GUIX_OPS_TOKEN || "").trim();
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("senha") || "";
  if (senhaComercialConfere(bearer) || senhaComercialConfere(q)) return true;
  if (!esperado) return false;
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
  const anterior = (await listarJobsAprovados(200)).find((j) => j.token === token);
  const item = await atualizarStatusJob(token, status as "pago" | "em_integracao" | "publicado" | "aprovado");
  if (!item) return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });

  let avisoCliente: unknown = null;
  const mudou = !anterior || anterior.status !== status;
  if (mudou && status === "em_integracao") {
    try {
      avisoCliente = await avisarClienteFilaPublicacao(item);
    } catch (e) {
      console.error("email fila", e);
      avisoCliente = { ok: false, motivo: e instanceof Error ? e.message : "falha" };
    }
  } else if (mudou && status === "publicado") {
    try {
      avisoCliente = await avisarClienteSitePublicado(item);
    } catch (e) {
      console.error("email publicado", e);
      avisoCliente = { ok: false, motivo: e instanceof Error ? e.message : "falha" };
    }
  }

  return NextResponse.json({ ok: true, item, avisoCliente });
}
