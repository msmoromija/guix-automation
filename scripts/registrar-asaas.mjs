import { randomBytes } from "crypto";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function carregar(caminho) {
  if (!existsSync(caminho)) return;
  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const encontrado = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!encontrado || process.env[encontrado[1]]) continue;
    process.env[encontrado[1]] = encontrado[2].replace(/^"|"$/g, "");
  }
}

carregar(resolve("site/.env.local"));
carregar(resolve("site/.env"));

const chave = process.env.ASAAS_API_KEY?.trim();
const base = (process.env.ASAAS_API_URL || "https://api.asaas.com/v3").replace(/\/$/, "");
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://guix-woad.vercel.app").replace(/\/$/, "");
const url = `${site}/api/webhooks/asaas`;
const token = process.env.ASAAS_WEBHOOK_TOKEN?.trim() || randomBytes(32).toString("hex");

if (!chave) {
  console.error("Defina ASAAS_API_KEY em site/.env.local antes de registrar o webhook.");
  process.exit(1);
}

if (token.length < 32 || /\s/.test(token)) {
  console.error("ASAAS_WEBHOOK_TOKEN precisa ter de 32 a 255 caracteres, sem espaço.");
  process.exit(1);
}

const eventos = [
  "PAYMENT_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_PARTIALLY_REFUNDED",
  "PAYMENT_AWAITING_RISK_ANALYSIS",
  "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
];

const resposta = await fetch(`${base}/webhooks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    access_token: chave,
    "User-Agent": "GuiX/1.0",
  },
  body: JSON.stringify({
    name: "GuiX pagamentos",
    url,
    email: "atendimento@web.guix.com.br",
    enabled: true,
    interrupted: false,
    apiVersion: 3,
    authToken: token,
    sendType: "SEQUENTIALLY",
    events: eventos,
  }),
});

const json = await resposta.json().catch(() => ({}));
if (!resposta.ok) {
  console.error(json.errors?.map((item) => item.description).join(" ") || JSON.stringify(json));
  process.exit(1);
}

console.log(`Webhook ${json.id} apontando para ${url}`);
console.log("Guarde este token em ASAAS_WEBHOOK_TOKEN, na Vercel e em site/.env.local:");
console.log(token);
