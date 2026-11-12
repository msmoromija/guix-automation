#!/usr/bin/env node
/**
 * Semeia a biblioteca compartilhada do R2 com fotos contextualizadas por nicho.
 *
 * - Busca no Unsplash (1 requisição de busca por categoria; a chave demo tem
 *   50 req/h, então rode em lotes — o script é idempotente e retoma de onde parou).
 * - Baixa do CDN (imagens.unsplash.com), valida resolução do slot e enquadra em WebP.
 * - Curadoria opcional por visão (gpt-4o-mini) para descartar foto fora de contexto.
 * - Grava em `imagens/{nicho}/{categoria}/unsplash_{id}.webp` com tags do nicho,
 *   ficando compatível com `melhorDoR2` (escolher-imagens.ts).
 *
 * Uso (a partir da raiz do repo):
 *   node site/scripts/semear-catalogo.mjs                        # todos os nichos, 10 por categoria
 *   node site/scripts/semear-catalogo.mjs --nichos=barbearia     # um nicho
 *   node site/scripts/semear-catalogo.mjs --nichos=barbearia,salao --por=10
 *   node site/scripts/semear-catalogo.mjs --categorias=hero,sobre
 *   node site/scripts/semear-catalogo.mjs --dry --sem-visao      # simulação
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Config / env
// ---------------------------------------------------------------------------
function carregarEnv(arquivo) {
  if (!fs.existsSync(arquivo)) throw new Error(`.env não encontrado: ${arquivo}`);
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
carregarEnv(path.join(ROOT, ".env.local"));

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  UNSPLASH_ACCESS_KEY,
  OPENAI_API_KEY,
} = process.env;
const BUCKET = process.env.R2_BUCKET || "guix-imagens";
const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error("R2: credenciais ausentes em .env.local");
if (!UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY ausente em .env.local");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// Config real do app (type-stripping nativo do Node para os .ts).
const { BUSCA_FOTO, tagsDoNicho, REGRA_NICHO } = await import(
  pathToFileURL(path.join(ROOT, "lib/media/catalogo.ts")).href
);
const { SLOTS } = await import(pathToFileURL(path.join(ROOT, "lib/media/slots.ts")).href);

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] === undefined ? "true" : m[2]] : [a, "true"];
  }),
);
const flag = (nome) => args[nome] !== undefined && args[nome] !== "false";
const ALVO = Number(args.por || 10);
const SEM_VISAO = flag("sem-visao");
const DRY = flag("dry");
const REF = flag("refazer");
const PAGINA = Number(args.pagina || 1);
const LIMITE_REQ = Number(args["limite-req"] || 45);
const LOTE_VISAO = Number(args["lote-visao"] || 4);

const CATEGORIAS = ["hero", "sobre", "servico", "profissional", "galeria", "promocao", "evento"];
const TODOS_NICHOS = Object.keys(BUSCA_FOTO).filter((n) => n !== "generico");

function lista(nome, todos) {
  const v = args[nome];
  if (!v || v === "all") return todos;
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}
const NICHOS = lista("nichos", TODOS_NICHOS);
const CATS = lista("categorias", CATEGORIAS);

// query do nicho por categoria (promocao→hero, evento→galeria) + cadeia de fallback
const MAPA_QUERY = { hero: "hero", sobre: "sobre", servico: "servico", profissional: "profissional", galeria: "galeria", promocao: "hero", evento: "galeria" };
const ORIENT = { hero: "landscape", promocao: "landscape", evento: "landscape", servico: "landscape", sobre: "portrait", profissional: "squarish", galeria: "squarish" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let reqUsadas = 0;
let restante = Infinity;
let parar = false;

/** Cache de buscas na mesma execução: promocao reaproveita a busca de hero,
 *  evento reaproveita a de galeria quando a orientação coincide. */
const CACHE_BUSCA = new Map();

const log = (...a) => console.log(...a);

function extrairId(key) {
  const m = key.match(/unsplash_([A-Za-z0-9_-]+)\.webp$/);
  return m ? m[1] : null;
}

/** Lê o nicho inteiro de uma vez: contagem por categoria + ids já usados (dedup). */
async function listarNicho(nicho) {
  const prefix = `imagens/${nicho}/`;
  const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 1000 }));
  const chaves = (out.Contents || []).map((o) => o.Key).filter((k) => k && !k.endsWith("/.keep"));
  const porCategoria = {};
  const ids = new Set();
  for (const k of chaves) {
    const categoria = k.slice(prefix.length).split("/")[0];
    porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;
    const id = extrairId(k);
    if (id) ids.add(id);
  }
  return { chaves, porCategoria, ids };
}

/** Remove apenas os arquivos semeados (unsplash_*.webp) de um nicho. */
async function limparNicho(nicho) {
  const { chaves } = await listarNicho(nicho);
  const alvos = chaves.filter((k) => /unsplash_[A-Za-z0-9_-]+\.webp$/.test(k));
  for (let i = 0; i < alvos.length; i += 900) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: alvos.slice(i, i + 900).map((Key) => ({ Key })) },
      }),
    );
  }
  return alvos.length;
}

function cadeiaQuery(nicho, categoria) {
  const q = BUSCA_FOTO[nicho]?.query || {};
  const principal = q[MAPA_QUERY[categoria]] || q.galeria || q.hero;
  return [principal, q.galeria, q.hero, q.sobre].filter((x, i, a) => x && a.indexOf(x) === i);
}

function textoBloqueado(texto, bloquear = []) {
  const t = texto.toLowerCase();
  return bloquear.some((b) => t.includes(b.toLowerCase()));
}

/** S3 exige valores de metadata em ASCII: normaliza acentos e remove o restante. */
const ascii = (s, max = 900) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .slice(0, max);

async function buscar(query, categoria, orient = ORIENT[categoria] || "landscape") {
  if (parar || reqUsadas >= LIMITE_REQ) return [];
  const chave = `${query}|${orient}`;
  if (CACHE_BUSCA.has(chave)) return CACHE_BUSCA.get(chave);
  const p = new URLSearchParams({ query, per_page: "30", page: String(PAGINA) });
  if (orient) p.set("orientation", orient);
  const r = await fetch(`https://api.unsplash.com/search/photos?${p}`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" },
  });
  reqUsadas++;
  const rest = r.headers.get("x-ratelimit-remaining");
  if (rest !== null) restante = Number(rest);
  if (r.status !== 200) {
    log(`  ! busca "${query}" falhou: HTTP ${r.status} (restante=${rest})`);
    if (r.status === 403) parar = true;
    return [];
  }
  const j = await r.json();
  const fotos = (j.results || []).map((f) => ({
    id: f.id,
    alt: f.alt_description || f.description || query,
    regular: f.urls?.regular,
    raw: f.urls?.raw || f.urls?.full,
    fotografo: f.user?.name || "",
    perfil_url: f.user?.links?.html || "",
    unsplash_url: f.links?.html || "",
  }));
  log(`  · busca "${query}" [${orient || "any"}] → ${fotos.length} resultados (req ${reqUsadas}, restante ${restante})`);
  if (restante <= 1) parar = true;
  CACHE_BUSCA.set(chave, fotos);
  return fotos;
}

/** Busca e, se a orientação restringiu demais (0 resultados), tenta sem orientação. */
async function buscarComFallback(query, categoria) {
  let achados = await buscar(query, categoria);
  if (!achados.length && ORIENT[categoria] && !parar) {
    achados = await buscar(query, categoria, "");
  }
  return achados;
}

function urlDownload(foto) {
  const base = foto.raw || foto.regular;
  if (!base) return null;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}w=2400&q=85&fm=jpg&fit=max&auto=format`;
}

async function baixarImagem(foto) {
  const url = urlDownload(foto);
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}

function dimsOk(meta, slot) {
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (w < slot.minW || h < slot.minH) return false;
  const escala = Math.max(slot.outW / w, slot.outH / h);
  return escala <= 1.02; // sem upscale
}

// ---------------------------------------------------------------------------
// Curadoria por visão (lote)
// ---------------------------------------------------------------------------
async function curarComVisao(nicho, categoria, itens) {
  const sistema = [
    "Você é curador de banco de imagens para sites de negócios locais.",
    "Você recebe fotos com o nicho e o papel (categoria) de cada uma no site.",
    "Aprove (ok=true) só quando a foto é claramente adequada: contexto do nicho correto, sem elementos de outro segmento e apropriada ao papel. Ex.: categoria 'profissional' pede um retrato humano; 'hero' pede ambiente/atendimento amplo do ofício.",
    "Reprove (ok=false) foto genérica fora de contexto (ex.: escritório vazio para barbearia), objeto de outro ofício, ou que não sirva ao papel.",
    "Responda SOMENTE JSON no formato {\"avaliacoes\":[{\"i\":0,\"ok\":true,\"motivo\":\"curto\"}]}, uma entrada por foto recebida.",
    REGRA_NICHO[nicho] || "",
  ].join(" ");
  const conteudo = [
    {
      type: "text",
      text: JSON.stringify({ nicho, categoria, fotos: itens.map((it, i) => ({ i, alt: it.alt })) }),
    },
  ];
  for (let i = 0; i < itens.length; i++) {
    let b64;
    try {
      b64 = (await sharp(itens[i].buf).resize(512, 512, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer()).toString("base64");
    } catch {
      continue;
    }
    conteudo.push({ type: "text", text: `Foto i=${i}` });
    conteudo.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}`, detail: "low" } });
  }
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sistema },
          { role: "user", content: conteudo },
        ],
      }),
    });
    if (!r.ok) {
      log(`  ! visão falhou: HTTP ${r.status} — mantendo todas`);
      return itens;
    }
    const data = await r.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const avals = Array.isArray(parsed.avaliacoes) ? parsed.avaliacoes : [];
    const aprovados = itens.filter((_, i) => {
      const a = avals.find((x) => Number(x.i) === i);
      return a ? a.ok !== false : true; // sem veredito → mantém
    });
    for (const a of avals) {
      const it = itens[Number(a.i)];
      if (it && a.ok === false) log(`  – reprovada (visão): ${it.id} — ${a.motivo || ""}`);
    }
    return aprovados;
  } catch (e) {
    log(`  ! visão erro: ${e.message} — mantendo todas`);
    return itens;
  }
}

// ---------------------------------------------------------------------------
// Semeadura
// ---------------------------------------------------------------------------
async function semearCategoria(nicho, categoria, alvo, ctx) {
  const slot = SLOTS[categoria];
  const prefix = `imagens/${nicho}/${categoria}/`;
  const existentes = ctx.porCategoria[categoria] || 0;
  if (existentes >= alvo) return { nicho, categoria, existentes, adicionadas: 0, pulado: true, idsAdicionados: [] };
  const faltam = alvo - existentes;
  log(`\n▶ ${nicho}/${categoria} — ${existentes} no R2, faltam ${faltam}`);

  // 1) buscar candidatos (evita ids já usados em outras categorias do mesmo nicho)
  const cfg = BUSCA_FOTO[nicho] || {};
  const vistos = new Set();
  const candidatos = [];
  for (const query of cadeiaQuery(nicho, categoria)) {
    if (parar || candidatos.length >= faltam * 3 + 8) break;
    const achados = await buscarComFallback(query, categoria);
    for (const f of achados) {
      if (vistos.has(f.id) || ctx.usados.has(f.id)) continue;
      if (cfg.bloquearIds?.includes(f.id)) continue;
      if (textoBloqueado(`${f.alt} ${f.fotografo}`, cfg.bloquear)) continue;
      vistos.add(f.id);
      candidatos.push(f);
    }
  }
  if (!candidatos.length) return { nicho, categoria, existentes, adicionadas: 0, vazio: true, idsAdicionados: [] };

  // 2) baixar + validar resolução (pool maior que o necessário p/ a curadoria)
  const poolMax = Math.min(candidatos.length, faltam * 2 + 4);
  const validos = [];
  for (const c of candidatos) {
    if (validos.length >= poolMax) break;
    const buf = await baixarImagem(c);
    if (!buf) continue;
    let meta;
    try {
      meta = await sharp(buf).metadata();
    } catch {
      continue;
    }
    if (!dimsOk(meta, slot)) continue;
    validos.push({ ...c, buf });
  }
  if (!validos.length) return { nicho, categoria, existentes, adicionadas: 0, vazio: true, idsAdicionados: [] };

  // 3) curadoria por visão (em lotes)
  let aprovados = validos;
  if (!SEM_VISAO && OPENAI_API_KEY) {
    aprovados = [];
    for (let i = 0; i < validos.length; i += LOTE_VISAO) {
      const lote = validos.slice(i, i + LOTE_VISAO);
      aprovados.push(...(await curarComVisao(nicho, categoria, lote)));
      if (aprovados.length >= faltam) break;
    }
  }

  // 4) enquadrar + subir
  let adicionadas = 0;
  const enviados = [];
  const idsAdicionados = [];
  for (const v of aprovados) {
    if (adicionadas >= faltam) break;
    let proc;
    try {
      proc = await sharp(v.buf).rotate().resize(slot.outW, slot.outH, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    } catch {
      continue;
    }
    const key = `${prefix}unsplash_${v.id}.webp`;
    const tags = ["unsplash", nicho, categoria, ...tagsDoNicho(nicho)];
    ctx.usados.add(v.id);
    idsAdicionados.push(v.id);
    if (DRY) {
      log(`  + [dry] ${key}`);
      adicionadas++;
      continue;
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: proc.data,
        ContentType: "image/webp",
        Metadata: {
          origem: "unsplash",
          status: "aprovada",
          alt: ascii(v.alt),
          tags: ascii(tags.join(",")),
          categoria,
          width: String(proc.info.width),
          height: String(proc.info.height),
          credito_fotografo: ascii(v.fotografo, 120),
          credito_perfil: ascii(v.perfil_url, 300),
          credito_unsplash: ascii(v.unsplash_url, 300),
          credito_texto: ascii(`Photo by ${v.fotografo} on Unsplash`, 200),
        },
      }),
    );
    enviados.push(PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : key);
    adicionadas++;
  }
  if (!DRY && enviados[0]) log(`  ✓ primeira: ${enviados[0]}`);
  return { nicho, categoria, existentes, adicionadas, idsAdicionados };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
log(`Semear catálogo → nichos: ${NICHOS.join(", ")}`);
log(`categorias: ${CATS.join(", ")} | alvo ${ALVO}/categoria | visão ${SEM_VISAO ? "OFF" : "ON"} | ${DRY ? "DRY-RUN" : "REAL"} | limite ${LIMITE_REQ} req`);
log(`R2: ${BUCKET} | CDN: ${PUBLIC_BASE || "(sem R2_PUBLIC_BASE_URL)"}\n`);

const resumo = [];
for (const nicho of NICHOS) {
  if (REF) {
    if (DRY) {
      log(`\n↺ ${nicho}: [dry] limparia as imagens semeadas`);
    } else {
      const removidas = await limparNicho(nicho);
      log(`\n↺ ${nicho}: --refazer removeu ${removidas} imagens semeadas`);
    }
  }

  const lista = await listarNicho(nicho);
  const ctx = { porCategoria: { ...lista.porCategoria }, usados: REF ? new Set() : new Set(lista.ids) };
  log(`\n■ Nicho ${nicho} — ${Object.values(lista.porCategoria).reduce((s, n) => s + n, 0)} imagens no R2`);

  for (const categoria of CATS) {
    if (parar || reqUsadas >= LIMITE_REQ) break;
    try {
      const r = await semearCategoria(nicho, categoria, ALVO, ctx);
      ctx.porCategoria[categoria] = (ctx.porCategoria[categoria] || 0) + (r.adicionadas || 0);
      resumo.push(r);
    } catch (e) {
      log(`  ! erro em ${nicho}/${categoria}: ${e.message}`);
      resumo.push({ nicho, categoria, erro: e.message, adicionadas: 0 });
    }
  }
  if (parar || reqUsadas >= LIMITE_REQ) {
    log(`\n⏸ Limite de requisições atingido (${reqUsadas} usadas, restante ${restante}). Rode novamente em ~1h para continuar.`);
    break;
  }
}

const totalAdicionado = resumo.reduce((s, r) => s + (r.adicionadas || 0), 0);
log(`\n=== Resumo ===`);
for (const r of resumo) {
  if (r.pulado) log(`  = ${r.nicho}/${r.categoria}: já tinha ${r.existentes} (pulado)`);
  else if (r.erro) log(`  ! ${r.nicho}/${r.categoria}: ${r.erro}`);
  else if (r.vazio) log(`  · ${r.nicho}/${r.categoria}: sem resultados válidos`);
  else log(`  + ${r.nicho}/${r.categoria}: +${r.adicionadas} (total ${r.existentes + r.adicionadas})`);
}
log(`\nTotal nesta execução: ${totalAdicionado} imagens | requisições Unsplash: ${reqUsadas} | restante: ${restante}`);
