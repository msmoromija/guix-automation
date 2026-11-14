#!/usr/bin/env node
/**
 * Migra o módulo de prospecção do armazenamento em arquivos JSON no R2
 * para o banco (Turso/libSQL).
 *
 * O R2 era um "banco" improvisado: cada lead era um arquivo e o histórico de
 * buscas era um arquivo único reescrito inteiro a cada busca — o que impunha
 * tetos rígidos (60 pares nicho+cidade, 8 buscas por par, 5.000 IDs no índice).
 * Este script copia os dados para as tabelas indexadas e NÃO apaga nada do R2
 * (os arquivos originais ficam como backup).
 *
 * É IDEMPOTENTE: pode rodar quantas vezes quiser. Leads usam UPSERT; os demais
 * registros usam INSERT ... ON CONFLICT DO NOTHING (os ids do R2 são preservados).
 *
 * Pré-requisitos (.env.local ou variáveis de ambiente):
 *   - TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN em produção)
 *   - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *
 * Uso (a partir da raiz do repo):
 *   node site/scripts/migrar-prospeccao-db.mjs            # migra tudo
 *   node site/scripts/migrar-prospeccao-db.mjs --dry      # só conta, não grava
 *   node site/scripts/migrar-prospeccao-db.mjs --env=.env.producao
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// Config / env
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const envArg = args.find((a) => a.startsWith("--env="));
const envFile = envArg ? envArg.slice("--env=".length) : ".env.local";

function carregarEnv(arquivo) {
  if (!fs.existsSync(arquivo)) return false;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
  return true;
}

const carregou = carregarEnv(path.resolve(root, envFile));
console.log(`env: ${carregou ? envFile : "(nenhum arquivo — usando variáveis já definidas)"}`);

// ---------------------------------------------------------------------------
// Hook para importar os módulos .ts do app (mesmo padrão dos outros scripts)
// ---------------------------------------------------------------------------
const ts = require("typescript");
const Module = require("module");
const resolverOriginal = Module._resolveFilename;

Module._resolveFilename = function (request, parent, ...rest) {
  const resolvido = request.startsWith("@/") ? path.join(root, request.slice(2)) : request;
  return resolverOriginal.call(this, resolvido, parent, ...rest);
};

require.extensions[".ts"] = (modulo, arquivo) => {
  const fonte = fs.readFileSync(arquivo, "utf8");
  const compilado = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  modulo._compile(compilado, arquivo);
};

const db = require("../lib/prospeccao/db.ts");
const store = require("../lib/prospeccao/store.ts");
const r2 = require("../lib/media/r2.ts");
const { ListObjectsV2Command } = require("@aws-sdk/client-s3");

// ---------------------------------------------------------------------------
// Leituras do R2
// ---------------------------------------------------------------------------
async function baixarJson(key) {
  try {
    const buf = await r2.baixarObjeto(key);
    return JSON.parse(buf.toString("utf8"));
  } catch (e) {
    if (String(e?.name || e?.Code || "").match(/NoSuchKey|NotFound|404/)) return null;
    // Qualquer outro erro (ex.: permissão) deve aparecer, não ser engolido.
    throw e;
  }
}

async function listarTudo(prefix) {
  const client = r2.clienteR2();
  const { bucket } = r2.r2Config();
  const keys = [];
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );
    for (const o of out.Contents || []) {
      if (o.Key && !o.Key.endsWith("/.keep")) keys.push(o.Key);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Baixa em paralelo com concorrência limitada. */
async function emParalelo(itens, limite, fn) {
  const out = [];
  for (let i = 0; i < itens.length; i += limite) {
    const lote = itens.slice(i, i + limite);
    out.push(...(await Promise.all(lote.map(fn))));
  }
  return out;
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------
const SQL_ENVIO =
  "INSERT INTO envios (id, em, lead_id, nome, telefone, nicho, cidade, conta_id, conta_nome, mensagem, canal, wamid, status, erro) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING";

const SQL_MENSAGEM =
  "INSERT INTO mensagens (id, wamid, em, remetente, nome_contato, texto, tipo, phone_number_id, conta_id, conta_nome, lead_id) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING";

const SQL_SESSAO =
  "INSERT INTO busca_sessoes (id, nicho, cidade, cidade_norm, criado_em, atualizado_em) " +
  "VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (nicho, cidade_norm) DO NOTHING";

const SQL_EXECUCAO =
  "INSERT INTO busca_execucoes (id, sessao_id, numero, em, termo, filtros, total_bruto, total_exibido, resultados, ids) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

// Retroalimenta os external_ids exibidos (coluna `ids`) em execuções antigas —
// permite a UI reconstruir os resultados de buscas que não arquivaram o retrato.
const SQL_EXECUCAO_IDS =
  "UPDATE busca_execucoes SET ids = ? WHERE id = ? AND (ids IS NULL OR ids = '')";

const SQL_EXIBIDO =
  "INSERT INTO busca_exibidos (sessao_id, external_id) VALUES (?, ?) ON CONFLICT DO NOTHING";

const cidadeNorm = (c) => String(c || "").trim().toLowerCase();

async function migrarConfig() {
  const cfg = await baixarJson("prospeccao/config.json");
  if (!cfg) return "config: não encontrado no R2 (usará o padrão do app).";
  if (DRY) return "config: seria importado.";
  if (await db.lerKv("config")) return "config: já existe no banco — ignorado (para não sobrescrever).";
  await db.gravarKv("config", cfg);
  return "config: importado.";
}

async function migrarUso() {
  const uso = await baixarJson("prospeccao/_uso.json");
  if (!uso) return "cota (_uso): não encontrada no R2.";
  if (DRY) return "cota (_uso): seria importada.";
  if (await db.lerKv("uso")) return "cota (_uso): já existe no banco — ignorada.";
  await db.gravarKv("uso", uso);
  return "cota (_uso): importada.";
}

async function migrarLeads() {
  const keys = (await listarTudo("prospeccao/leads/")).filter(
    (k) => k.endsWith(".json") && !k.endsWith("_indice.json"),
  );
  console.log(`leads: ${keys.length} arquivo(s) no R2.`);
  if (DRY || !keys.length) return `leads: ${keys.length} (${DRY ? "dry" : "nada a fazer"}).`;

  const leads = (await emParalelo(keys, 16, baixarJson)).filter((l) => l && l.id);
  const TAM = 200;
  for (let i = 0; i < leads.length; i += TAM) {
    await store.salvarLeads(leads.slice(i, i + TAM));
    process.stdout.write(`\rleads: ${Math.min(i + TAM, leads.length)}/${leads.length}`);
  }
  process.stdout.write("\n");
  return `leads: ${leads.length} importado(s).`;
}

async function migrarEnvios() {
  const lista = (await baixarJson("prospeccao/_envios.json")) || [];
  if (!Array.isArray(lista) || !lista.length) return "envios: nada no R2.";
  if (DRY) return `envios: ${lista.length} (dry).`;
  const comandos = lista
    .filter((e) => e && e.id)
    .map((e) => ({
      sql: SQL_ENVIO,
      args: [
        e.id,
        e.em,
        e.lead_id ?? null,
        e.nome ?? null,
        e.telefone ?? null,
        e.nicho ?? null,
        e.cidade ?? null,
        e.conta_id ?? null,
        e.conta_nome ?? null,
        e.mensagem ?? null,
        e.canal ?? null,
        e.wamid ?? null,
        e.status ?? null,
        e.erro ?? null,
      ],
    }));
  await db.emLote(comandos);
  return `envios: ${comandos.length} importado(s).`;
}

async function migrarMensagens() {
  const lista = (await baixarJson("prospeccao/_mensagens.json")) || [];
  if (!Array.isArray(lista) || !lista.length) return "mensagens: nada no R2.";
  if (DRY) return `mensagens: ${lista.length} (dry).`;
  const comandos = lista
    .filter((m) => m && m.id)
    .map((m) => ({
      sql: SQL_MENSAGEM,
      args: [
        m.id,
        m.wamid ?? null,
        m.em,
        m.de ?? m.remetente ?? null,
        m.nome_contato ?? null,
        m.texto ?? "",
        m.tipo ?? "text",
        m.phone_number_id ?? null,
        m.conta_id ?? null,
        m.conta_nome ?? null,
        m.lead_id ?? null,
      ],
    }));
  await db.emLote(comandos);
  return `mensagens: ${comandos.length} importada(s).`;
}

async function migrarBuscas() {
  const arq = await baixarJson("prospeccao/_buscas.json");
  const sessoes = arq && Array.isArray(arq.sessoes) ? arq.sessoes : [];
  if (!sessoes.length) return "buscas: nada no R2.";
  if (DRY) {
    const totalExec = sessoes.reduce((n, s) => n + (s.buscas?.length || 0), 0);
    return `buscas: ${sessoes.length} sessão(ões) e ${totalExec} execução(ões) (dry).`;
  }

  let nExec = 0;
  for (const s of sessoes) {
    if (!s?.nicho || !s?.cidade) continue;
    const norm = cidadeNorm(s.cidade);
    const agora = s.atualizadoEm || new Date().toISOString();
    // Sessão: cria se não existir (id determinístico) e pega o id real.
    await db.executar(SQL_SESSAO, [
      `ss_${s.nicho}_${norm}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 120),
      s.nicho,
      s.cidade,
      norm,
      agora,
      agora,
    ]);
    const linha = await db.consultarUm(
      "SELECT id FROM busca_sessoes WHERE nicho = ? AND cidade_norm = ? LIMIT 1",
      [s.nicho, norm],
    );
    const sessaoId = linha?.id;
    if (!sessaoId) continue;

    const execucoes = Array.isArray(s.buscas) ? s.buscas : [];
    for (const e of execucoes) {
      if (!e?.id) continue;
      const ids = Array.isArray(e.ids) ? e.ids : [];
      await db.executar(SQL_EXECUCAO, [
        e.id,
        sessaoId,
        Number(e.numero || 0),
        e.em || agora,
        e.termo || "",
        JSON.stringify(e.filtros || {}),
        Number(e.totalBruto || 0),
        Number(e.totalExibido || 0),
        e.resultados ? JSON.stringify(e.resultados) : null,
        ids.length ? JSON.stringify(ids) : null,
      ]);
      // Backfill dos ids em execuções já migradas antes desta coluna existir.
      if (ids.length) await db.executar(SQL_EXECUCAO_IDS, [JSON.stringify(ids), e.id]);
      nExec++;
      if (ids.length) {
        await db.emLote(ids.map((id) => ({ sql: SQL_EXIBIDO, args: [sessaoId, id] })));
      }
    }
    process.stdout.write(`\rbuscas: ${s.nicho}/${s.cidade} — ${nExec} execução(ões)`);
  }
  process.stdout.write("\n");
  return `buscas: ${sessoes.length} sessão(ões) e ${nExec} execução(ões) importada(s).`;
}

async function principal() {
  if (!db.bancoConfigurado()) {
    throw new Error("TURSO_DATABASE_URL não configurada. Defina no .env.local ou no ambiente.");
  }
  if (!DRY) {
    await db.garantirSchema();
    console.log("banco: schema garantido.");
  } else {
    console.log("modo DRY — nada será gravado.");
  }

  const resultados = [];
  resultados.push(await migrarConfig());
  resultados.push(await migrarUso());
  resultados.push(await migrarLeads());
  resultados.push(await migrarEnvios());
  resultados.push(await migrarMensagens());
  resultados.push(await migrarBuscas());

  console.log("\n--- resumo ---");
  for (const r of resultados) console.log("• " + r);
  console.log("\nConcluído. Os arquivos originais seguem no R2 como backup.");
}

principal().catch((e) => {
  console.error("\nFalha na migração:", e?.message || e);
  process.exitCode = 1;
});
