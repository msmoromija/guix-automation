import { NextRequest, NextResponse } from "next/server";
import {
  atualizarStatusEnvios,
  buscarLeadPorTelefone,
  gravarLead,
  lerConfig,
  normalizarTelefone,
  registrarEvento,
  registrarMensagem,
} from "@/lib/prospeccao/store";
import type { Lead } from "@/lib/prospeccao/tipos";
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

type MensagemWebhook = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};

type CorpoWebhook = {
  object?: string;
  entry?: {
    id?: string;
    changes?: {
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: MensagemWebhook[];
        statuses?: StatusRecebido[];
      };
    }[];
  }[];
};

/** Extrai um texto legível da mensagem recebida (independente do tipo). */
function textoDaMensagem(m: MensagemWebhook): string {
  return (
    m.text?.body ||
    m.image?.caption ||
    m.video?.caption ||
    m.document?.caption ||
    m.button?.text ||
    m.interactive?.button_reply?.title ||
    m.interactive?.list_reply?.title ||
    (m.type === "audio"
      ? "[áudio]"
      : m.type === "image"
        ? "[imagem]"
        : m.type === "document"
          ? "[documento]"
          : m.type
            ? `[${m.type}]`
            : "")
  );
}

/** Variantes do telefone recebido (a Meta envia com o código do país). */
function variantesTelefone(from: string): string[] {
  const d = normalizarTelefone(from);
  const out = new Set<string>();
  if (d) out.add(d);
  if (d.length > 11 && d.startsWith("55")) out.add(d.slice(2));
  return [...out];
}

/** Tenta casar o telefone que escreveu com um lead já salvo. */
async function casarLead(from: string): Promise<Lead | null> {
  for (const v of variantesTelefone(from)) {
    const l = await buscarLeadPorTelefone(v).catch(() => null);
    if (l) return l;
  }
  return null;
}

/**
 * POST /api/webhooks/whatsapp
 * Recebe mensagens de entrada (grátis — base do uso em suporte) e os eventos de
 * status (sent/delivered/read/failed), que confirmam o que foi enviado.
 * Sempre responde 200 após validar a assinatura, para a Meta não reentregar.
 */
export async function POST(req: NextRequest) {
  const bruto = await req.text();
  const assinatura = req.headers.get("x-hub-signature-256");

  if (!assinaturaConfere(bruto, assinatura)) {
    return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
  }

  let corpo: CorpoWebhook;
  try {
    corpo = JSON.parse(bruto) as CorpoWebhook;
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const itens: { wamid: string; status: string; erro?: string }[] = [];
  let recebidas = 0;

  try {
    const config = await lerConfig();

    for (const entrada of corpo.entry || []) {
      for (const mudanca of entrada.changes || []) {
        const value = mudanca.value || {};
        const phoneNumberId = value.metadata?.phone_number_id || null;
        const conta = phoneNumberId
          ? config.contas.find((c) => c.phone_number_id === phoneNumberId)
          : undefined;

        // Confirmação do que foi enviado (sent/delivered/read/failed).
        for (const s of value.statuses || []) {
          if (!s.id || !s.status) continue;
          const erro = s.errors?.[0]?.message || s.errors?.[0]?.title || "";
          itens.push({ wamid: s.id, status: s.status, erro });
        }

        // Mensagens recebidas — recebimento é gratuito.
        const nomeContato = value.contacts?.[0]?.profile?.name || null;
        for (const m of value.messages || []) {
          if (!m.id || !m.from) continue;
          const lead = await casarLead(m.from);
          const registrada = await registrarMensagem({
            wamid: m.id,
            em: m.timestamp
              ? new Date(Number(m.timestamp) * 1000).toISOString()
              : new Date().toISOString(),
            de: m.from,
            nome_contato: nomeContato,
            texto: textoDaMensagem(m),
            tipo: m.type || "desconhecido",
            phone_number_id: phoneNumberId,
            conta_id: conta?.id || null,
            conta_nome: conta?.nome || null,
            lead_id: lead?.id || null,
          });
          if (registrada.novo) recebidas += 1;

          // Se o telefone casa com um lead, marca como "respondeu".
          if (registrada.novo && lead && lead.status !== "respondeu") {
            lead.status = "respondeu";
            registrarEvento(lead, {
              tipo: "respondeu",
              mensagem: registrada.mensagem.texto,
              conta_nome: conta?.nome || null,
            });
            lead.updated_at = new Date().toISOString();
            await gravarLead(lead).catch(() => null);
          }
        }
      }
    }
  } catch (e) {
    console.error("webhook whatsapp: falha ao processar evento", e);
  }

  const atualizados = await atualizarStatusEnvios(itens).catch(() => 0);
  return NextResponse.json({
    received: true,
    statuses: itens.length,
    atualizados,
    mensagens: recebidas,
  });
}
