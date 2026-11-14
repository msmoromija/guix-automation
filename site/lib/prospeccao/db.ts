import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient, type Client } from "@libsql/client";

/**
 * Camada de acesso ao banco (Turso/libSQL) do módulo de prospecção.
 *
 * Substitui o antigo esquema de arquivos JSON no R2: cada lead era um objeto
 * próprio e o histórico de buscas era um arquivo único reescrito inteiro a cada
 * busca — o que impunha tetos rígidos (60 pares nicho+cidade, 8 buscas por par,
 * 5.000 IDs no índice) e inviabilizava chegar a 1.000 buscas.
 *
 * Aqui os dados vivem em tabelas com índice, então o painel lista/filtra por
 * query (paginada) em vez de baixar e reescrever arquivos gigantes.
 *
 * Em produção aponte `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` para a base na
 * nuvem. No desenvolvimento local um arquivo serve: `file:./.data/prospeccao.db`.
 */

let _cliente: Client | null = null;
let _schemaPronto: Promise<void> | null = null;

export function urlBanco(): string {
  return (process.env.TURSO_DATABASE_URL || "").trim();
}

function tokenBanco(): string | undefined {
  const t = (process.env.TURSO_AUTH_TOKEN || "").trim();
  return t || undefined;
}

export function bancoConfigurado(): boolean {
  return Boolean(urlBanco());
}

export function cliente(): Client {
  if (_cliente) return _cliente;
  const url = urlBanco();
  if (!url) {
    throw new Error("TURSO_DATABASE_URL não configurada (banco da prospecção).");
  }
  // Modo arquivo (dev local): garante que a pasta exista antes de abrir.
  if (url.startsWith("file:")) {
    try {
      const caminho = url.slice("file:".length).replace(/^\/\//, "");
      if (caminho && caminho !== ":memory:") {
        mkdirSync(dirname(resolve(caminho)), { recursive: true });
      }
    } catch {
      // se não der para criar, o driver reporta o erro real de conexão
    }
  }
  _cliente = createClient({ url, authToken: tokenBanco() });
  return _cliente;
}

/**
 * Todas as tabelas do módulo. `CREATE ... IF NOT EXISTS` é idempotente, então
 * rodar a cada cold start é barato e dispensa um passo de migração manual.
 */
const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS leads (
     id TEXT PRIMARY KEY,
     nome TEXT NOT NULL DEFAULT '',
     telefone TEXT NOT NULL DEFAULT '',
     telefone_norm TEXT NOT NULL DEFAULT '',
     cidade TEXT NOT NULL DEFAULT '',
     nicho TEXT NOT NULL DEFAULT '',
     endereco TEXT NOT NULL DEFAULT '',
     categoria TEXT,
     site TEXT,
     email TEXT,
     status TEXT NOT NULL DEFAULT 'novo',
     data_ultimo_contato TEXT,
     conta_whatsapp TEXT,
     modelo_usado TEXT,
     mensagem_gerada TEXT,
     observacoes TEXT NOT NULL DEFAULT '',
     congelado INTEGER NOT NULL DEFAULT 0,
     arquivado INTEGER NOT NULL DEFAULT 0,
     external_id TEXT,
     fonte TEXT NOT NULL DEFAULT 'google',
     historico TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads (telefone_norm)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_nicho_cidade ON leads (nicho, cidade)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_external ON leads (external_id)`,

  `CREATE TABLE IF NOT EXISTS busca_sessoes (
     id TEXT PRIMARY KEY,
     nicho TEXT NOT NULL,
     cidade TEXT NOT NULL,
     cidade_norm TEXT NOT NULL,
     criado_em TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sessao_nicho_cidade ON busca_sessoes (nicho, cidade_norm)`,

  `CREATE TABLE IF NOT EXISTS busca_execucoes (
     id TEXT PRIMARY KEY,
     sessao_id TEXT NOT NULL,
     numero INTEGER NOT NULL,
     em TEXT NOT NULL,
     termo TEXT NOT NULL DEFAULT '',
     filtros TEXT,
     total_bruto INTEGER NOT NULL DEFAULT 0,
     total_exibido INTEGER NOT NULL DEFAULT 0,
     resultados TEXT,
     ids TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_execucao_sessao ON busca_execucoes (sessao_id, numero)`,

  `CREATE TABLE IF NOT EXISTS busca_exibidos (
     sessao_id TEXT NOT NULL,
     external_id TEXT NOT NULL,
     PRIMARY KEY (sessao_id, external_id)
   )`,

  `CREATE TABLE IF NOT EXISTS envios (
     id TEXT PRIMARY KEY,
     em TEXT NOT NULL,
     lead_id TEXT,
     nome TEXT,
     telefone TEXT,
     nicho TEXT,
     cidade TEXT,
     conta_id TEXT,
     conta_nome TEXT,
     mensagem TEXT,
     canal TEXT,
     wamid TEXT,
     status TEXT,
     erro TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_envios_conta_em ON envios (conta_id, em)`,
  `CREATE INDEX IF NOT EXISTS idx_envios_lead ON envios (lead_id)`,
  `CREATE INDEX IF NOT EXISTS idx_envios_wamid ON envios (wamid)`,
  `CREATE INDEX IF NOT EXISTS idx_envios_em ON envios (em)`,

  `CREATE TABLE IF NOT EXISTS mensagens (
     id TEXT PRIMARY KEY,
     wamid TEXT,
     em TEXT NOT NULL,
     remetente TEXT,
     nome_contato TEXT,
     texto TEXT,
     tipo TEXT,
     phone_number_id TEXT,
     conta_id TEXT,
     conta_nome TEXT,
     lead_id TEXT
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_wamid ON mensagens (wamid)`,
  `CREATE INDEX IF NOT EXISTS idx_mensagens_em ON mensagens (em)`,

  `CREATE TABLE IF NOT EXISTS kv (
     chave TEXT PRIMARY KEY,
     valor TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   )`,
];

/**
 * Colunas acrescentadas a tabelas que já existiam (ALTER). Roda após o SCHEMA e
 * é idempotente — se a coluna já foi criada, o erro é ignorado.
 */
const COLUNAS_NOVAS: string[] = [
  // Guarda os external_ids que cada execução exibiu: permite reconstruir os
  // resultados de buscas antigas que não arquivaram o retrato em `resultados`.
  "ALTER TABLE busca_execucoes ADD COLUMN ids TEXT",
];

/** Garante o schema (memoizado por processo). */
export async function garantirSchema(): Promise<void> {
  if (!_schemaPronto) {
    _schemaPronto = (async () => {
      const db = cliente();
      for (const sql of SCHEMA) await db.execute(sql);
      // Colunas adicionadas depois do schema inicial (bancos já existentes).
      // Idempotente: se a coluna já existe, o ALTER falha e é ignorado.
      for (const sql of COLUNAS_NOVAS) {
        try {
          await db.execute(sql);
        } catch {
          /* coluna já existe */
        }
      }
    })().catch((e) => {
      // Não deixa um erro transitório "envenenar" o processo para sempre.
      _schemaPronto = null;
      throw e;
    });
  }
  return _schemaPronto;
}

export type ValorSql = string | number | null;

/** SELECT — devolve as linhas já tipadas. */
export async function consultar<T>(sql: string, args: ValorSql[] = []): Promise<T[]> {
  await garantirSchema();
  const res = await cliente().execute({ sql, args });
  return res.rows as unknown as T[];
}

/** Primeira linha de um SELECT (ou null). */
export async function consultarUm<T>(sql: string, args: ValorSql[] = []): Promise<T | null> {
  const linhas = await consultar<T>(sql, args);
  return linhas[0] ?? null;
}

/** INSERT/UPDATE/DELETE — devolve quantas linhas foram afetadas. */
export async function executar(sql: string, args: ValorSql[] = []): Promise<number> {
  await garantirSchema();
  const res = await cliente().execute({ sql, args });
  return res.rowsAffected;
}

/** Vários comandos em uma única transação (mais rápido e atômico). */
export async function emLote(
  comandos: { sql: string; args?: ValorSql[] }[],
): Promise<void> {
  if (!comandos.length) return;
  await garantirSchema();
  await cliente().batch(
    comandos.map((c) => ({ sql: c.sql, args: c.args ?? [] })),
    "write",
  );
}

/** Chave/valor simples para dados pequenos que não crescem (config, cota). */
export async function lerKv<T>(chave: string): Promise<T | null> {
  const linha = await consultarUm<{ valor: string }>(
    "SELECT valor FROM kv WHERE chave = ?",
    [chave],
  );
  if (!linha) return null;
  try {
    return JSON.parse(linha.valor) as T;
  } catch {
    return null;
  }
}

export async function gravarKv(chave: string, valor: unknown): Promise<void> {
  await executar(
    `INSERT INTO kv (chave, valor, atualizado_em) VALUES (?, ?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
    [chave, JSON.stringify(valor), new Date().toISOString()],
  );
}
