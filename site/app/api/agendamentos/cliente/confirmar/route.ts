import { NextRequest, NextResponse } from "next/server";
import { confirmarCodigoCliente, type CanalVerificacao } from "@/lib/agendamentos/cliente";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const canal = String(body.canal || "email") as CanalVerificacao;
    const res = await confirmarCodigoCliente({
      siteId: String(body.siteId || ""),
      email: String(body.email || ""),
      telefone: String(body.telefone || ""),
      canal: canal === "telefone" ? "telefone" : "email",
      codigo: String(body.codigo || ""),
    });
    if (!res.ok) return NextResponse.json({ erro: res.erro }, { status: 400 });
    return NextResponse.json({
      ok: true,
      sessaoToken: res.sessao.token,
      nomeCompleto: res.sessao.nomeCompleto,
      email: res.sessao.email,
      telefone: res.sessao.telefone,
      expiraEm: res.sessao.expiraEm,
    });
  } catch {
    return NextResponse.json({ erro: "Falha ao confirmar o código." }, { status: 500 });
  }
}
