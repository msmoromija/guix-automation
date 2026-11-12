#!/usr/bin/env node
/**
 * Entrada principal: recebe o ZIP GuiX (todas as infos do projeto) e monta o site-cliente.
 *
 * Uso:
 *   node scripts/processar-pacote-zip.mjs --zip caminho/guix-TOKEN-pacote.zip
 *   node scripts/processar-pacote-zip.mjs --zip pacote.zip --cliente lucia-batos
 *   node scripts/processar-pacote-zip.mjs --zip pacote.zip --install   # npm install no projeto
 *   node scripts/processar-pacote-zip.mjs --url "https://…/pacote.zip" --cliente demo
 *
 * Fluxo:
 * 1. Baixa (se --url) ou usa o ZIP local
 * 2. Extrai meta/site/visual/assets
 * 3. Chama montar-projeto-cliente.mjs (template do nicho + injeção)
 * 4. Opcional: npm install / npm run build
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import {
  ROOT,
  arg,
  flag,
  existe,
  extrairZip,
  baixarArquivo,
  lerJson,
  localizarRaizPacote,
  montarClienteId,
  resolverNicho,
} from "./lib/pacote-utils.mjs";

const zipArg = arg("zip");
const urlArg = arg("url");

if (!zipArg && !urlArg) {
  console.error(`Uso:
  node scripts/processar-pacote-zip.mjs --zip <arquivo.zip> [--cliente slug] [--out pasta]
  node scripts/processar-pacote-zip.mjs --url <https://…/pacote.zip> [--cliente slug]

Opções:
  --cliente   slug do cliente (default: nome do meta.json)
  --out       pasta do repo (default: clientes/<slug>/repo)
  --workdir   onde extrair o ZIP (default: clientes/<slug>/pacote)
  --install   roda npm install após montar
  --build     roda npm run build após install
  --skip-git  não inicializa git
`);
  process.exit(1);
}

const workRoot = path.join(ROOT, "clientes", "_inbox");
await mkdir(workRoot, { recursive: true });

let zipPath = zipArg ? path.resolve(zipArg) : "";
if (urlArg) {
  const nome = `download-${Date.now()}.zip`;
  zipPath = path.join(workRoot, nome);
  console.log(`↓ baixando ${urlArg}`);
  await baixarArquivo(urlArg, zipPath);
  console.log(`  salvo em ${zipPath}`);
}

if (!(await existe(zipPath))) {
  console.error(`ZIP não encontrado: ${zipPath}`);
  process.exit(1);
}

// Pré-extrai em temp para ler meta e decidir slug
const tempExtract = path.join(workRoot, `extract-${Date.now()}`);
const { raiz: raizTemp } = await extrairZip(zipPath, tempExtract);
const meta = (await lerJson(path.join(raizTemp, "meta.json"), false)) || {};
const site = (await lerJson(path.join(raizTemp, "site.json"), false)) || {};
const clienteId = montarClienteId(meta, arg("cliente"));
const nicho = resolverNicho(meta, site);

const workdir = path.resolve(
  ROOT,
  arg("workdir", path.join("clientes", clienteId, "pacote")),
);
const outRepo = path.resolve(
  ROOT,
  arg("out", path.join("clientes", clienteId, "repo")),
);

console.log(`→ cliente ${clienteId} · nicho ${nicho}`);
console.log(`→ extraindo para ${workdir}`);

const { raiz } = await extrairZip(zipPath, workdir);

// Guarda cópia do ZIP original no cliente
const zipDest = path.join(path.dirname(workdir), path.basename(zipPath));
if (path.resolve(zipPath) !== path.resolve(zipDest)) {
  try {
    const { copyFile } = await import("fs/promises");
    await copyFile(zipPath, zipDest);
  } catch {
    /* opcional */
  }
}

await writeFile(
  path.join(path.dirname(workdir), "ORIGEM.json"),
  JSON.stringify(
    {
      processadoEm: new Date().toISOString(),
      zip: zipPath,
      url: urlArg || null,
      clienteId,
      nicho,
      token: meta.token || null,
      nome: meta.nome || null,
      raizPacote: raiz,
      repo: outRepo,
    },
    null,
    2,
  ),
  "utf8",
);

const montarArgs = [
  path.join(ROOT, "scripts", "montar-projeto-cliente.mjs"),
  "--pacote",
  raiz,
  "--cliente",
  clienteId,
  "--out",
  outRepo,
];
if (flag("skip-git")) montarArgs.push("--skip-git");

console.log("→ montando projeto…");
const montar = spawnSync(process.execPath, montarArgs, {
  cwd: ROOT,
  encoding: "utf8",
  stdio: "inherit",
});
if (montar.status !== 0) {
  console.error("montar-projeto-cliente falhou");
  process.exit(montar.status || 1);
}

if (flag("install") || flag("build")) {
  console.log("→ npm install…");
  const inst = spawnSync("npm", ["install"], {
    cwd: outRepo,
    encoding: "utf8",
    stdio: "inherit",
    shell: true,
  });
  if (inst.status !== 0) {
    console.error("npm install falhou");
    process.exit(inst.status || 1);
  }
}

if (flag("build")) {
  console.log("→ npm run build…");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: outRepo,
    encoding: "utf8",
    stdio: "inherit",
    shell: true,
  });
  if (build.status !== 0) {
    console.error("npm run build falhou");
    process.exit(build.status || 1);
  }
}

// limpa temp
try {
  const { rm } = await import("fs/promises");
  await rm(tempExtract, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log("");
console.log("══════════════════════════════════════");
console.log(" Pacote processado — projeto pronto");
console.log(`  ZIP:     ${zipPath}`);
console.log(`  Pacote:  ${raiz}`);
console.log(`  Projeto: ${outRepo}`);
console.log(`  Dev:     cd ${path.relative(ROOT, outRepo)} && npm install && npm run dev`);
console.log("══════════════════════════════════════");
