import { NextResponse } from "next/server";

/** Indica se o Asaas está ligado neste ambiente (sem expor segredos). */
export async function GET() {
  const chave = Boolean(process.env.ASAAS_API_KEY?.trim());
  const webhook = Boolean(process.env.ASAAS_WEBHOOK_TOKEN?.trim());
  const url = (process.env.ASAAS_API_URL || "https://api.asaas.com/v3").replace(/\/$/, "");
  const sandbox = url.includes("sandbox");
  return NextResponse.json({
    pronto: chave && webhook,
    chave: chave,
    webhookToken: webhook,
    ambiente: sandbox ? "sandbox" : "producao",
  });
}
