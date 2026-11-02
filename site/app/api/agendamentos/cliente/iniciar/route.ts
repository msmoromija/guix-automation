import { NextRequest, NextResponse } from "next/server";
import { iniciarVerificacaoCliente, type CanalVerificacao } from "@/lib/agendamentos/cliente";
import { enviarCodigoVerificacao } from "@/lib/agendamentos/otp-envio";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const canal = String(body.canal || "email") as CanalVerificacao;
    const inicio = await iniciarVerificacaoCliente({
      siteId: String(body.siteId || ""),
      nomeCompleto: String(body.nomeCompleto || ""),
      email: String(body.email || ""),
      telefone: String(body.telefone || ""),
      canal: canal === "telefone" ? "telefone" : "email",
    });
    if (!inicio.ok) return NextResponse.json({ erro: inicio.erro }, { status: 400 });

    const envio = await enviarCodigoVerificacao({
      canal: inicio.cliente.canal || "email",
      email: inicio.cliente.email,
      telefoneDigitos: inicio.cliente.telefoneDigitos,
      nome: inicio.cliente.nomeCompleto,
      codigo: inicio.codigo,
      negocioNome: String(body.negocioNome || ""),
    });

    if (!envio.ok) {
      return NextResponse.json(
        { erro: envio.motivo || "Não foi possível enviar o código. Tente de novo em instantes." },
        { status: 502 },
      );
    }

    const avisoExtra = "aviso" in envio ? envio.aviso || "" : "";
    return NextResponse.json({
      ok: true,
      // Mantém o canal escolhido: o desafio OTP fica indexado nele (mesmo se o envio caiu no e-mail).
      canal: canal === "telefone" ? "telefone" : "email",
      destinoMascarado:
        avisoExtra && canal === "telefone"
          ? inicio.cliente.email
          : inicio.destinoMascarado,
      aviso: avisoExtra,
    });
  } catch {
    return NextResponse.json({ erro: "Falha ao iniciar a verificação." }, { status: 500 });
  }
}
