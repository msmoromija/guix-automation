#!/usr/bin/env node
/**
 * CLI local: gera site.json via API do site (dev) ou imprime uso.
 *
 * Ex.:
 *   node --env-file=site/.env.local scripts/gerar-site-cliente.mjs \
 *     --cliente demo --nicho barbearia --nome "Barbearia Teste" --cidade Aracaju
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] || fallback;
}

const clienteId = arg("cliente", "demo");
const nicho = arg("nicho", "barbearia");
const nome = arg("nome");
const cidade = arg("cidade", "");
const base = (arg("base", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")).replace(/\/$/, "");
const token = process.env.PAINEL_MIDIA_TOKEN || "";
const out = arg("out", path.join("clientes", clienteId, "config", "site.json"));

if (!nome) {
  console.error("Uso: --nome Obrigatório [--cliente id] [--nicho barbearia] [--cidade X] [--out path]");
  process.exit(1);
}

const res = await fetch(`${base}/api/automacao/gerar-site`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-painel-token": token,
    "x-cliente-id": clienteId,
  },
  body: JSON.stringify({
    nome,
    nicho,
    cidade,
    whatsapp: arg("whatsapp", ""),
    telefone: arg("telefone", ""),
    gravarPacote: false,
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error(data.erro || data);
  process.exit(1);
}

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(data.site, null, 2), "utf8");
console.log(`ok ${out}`);
console.log(`avisos: ${(data.avisos || []).join(" · ") || "nenhum"}`);
console.log(`imagens: ${(data.imagens || []).map((i) => `${i.categoria}:${i.origem}`).join(", ")}`);
