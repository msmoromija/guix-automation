import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { atualizarConta, contaPublica, lerConfig } from "@/lib/prospeccao/store";
import {
  inscreverAppNaWaba,
  metaConfigurado,
  numerosDaWaba,
  trocarCodigoPorToken,
} from "@/lib/prospeccao/whatsapp";

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
 * POST /api/painel/prospeccao/whatsapp/conectar
 * Conclui o Embedded Signup: troca o `code` por token, descobre o número na
 * WABA, assina o app e salva a conta conectada (phone_number_id, waba_id,
 * display_phone_number, status) no R2.
 *
 * body: { code, waba_id, phone_number_id?, nome? }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  if (!metaConfigurado()) {
    return NextResponse.json(
      { erro: "Embedded Signup não configurado (defina META_APP_ID e META_APP_SECRET)." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  const wabaId = String(body.waba_id || "").trim();
  const phoneNumberId = String(body.phone_number_id || "").trim();
  const nome = String(body.nome || "").trim();

  if (!code) return NextResponse.json({ erro: "Código de autorização ausente." }, { status: 400 });
  if (!wabaId) return NextResponse.json({ erro: "waba_id ausente no retorno do Embedded Signup." }, { status: 400 });

  let token: string;
  try {
    token = await trocarCodigoPorToken(code);
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Falha ao trocar o código por token." },
      { status: 502 },
    );
  }

  let numeros;
  try {
    numeros = await numerosDaWaba(wabaId, token);
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Falha ao listar os números da WABA." },
      { status: 502 },
    );
  }

  const numero = phoneNumberId
    ? numeros.find((n) => n.id === phoneNumberId)
    : numeros[0];
  if (!numero) {
    return NextResponse.json(
      {
        erro: numeros.length
          ? "Número informado não pertence à WABA conectada."
          : "Nenhum número de telefone encontrado nessa conta WhatsApp Business.",
      },
      { status: 400 },
    );
  }

  // Assina o app na WABA para começar a receber webhooks (não bloqueia a conexão).
  let avisoWebhook = "";
  try {
    await inscreverAppNaWaba(wabaId, token);
  } catch (e) {
    avisoWebhook =
      e instanceof Error
        ? `Conta conectada, mas a assinatura do webhook falhou: ${e.message}`
        : "Conta conectada, mas a assinatura do webhook falhou.";
  }

  const conta = await atualizarConta(`wa_${numero.id}`, {
    nome: nome || numero.verified_name || numero.display_phone_number || "Conta WhatsApp Business",
    provedor: "cloud_api",
    phone_number_id: numero.id,
    display_phone_number: numero.display_phone_number,
    waba_id: wabaId,
    status_conexao: "conectada",
    conectada_em: new Date().toISOString(),
    token,
  });

  const contas = (await lerConfig()).contas.map(contaPublica);
  return NextResponse.json({ ok: true, conta: contaPublica(conta), contas, aviso: avisoWebhook });
}
