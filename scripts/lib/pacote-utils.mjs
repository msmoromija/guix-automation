/**
 * Utilitários compartilhados para processar o ZIP de entrega GuiX.
 */
import { createWriteStream } from "fs";
import { access, mkdir, readFile, readdir, rm, stat, writeFile, cp, copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const NICHOS = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
];

export function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] || fallback;
}

export function flag(name) {
  return process.argv.includes(`--${name}`);
}

export function slug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function existe(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function carregarJszip() {
  const candidatos = [
    path.join(ROOT, "site", "node_modules", "jszip", "lib", "index.js"),
    path.join(ROOT, "site", "node_modules", "jszip", "dist", "jszip.min.js"),
  ];
  for (const c of candidatos) {
    if (await existe(c)) {
      const mod = await import(pathToFileURL(c).href);
      return mod.default || mod;
    }
  }
  throw new Error(
    "JSZip não encontrado. Rode `npm install` em site/ (dependência jszip) antes de processar o pacote.",
  );
}

/** Localiza a pasta raiz do pacote (meta.json + site.json). */
export async function localizarRaizPacote(dir) {
  const direto = path.join(dir, "meta.json");
  if (await existe(direto)) return dir;

  const siteDireto = path.join(dir, "site.json");
  if (await existe(siteDireto)) return dir;

  const entradas = await readdir(dir, { withFileTypes: true });
  for (const e of entradas) {
    if (!e.isDirectory()) continue;
    const sub = path.join(dir, e.name);
    if (await existe(path.join(sub, "meta.json")) || (await existe(path.join(sub, "site.json")))) {
      return sub;
    }
  }
  throw new Error(`Pacote inválido em ${dir}: falta meta.json / site.json`);
}

export async function lerJson(arquivo, obrigatorio = true) {
  if (!(await existe(arquivo))) {
    if (obrigatorio) throw new Error(`Arquivo obrigatório ausente: ${arquivo}`);
    return null;
  }
  const raw = await readFile(arquivo, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

/**
 * Extrai ZIP GuiX para pasta de destino.
 * @returns {{ extracao: string, raiz: string }}
 */
export async function extrairZip(zipPath, destDir) {
  const absZip = path.resolve(zipPath);
  if (!(await existe(absZip))) throw new Error(`ZIP não encontrado: ${absZip}`);

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  const JSZip = await carregarJszip();
  const buf = await readFile(absZip);
  const zip = await JSZip.loadAsync(buf);

  const nomes = Object.keys(zip.files);
  for (const nome of nomes) {
    const entry = zip.files[nome];
    if (entry.dir) continue;
    const alvo = path.join(destDir, nome);
    await mkdir(path.dirname(alvo), { recursive: true });
    const content = await entry.async("nodebuffer");
    await writeFile(alvo, content);
  }

  const raiz = await localizarRaizPacote(destDir);
  return { extracao: destDir, raiz };
}

/** Reescreve ./assets/… → /assets/… no site.json (Vite public/). */
export function normalizarSrcAssets(valor) {
  if (Array.isArray(valor)) return valor.map(normalizarSrcAssets);
  if (!valor || typeof valor !== "object") return valor;
  const out = {};
  for (const [k, v] of Object.entries(valor)) {
    if (k === "src" && typeof v === "string") {
      out[k] = v.replace(/^\.\/assets\//, "/assets/").replace(/^assets\//, "/assets/");
    } else {
      out[k] = normalizarSrcAssets(v);
    }
  }
  return out;
}

export async function copiarTemplateNicho(nicho, destRepo) {
  const origem = path.join(ROOT, "prototipos", nicho);
  if (!(await existe(origem))) {
    throw new Error(`Template do nicho ausente: prototipos/${nicho}`);
  }

  await rm(destRepo, { recursive: true, force: true });
  await mkdir(path.dirname(destRepo), { recursive: true });

  await cp(origem, destRepo, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      if (["node_modules", ".git", "dist", ".vite", "coverage", ".turbo"].includes(base)) return false;
      return true;
    },
  });
}

export async function copiarAssets(raizPacote, destRepo) {
  const origem = path.join(raizPacote, "assets");
  const destino = path.join(destRepo, "public", "assets");
  if (!(await existe(origem))) return { copiados: 0 };
  await mkdir(destino, { recursive: true });
  await cp(origem, destino, { recursive: true });
  const arquivos = await listarArquivos(destino);
  return { copiados: arquivos.length };
}

async function listarArquivos(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await listarArquivos(full, acc);
    else acc.push(full);
  }
  return acc;
}

export async function baixarArquivo(url, destPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download falhou (${res.status}): ${url}`);
  await mkdir(path.dirname(destPath), { recursive: true });
  const body = Readable.fromWeb(res.body);
  await pipeline(body, createWriteStream(destPath));
  return destPath;
}

export function resolverNicho(meta, site) {
  const bruto = String(meta?.nicho || site?.nicho || site?.empresa?.nicho || "").toLowerCase().trim();
  if (NICHOS.includes(bruto)) return bruto;
  // aliases comuns
  const mapa = {
    salão: "salao",
    "salao de beleza": "salao",
    "pet shop": "petshop",
    pet: "petshop",
    advocacia: "advocacia",
    advogado: "advocacia",
    contador: "contabilidade",
    gym: "academia",
  };
  if (mapa[bruto]) return mapa[bruto];
  return "barbearia";
}

export function montarClienteId(meta, override = "") {
  if (override) return slug(override);
  return slug(meta?.nome || meta?.token || "cliente") || "cliente";
}
