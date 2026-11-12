#!/usr/bin/env node
/**
 * Baixa o pacote.zip de um pedido pago (painel GuiX) e monta o projeto.
 *
 * Uso:
 *   node scripts/baixar-e-processar-pedido.mjs --pedido pay_xxx --token 19881986
 *
 * --token = senha do painel comercial (pedidos/cupons), a mesma do /painel/pedidos.
 * NEXT_PUBLIC_SITE_URL — default https://guix.net.br
 */
import path from "path";
import { spawnSync } from "child_process";
import { mkdir } from "fs/promises";
import { ROOT, arg, flag, baixarArquivo } from "./lib/pacote-utils.mjs";

const pedido = arg("pedido") || arg("id");
const token =
  arg("token") ||
  process.env.GUIX_PAINEL_SENHA ||
  process.env.PAINEL_MIDIA_TOKEN ||
  process.env.GUIX_OPS_TOKEN ||
  "";
const base = (arg("base") || process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(
  /\/$/,
  "",
);

if (!pedido) {
  console.error(
    "Uso: node scripts/baixar-e-processar-pedido.mjs --pedido <cobrancaAsaasId> [--token senhaPainel] [--cliente slug] [--install]",
  );
  process.exit(1);
}
if (!token) {
  console.error("Informe --token (senha do /painel/pedidos) ou GUIX_PAINEL_SENHA");
  process.exit(1);
}

const url = `${base}/api/painel/pedidos/${encodeURIComponent(pedido)}/pacote.zip?token=${encodeURIComponent(token)}`;
const inbox = path.join(ROOT, "clientes", "_inbox");
await mkdir(inbox, { recursive: true });
const zipPath = path.join(inbox, `${pedido}-pacote.zip`);

console.log(`↓ baixando pacote do pedido ${pedido}`);
try {
  await baixarArquivo(url, zipPath);
} catch (e) {
  // API pode exigir Authorization Bearer em vez de query
  const res = await fetch(`${base}/api/painel/pedidos/${encodeURIComponent(pedido)}/pacote.zip`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(e instanceof Error ? e.message : e);
    console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const { writeFile } = await import("fs/promises");
  await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
}

console.log(`  → ${zipPath}`);

const args = [
  path.join(ROOT, "scripts", "processar-pacote-zip.mjs"),
  "--zip",
  zipPath,
];
if (arg("cliente")) args.push("--cliente", arg("cliente"));
if (arg("out")) args.push("--out", arg("out"));
if (flag("install")) args.push("--install");
if (flag("build")) args.push("--build");
if (flag("skip-git")) args.push("--skip-git");

const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit", encoding: "utf8" });
process.exit(r.status || 0);
