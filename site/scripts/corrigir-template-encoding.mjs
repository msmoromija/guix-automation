// Re-salva o template de mensagem com UTF-8 correto, eliminando o mojibake.
// Uso: node scripts/corrigir-template-encoding.mjs
import { readFileSync } from "node:fs";

const ENV_PATH = new URL("../.env.local", import.meta.url);
const env = {};
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
  if (m) env[m[1]] = m[2];
}

// A senha do painel comercial está hardcoded no código-fonte.
const SENHA = "19881986";
const BASE = "https://guix.net.br";

const headers = {
  "x-painel-token": SENHA,
  "Content-Type": "application/json; charset=utf-8",
};

// 1. Lê a config atual
const getRes = await fetch(`${BASE}/api/painel/prospeccao`, { headers });
if (!getRes.ok) {
  console.error("Falha ao ler config:", getRes.status);
  process.exit(1);
}
const config = (await getRes.json()).config;

// 2. Monta o template correto em UTF-8
const templateCorreto = {
  id: config.templates?.[0]?.id || "padrao",
  nome: config.templates?.[0]?.nome || "Introdução + Case Local",
  texto: [
    "Olá, {{nome}}! Tudo bem por aí?",
    "",
    "Aqui é a {{remetente}}. Percebi que vocês são especializados em {{nicho}} em {{cidade}}.",
    "",
    "Ajudamos negócios como o seu a ter um site profissional que gera mais leads qualificados e enche a agenda.",
    "",
    "Gostaria de ver um modelo?",
    "Veja no link abaixo: {{modelo_url}}",
    "",
    "Abraço,",
    "{{remetente}}",
  ].join("\n"),
};

// 3. PATCH de volta
const patchRes = await fetch(`${BASE}/api/painel/prospeccao`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ templates: [templateCorreto] }),
});

if (!patchRes.ok) {
  console.error("Falha ao salvar:", patchRes.status, await patchRes.text());
  process.exit(1);
}

const salvo = await patchRes.json();
console.log("Template salvo com sucesso.");
console.log("--- texto salvo ---");
console.log(salvo.config.templates[0].texto);
