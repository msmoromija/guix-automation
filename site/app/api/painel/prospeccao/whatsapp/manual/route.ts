import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { atualizarConta, contaPublica, lerConfig } from "@/lib/prospeccao/store";
import { detalhesNumero } from "@/lib/prospeccao/whatsapp";

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
 * POST /api/painel/prospeccao/whatsapp/manual
 * Conexão alternativa (sem Embedded Signup): o usuário cola o phone_number_id
 * e um token de acesso (System User). Validamos na Graph API e salvamos.
 *
 * body: { phone_number_id, token, waba_id?, nome? }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phoneNumberId = String(body.phone_number_id || "").trim();
  const token = String(body.token || "").trim();
  const wabaId = String(body.waba_id || "").trim();
  const nome = String(body.nome || "").trim();

  if (!phoneNumberId || !token) {
    return NextResponse.json({ erro: "Informe o phone_number_id e o token de acesso." }, { status: 400 });
  }

  let detalhes;
  try {
    detalhes = await detalhesNumero(phoneNumberId, token);
  } catch (e) {
    return NextResponse.json(
      {
        erro: e instanceof Error
          ? `Não foi possível validar o número: ${e.message}`
          : "Não foi possível validar o número.",
      },
      { status: 400 },
    );
  }

  const conta = await atualizarConta(`wa_${detalhes.id}`, {
    nome: nome || detalhes.verified_name || detalhes.display_phone_number || "Conta WhatsApp Business",
    provedor: "cloud_api",
    phone_number_id: detalhes.id,
    display_phone_number: detalhes.display_phone_number,
    waba_id: wabaId || null,
    status_conexao: "conectada",
    conectada_em: new Date().toISOString(),
    token,
  });

  const contas = (await lerConfig()).contas.map(contaPublica);
  return NextResponse.json({ ok: true, conta: contaPublica(conta), contas });
}
