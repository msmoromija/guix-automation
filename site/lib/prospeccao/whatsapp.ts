import { createHmac, timingSafeEqual } from "crypto";
import { telefoneParaWa } from "./mensagem";

/**
 * Cliente da WhatsApp Business Platform (Cloud API) oficial da Meta.
 *
 * Fluxos suportados:
 *  - Embedded Signup (frontend envia o `code` → aqui trocamos por token);
 *  - Conexão manual (o usuário cola phone_number_id + token de System User).
 *
 * Credenciais do app ficam em variáveis de ambiente (nunca no cliente):
 *  META_APP_ID, META_APP_SECRET, META_CONFIG_ID, META_VERIFY_TOKEN,
 *  META_GRAPH_VERSION (default v21.0).
 */

const VERSAO = (process.env.META_GRAPH_VERSION || "v21.0").trim();
const BASE = `https://graph.facebook.com/${VERSAO}`;

export type NumeroWhatsApp = {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
};

export function metaAppId(): string {
  return (process.env.META_APP_ID || "").trim();
}
export function metaConfigId(): string {
  return (process.env.META_CONFIG_ID || "").trim();
}
export function metaVerifyToken(): string {
  return (process.env.META_VERIFY_TOKEN || "").trim();
}
function metaAppSecret(): string {
  return (process.env.META_APP_SECRET || "").trim();
}

/** App ID + App Secret presentes → é possível trocar o code do Embedded Signup por token. */
export function metaConfigurado(): boolean {
  return Boolean(metaAppId() && metaAppSecret());
}

/** Embedded Signup só pode ser iniciado no cliente se existir Configuration ID. */
export function embeddedSignupConfigurado(): boolean {
  return Boolean(metaAppId() && metaConfigId());
}

async function graph<T>(
  caminho: string,
  opts: { metodo?: "GET" | "POST"; token?: string; corpo?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(caminho.startsWith("http") ? caminho : `${BASE}${caminho}`);
  for (const [k, v] of Object.entries(opts.query || {})) url.searchParams.set(k, v);

  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.corpo) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method: opts.metodo || (opts.corpo ? "POST" : "GET"),
    headers,
    body: opts.corpo ? JSON.stringify(opts.corpo) : undefined,
  });

  const texto = await res.text();
  let json: unknown = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = { raw: texto };
  }

  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string } })?.error?.message || `Graph API ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

/** Troca o `code` do Embedded Signup pelo token de acesso. */
export async function trocarCodigoPorToken(code: string): Promise<string> {
  const r = await graph<{ access_token?: string }>("/oauth/access_token", {
    query: {
      client_id: metaAppId(),
      client_secret: metaAppSecret(),
      code,
    },
  });
  if (!r.access_token) throw new Error("A Meta não retornou o token de acesso.");
  return r.access_token;
}

/** Lista os números (phone numbers) de uma WABA. */
export async function numerosDaWaba(wabaId: string, token: string): Promise<NumeroWhatsApp[]> {
  const r = await graph<{ data?: NumeroWhatsApp[] }>(`/${wabaId}/phone_numbers`, {
    token,
    query: { fields: "id,display_phone_number,verified_name,quality_rating" },
  });
  return r.data || [];
}

/** Assina o app na WABA para receber webhooks (mensagens e status). */
export async function inscreverAppNaWaba(wabaId: string, token: string): Promise<void> {
  await graph(`/${wabaId}/subscribed_apps`, { metodo: "POST", token });
}

/** Busca os dados de um número específico (valida o token e o phone_number_id). */
export async function detalhesNumero(phoneNumberId: string, token: string): Promise<NumeroWhatsApp> {
  const r = await graph<NumeroWhatsApp>(`/${phoneNumberId}`, {
    token,
    query: { fields: "id,display_phone_number,verified_name,quality_rating" },
  });
  if (!r?.id) throw new Error("Número não encontrado para este token.");
  return r;
}

/** Envia texto por uma conta conectada. Retorna o wamid (id da mensagem na Meta). */
export async function enviarTexto(
  phoneNumberId: string,
  token: string,
  telefone: string,
  texto: string,
): Promise<{ wamid: string; para: string }> {
  const para = telefoneParaWa(telefone);
  if (!para) throw new Error("Telefone do lead inválido.");
  const r = await graph<{ messages?: { id: string }[] }>(`/${phoneNumberId}/messages`, {
    metodo: "POST",
    token,
    corpo: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: para,
      type: "text",
      text: { preview_url: false, body: texto },
    },
  });
  const wamid = r.messages?.[0]?.id;
  if (!wamid) throw new Error("A Meta não retornou o id da mensagem.");
  return { wamid, para };
}

/** Valida a assinatura X-Hub-Signature-256 do webhook (HMAC SHA256 com o App Secret). */
export function assinaturaConfere(corpoBruto: string, cabecalho: string | null): boolean {
  const segredo = metaAppSecret();
  if (!segredo || !cabecalho || !cabecalho.startsWith("sha256=")) return false;
  const esperado = createHmac("sha256", segredo).update(corpoBruto, "utf8").digest("hex");
  const recebido = cabecalho.slice(7);
  const a = Buffer.from(recebido, "utf8");
  const b = Buffer.from(esperado, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
