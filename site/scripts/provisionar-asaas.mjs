/**
 * Lê ASAAS_* de .env.local, registra o webhook no Asaas e
 * sincroniza as variáveis no Vercel (production).
 *
 * Uso (na pasta site/):
 *   node scripts/provisionar-asaas.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(raiz, ".env.local");

function carregarEnv(caminho) {
  if (!existsSync(caminho)) throw new Error(`Arquivo ausente: ${caminho}`);
  const mapa = {};
  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const t = linha.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    mapa[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return mapa;
}

function vercelEnv(nome, valor) {
  const r = spawnSync(
    "npx",
    ["vercel", "env", "add", nome, "production", "--value", valor, "--sensitive", "--force", "--yes"],
    { cwd: raiz, encoding: "utf8", shell: true },
  );
  if (r.status !== 0) {
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    throw new Error(`Falha ao gravar ${nome} no Vercel`);
  }
  console.log(`Vercel production: ${nome} ok`);
}

async function asaas(base, chave, caminho, metodo, corpo) {
  const headers = {
    access_token: chave,
    "User-Agent": "GuiX.net/provisionar-asaas",
    "Content-Type": "application/json",
  };
  const res = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await res.text();
  let json = {};
  try {
    json = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(`Asaas respondeu inválido (${res.status}): ${texto.slice(0, 200)}`);
  }
  if (!res.ok) {
    const desc = (json.errors || []).map((e) => e.description).filter(Boolean).join(" ");
    throw new Error(desc || `Asaas HTTP ${res.status}`);
  }
  return json;
}

const env = carregarEnv(envPath);
const chave = env.ASAAS_API_KEY || "";
const base = (env.ASAAS_API_URL || "https://api.asaas.com/v3").replace(/\/$/, "");
const token = env.ASAAS_WEBHOOK_TOKEN || "";
const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");
const webhookUrl = `${siteUrl}/api/webhooks/asaas`;

if (!chave || chave.includes("cole") || chave.includes("xxxx")) {
  console.error("Cole a chave real em ASAAS_API_KEY no arquivo .env.local e rode de novo.");
  process.exit(1);
}
if (!token || token.length < 32) {
  console.error("ASAAS_WEBHOOK_TOKEN precisa ter ao menos 32 caracteres.");
  process.exit(1);
}

console.log("Validando chave Asaas…");
await asaas(base, chave, "/myAccount", "GET");
console.log("Chave válida.");

console.log("Listando webhooks…");
const lista = await asaas(base, chave, "/webhooks", "GET");
const existentes = Array.isArray(lista.data) ? lista.data : Array.isArray(lista) ? lista : [];
const mesmoUrl = existentes.find((w) => (w.url || "").replace(/\/$/, "") === webhookUrl);

const corpoWebhook = {
  name: "GuiX recebimento",
  url: webhookUrl,
  email: "atendimento@guix.net.br",
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  authToken: token,
  sendType: "SEQUENTIALLY",
  events: [
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED",
    "PAYMENT_OVERDUE",
    "PAYMENT_DELETED",
    "PAYMENT_REFUNDED",
  ],
};

if (mesmoUrl?.id) {
  console.log(`Atualizando webhook ${mesmoUrl.id}…`);
  await asaas(base, chave, `/webhooks/${mesmoUrl.id}`, "PUT", corpoWebhook);
} else {
  console.log("Criando webhook…");
  const criado = await asaas(base, chave, "/webhooks", "POST", corpoWebhook);
  console.log(`Webhook criado: ${criado.id || "ok"}`);
}

console.log("Sincronizando variáveis no Vercel (production)…");
vercelEnv("ASAAS_API_KEY", chave);
vercelEnv("ASAAS_API_URL", base);
vercelEnv("ASAAS_WEBHOOK_TOKEN", token);

console.log("\nPronto.");
console.log(`Webhook: ${webhookUrl}`);
console.log("Faça o redeploy da production (vercel --prod) para a chave valer no ar.");
