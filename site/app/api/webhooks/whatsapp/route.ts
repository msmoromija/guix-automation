import { NextRequest, NextResponse } from "next/server";
import { atualizarStatusEnvios } from "@/lib/prospeccao/store";
import { assinaturaConfere, metaVerifyToken } from "@/lib/prospeccao/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/webhooks/whatsapp
 * Verificação do webhook da Meta (hub.challenge). Configure a mesma string em
 * META_VERIFY_TOKEN e no painel do app (WhatsApp > Configuration > Webhook).
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const modo = p.get("hub.mode");
  const token = p.get("hub.verify_token") || "";
  const desafio = p.get("hub.challenge") || "";
  const esperado = metaVerifyToken();

  if (modo === "subscribe" && esperado && token === esperado) {
    return new NextResponse(desafio, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type StatusRecebido = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: { title?: string; message?: string }[];
};

/**
 * POST /api/webhooks/whatsapp
 * Recebe os eventos de status (sent/delivered/read/failed) e atualiza o log de
 * envios pelo wamid. Também recebe mensagens de entrada (usado só para log).
 */
export async function POST(req: NextRequest) {
  const bruto = await req.text();
  const assinatura = req.headers.get("x-hub-signature-256");

  if (!assinaturaConfere(bruto, assinatura)) {
    return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
  }

  let corpo: {
    object?: string;
    entry?: { id?: string; changes?: { value?: { statuses?: StatusRecebido[] } }[] }[];
  };
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const itens: { wamid: string; status: string; erro?: string }[] = [];
  for (const entrada of corpo.entry || []) {
    for (const mudanca of entrada.changes || []) {
      for (const s of mudanca.value?.statuses || []) {
        if (!s.id || !s.status) continue;
        const erro = s.errors?.[0]?.message || s.errors?.[0]?.title || "";
        itens.push({ wamid: s.id, status: s.status, erro });
      }
    }
  }

  const atualizados = await atualizarStatusEnvios(itens).catch(() => 0);
  return NextResponse.json({ received: true, statuses: itens.length, atualizados });
}
