import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { atualizarConta, contaPublica, lerConfig } from "@/lib/prospeccao/store";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

/**
 * POST /api/painel/prospeccao/whatsapp/desconectar
 * Desconecta a conta: apaga o token e marca como desconectada. Os dados do
 * número (phone_number_id/waba_id) ficam salvos para reconectar depois.
 *
 * body: { id }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ erro: "Informe o id da conta." }, { status: 400 });

  const conta = await atualizarConta(id, {
    provedor: "cloud_api",
    status_conexao: "desconectada",
    token: null,
    conectada_em: null,
  });

  const contas = (await lerConfig()).contas.map(contaPublica);
  return NextResponse.json({ ok: true, conta: contaPublica(conta), contas });
}
