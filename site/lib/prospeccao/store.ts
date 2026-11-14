import { randomBytes } from "crypto";
import {
  consultar,
  consultarUm,
  emLote,
  executar,
  gravarKv,
  lerKv,
  type ValorSql,
} from "./db";
import type {
  BuscaExecucao,
  ConfigProspecção,
  ContaWhatsApp,
  EnvioRegistro,
  EventoLead,
  Lead,
  MensagemRecebida,
  NichoProspecção,
  ResultadoBusca,
  SessaoBusca,
  StatusLead,
} from "./tipos";

/** Quantos eventos mantemos na linha do tempo de cada lead. */
const LIMITE_HISTORICO_LEAD = 50;

/** Cota mensal da Google Places API (Text Search Enterprise). */
export const LIMITE_BUSCAS_MES = 1000;

// —— Identificadores e utilitários ——

export function novoIdLead() {
  return `ld_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

export function novoIdSessao() {
  return `ss_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

export function novoIdBusca() {
  return `bs_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

export function normalizarTelefone(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

/** Compara cidades ignorando caixa e espaços nas pontas. */
export function mesmaCidade(a: string, b: string): boolean {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

export function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// —— Leads ——

type LinhaLead = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  nicho: string;
  endereco: string;
  categoria: string | null;
  site: string | null;
  email: string | null;
  status: string;
  data_ultimo_contato: string | null;
  conta_whatsapp: string | null;
  modelo_usado: string | null;
  mensagem_gerada: string | null;
  observacoes: string;
  congelado: number;
  arquivado: number;
  external_id: string | null;
  fonte: string;
  historico: string | null;
  created_at: string;
  updated_at: string;
};

const COLUNAS_LEAD =
  "id, nome, telefone, telefone_norm, cidade, nicho, endereco, categoria, site, email, " +
  "status, data_ultimo_contato, conta_whatsapp, modelo_usado, mensagem_gerada, observacoes, " +
  "congelado, arquivado, external_id, fonte, historico, created_at, updated_at";

function parseHistorico(raw: string | null): EventoLead[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as EventoLead[]) : [];
  } catch {
    return [];
  }
}

function linhaParaLead(l: LinhaLead): Lead {
  return {
    id: l.id,
    nome: l.nome,
    telefone: l.telefone,
    cidade: l.cidade,
    nicho: l.nicho,
    endereco: l.endereco || "",
    categoria: l.categoria ?? undefined,
    site: l.site ?? null,
    email: l.email ?? null,
    status: (l.status as StatusLead) || "novo",
    data_ultimo_contato: l.data_ultimo_contato ?? null,
    conta_whatsapp: l.conta_whatsapp ?? null,
    modelo_usado: l.modelo_usado ?? null,
    mensagem_gerada: l.mensagem_gerada ?? null,
    observacoes: l.observacoes || "",
    congelado: Boolean(l.congelado),
    arquivado: Boolean(l.arquivado),
    external_id: l.external_id ?? null,
    fonte: l.fonte || "google",
    created_at: l.created_at,
    updated_at: l.updated_at,
    historico: parseHistorico(l.historico),
  };
}

const SQL_UPSERT_LEAD = `INSERT INTO leads (${COLUNAS_LEAD})
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    nome = excluded.nome, telefone = excluded.telefone, telefone_norm = excluded.telefone_norm,
    cidade = excluded.cidade, nicho = excluded.nicho, endereco = excluded.endereco,
    categoria = excluded.categoria, site = excluded.site, email = excluded.email,
    status = excluded.status, data_ultimo_contato = excluded.data_ultimo_contato,
    conta_whatsapp = excluded.conta_whatsapp, modelo_usado = excluded.modelo_usado,
    mensagem_gerada = excluded.mensagem_gerada, observacoes = excluded.observacoes,
    congelado = excluded.congelado, arquivado = excluded.arquivado,
    external_id = excluded.external_id, fonte = excluded.fonte, historico = excluded.historico,
    updated_at = excluded.updated_at`;

function argsDoLead(lead: Lead): ValorSql[] {
  return [
    lead.id,
    lead.nome || "",
    lead.telefone || "",
    normalizarTelefone(lead.telefone),
    lead.cidade || "",
    lead.nicho || "",
    lead.endereco || "",
    lead.categoria ?? null,
    lead.site ?? null,
    lead.email ?? null,
    lead.status || "novo",
    lead.data_ultimo_contato ?? null,
    lead.conta_whatsapp ?? null,
    lead.modelo_usado ?? null,
    lead.mensagem_gerada ?? null,
    lead.observacoes || "",
    lead.congelado ? 1 : 0,
    lead.arquivado ? 1 : 0,
    lead.external_id ?? null,
    lead.fonte || "google",
    lead.historico?.length ? JSON.stringify(lead.historico) : null,
    lead.created_at,
    lead.updated_at,
  ];
}

export async function gravarLead(lead: Lead): Promise<Lead> {
  await executar(SQL_UPSERT_LEAD, argsDoLead(lead));
  return lead;
}

/** Salva vários leads de uma vez (ex.: resultados de uma busca). */
export async function salvarLeads(lote: Lead[]): Promise<number> {
  if (!lote.length) return 0;
  await emLote(lote.map((lead) => ({ sql: SQL_UPSERT_LEAD, args: argsDoLead(lead) })));
  return lote.length;
}

export async function lerLead(id: string): Promise<Lead | null> {
  const linha = await consultarUm<LinhaLead>(
    `SELECT ${COLUNAS_LEAD} FROM leads WHERE id = ?`,
    [id],
  );
  return linha ? linhaParaLead(linha) : null;
}

/** Remove um lead do banco. */
export async function removerLead(id: string) {
  await executar("DELETE FROM leads WHERE id = ?", [id]);
}

/** Busca lead por telefone (normalizado) para evitar duplicatas. */
export async function buscarLeadPorTelefone(
  telefoneNormalizado: string,
): Promise<Lead | null> {
  const linha = await consultarUm<LinhaLead>(
    `SELECT ${COLUNAS_LEAD} FROM leads WHERE telefone_norm = ? ORDER BY created_at DESC LIMIT 1`,
    [telefoneNormalizado],
  );
  return linha ? linhaParaLead(linha) : null;
}

/** Lista os leads mais recentes (com a linha do tempo completa). */
export async function listarLeads(limite = 500): Promise<Lead[]> {
  const linhas = await consultar<LinhaLead>(
    `SELECT ${COLUNAS_LEAD} FROM leads ORDER BY created_at DESC, id DESC LIMIT ?`,
    [limite],
  );
  return linhas.map(linhaParaLead);
}

/** Mapa telefone-normalizado → lead, para cruzar os resultados de uma busca. */
export async function listarLeadsPorTelefones(
  telefonesNorm: string[],
): Promise<Map<string, Lead>> {
  const mapa = new Map<string, Lead>();
  const unicos = Array.from(new Set(telefonesNorm.filter(Boolean)));
  if (!unicos.length) return mapa;
  const TAMANHO = 400;
  for (let i = 0; i < unicos.length; i += TAMANHO) {
    const lote = unicos.slice(i, i + TAMANHO);
    const placeholders = lote.map(() => "?").join(", ");
    const linhas = await consultar<LinhaLead>(
      `SELECT ${COLUNAS_LEAD} FROM leads WHERE telefone_norm IN (${placeholders}) ORDER BY created_at DESC`,
      lote,
    );
    for (const linha of linhas) {
      const lead = linhaParaLead(linha);
      const t = normalizarTelefone(lead.telefone);
      if (!mapa.has(t)) mapa.set(t, lead);
    }
  }
  return mapa;
}

/** Mapa external_id → lead, para reconstruir os resultados de buscas antigas. */
export async function listarLeadsPorExternalIds(
  externalIds: string[],
): Promise<Map<string, Lead>> {
  const mapa = new Map<string, Lead>();
  const unicos = Array.from(new Set(externalIds.filter(Boolean)));
  if (!unicos.length) return mapa;
  const TAMANHO = 400;
  for (let i = 0; i < unicos.length; i += TAMANHO) {
    const lote = unicos.slice(i, i + TAMANHO);
    const placeholders = lote.map(() => "?").join(", ");
    const linhas = await consultar<LinhaLead>(
      `SELECT ${COLUNAS_LEAD} FROM leads WHERE external_id IN (${placeholders})`,
      lote,
    );
    for (const linha of linhas) {
      const lead = linhaParaLead(linha);
      if (lead.external_id && !mapa.has(lead.external_id)) mapa.set(lead.external_id, lead);
    }
  }
  return mapa;
}

/** Filtros do "Histórico de leads" do painel. */
export type FiltrosLeads = {
  nicho?: string;
  cidade?: string;
  status?: string;
  texto?: string;
  incluirOcultos?: boolean;
};

type ModoOcultos = "todos" | "visiveis" | "ocultos";

function whereLeads(f: FiltrosLeads, modo: ModoOcultos = "todos") {
  const cond: string[] = [];
  const args: ValorSql[] = [];
  if (f.nicho) {
    cond.push("nicho = ?");
    args.push(f.nicho);
  }
  if (f.cidade) {
    cond.push("cidade LIKE ?");
    args.push(`%${f.cidade}%`);
  }
  if (f.status) {
    cond.push("status = ?");
    args.push(f.status);
  }
  if (f.texto) {
    cond.push("(nome LIKE ? OR telefone LIKE ? OR cidade LIKE ?)");
    const t = `%${f.texto}%`;
    args.push(t, t, t);
  }
  if (modo === "visiveis") cond.push("congelado = 0 AND arquivado = 0");
  if (modo === "ocultos") cond.push("(congelado = 1 OR arquivado = 1)");
  return { sql: cond.length ? `WHERE ${cond.join(" AND ")}` : "", args };
}

/** Total de leads que casam com o filtro (respeitando "mostrar ocultos"). */
export async function contarLeads(f: FiltrosLeads): Promise<number> {
  const { sql, args } = whereLeads(f, f.incluirOcultos ? "todos" : "visiveis");
  const linha = await consultarUm<{ n: number }>(
    `SELECT COUNT(*) AS n FROM leads ${sql}`,
    args,
  );
  return Number(linha?.n || 0);
}

/** Quantos leads do filtro estão congelados/removidos. */
export async function contarLeadsOcultos(f: FiltrosLeads): Promise<number> {
  const { sql, args } = whereLeads(f, "ocultos");
  const linha = await consultarUm<{ n: number }>(
    `SELECT COUNT(*) AS n FROM leads ${sql}`,
    args,
  );
  return Number(linha?.n || 0);
}

/** Página do histórico de leads (ativos primeiro, depois congelados/removidos). */
export async function listarLeadsPainel(
  f: FiltrosLeads,
  limite: number,
  offset: number,
): Promise<Lead[]> {
  const { sql, args } = whereLeads(f, f.incluirOcultos ? "todos" : "visiveis");
  const linhas = await consultar<LinhaLead>(
    `SELECT ${COLUNAS_LEAD} FROM leads ${sql}
     ORDER BY (congelado = 0 AND arquivado = 0) DESC, created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...args, limite, offset],
  );
  return linhas.map(linhaParaLead);
}

/** Acrescenta um evento à linha do tempo do lead (mantém os N mais recentes). */
export function registrarEvento(lead: Lead, evento: Omit<EventoLead, "em">): void {
  const eventos = [...(lead.historico || []), { em: new Date().toISOString(), ...evento }];
  lead.historico = eventos.slice(-LIMITE_HISTORICO_LEAD);
}

// —— Configuração ——

const CHAVE_KV_CONFIG = "config";

/**
 * Nichos canônicos disponíveis no painel (mesma lista de `lib/nichos.ts`).
 * Fica no código para que o dropdown nunca dependa de configuração manual.
 */
const NICHOS_PADRAO: NichoProspecção[] = [
  {
    slug: "barbearia",
    nome: "Barbearia",
    modelo_url: "https://guix.net.br/exemplos/barbearia",
    termos_busca: ["barbearia", "barbeiro", "corte masculino"],
  },
  {
    slug: "salao",
    nome: "Salão",
    modelo_url: "https://guix.net.br/exemplos/salao",
    termos_busca: ["salão de beleza", "cabeleireiro", "salão"],
  },
  {
    slug: "estetica",
    nome: "Estética",
    modelo_url: "https://guix.net.br/exemplos/estetica",
    termos_busca: ["estética", "clínica de estética", "sobrancelha"],
  },
  {
    slug: "petshop",
    nome: "Pet shop",
    modelo_url: "https://guix.net.br/exemplos/petshop",
    termos_busca: ["pet shop", "banho e tosa", "petshop"],
  },
  {
    slug: "academia",
    nome: "Academia",
    modelo_url: "https://guix.net.br/exemplos/academia",
    termos_busca: ["academia", "estúdio de treinamento", "crossfit"],
  },
  {
    slug: "contabilidade",
    nome: "Contabilidade",
    modelo_url: "https://guix.net.br/exemplos/contabilidade",
    termos_busca: ["contabilidade", "escritório contábil", "contador"],
  },
  {
    slug: "advocacia",
    nome: "Advocacia",
    modelo_url: "https://guix.net.br/exemplos/advocacia",
    termos_busca: ["advocacia", "advogado", "escritório de advocacia"],
  },
  {
    slug: "dentista",
    nome: "Dentista",
    modelo_url: "https://guix.net.br/exemplos/dentista",
    termos_busca: ["dentista", "consultório odontológico", "clínica odontológica"],
  },
  {
    slug: "clinica",
    nome: "Clínica médica",
    modelo_url: "https://guix.net.br/exemplos/clinica",
    termos_busca: ["clínica médica", "clínica", "consultório médico"],
  },
  {
    slug: "psicologia",
    nome: "Psicologia",
    modelo_url: "https://guix.net.br/exemplos/psicologia",
    termos_busca: ["psicólogo", "psicologia", "consultório de psicologia"],
  },
  {
    slug: "nutricionista",
    nome: "Nutricionista",
    modelo_url: "https://guix.net.br/exemplos/nutricionista",
    termos_busca: ["nutricionista", "clínica de nutrição", "consulta nutricional"],
  },
];

const CONFIG_PADRAO: ConfigProspecção = {
  atualizadoEm: new Date().toISOString(),
  api: {
    provedor: "google",
    chave: "",
    endpoint_busca: "https://places.googleapis.com/v1/places:searchText",
    endpoint_detalhes: "https://places.googleapis.com/v1/places/{place_id}",
  },
  contas: [
    { id: "conta1", nome: "Conta 1", limite_diario: 30 },
    { id: "conta2", nome: "Conta 2", limite_diario: 30 },
  ],
  nichos: NICHOS_PADRAO,
  templates: [
    {
      id: "padrao",
      nome: "Introdução + Case Local",
      texto: `Olá, {{nome}}! Tudo bem por aí?

Aqui é a {{remetente}}. Percebi que vocês são especializados em {{nicho}} em {{cidade}}.

Ajudamos negócios como o seu a ter um site profissional que gera mais leads qualificados e enche a agenda.

Gostaria de te enviar nosso case de resultados recentes?
Abraço,
{{remetente}}`,
    },
  ],
  template_ativo: "padrao",
  periodo_recontato_dias: 45,
  remetente: "Equipe GuiX",
};

export async function lerConfig(): Promise<ConfigProspecção> {
  const cfg = (await lerKv<Partial<ConfigProspecção>>(CHAVE_KV_CONFIG)) || {};

  const api = { ...CONFIG_PADRAO.api, ...(cfg.api || {}) };
  // Migração: configs antigas apontavam para a Foursquare (descontinuada).
  if (api.provedor !== "google" || /foursquare/i.test(api.endpoint_busca)) {
    api.provedor = "google";
    api.endpoint_busca = CONFIG_PADRAO.api.endpoint_busca;
    api.endpoint_detalhes = CONFIG_PADRAO.api.endpoint_detalhes;
  }

  // Migração: templates antigos traziam o nome fixo "Carlos".
  const templates = (cfg.templates || CONFIG_PADRAO.templates).map((t) => ({
    ...t,
    texto: t.texto
      .replace(/Aqui é o Carlos da GuiX/g, "Aqui é a {{remetente}}")
      .replace(/Carlos - GuiX/g, "{{remetente}}"),
  }));

  // Migração: garante que todos os nichos canônicos existam (o painel usa esta
  // lista no dropdown). Nichos extras cadastrados manualmente são preservados.
  const salvosPorSlug = new Map((cfg.nichos || []).map((n) => [n.slug, n]));
  const nichos: NichoProspecção[] = NICHOS_PADRAO.map((n) => ({
    ...n,
    ...(salvosPorSlug.get(n.slug) || {}),
  }));
  for (const n of cfg.nichos || []) {
    if (!nichos.some((x) => x.slug === n.slug)) nichos.push(n);
  }

  return { ...CONFIG_PADRAO, ...cfg, api, templates, nichos };
}

export async function gravarConfig(cfg: ConfigProspecção) {
  cfg.atualizadoEm = new Date().toISOString();
  await gravarKv(CHAVE_KV_CONFIG, cfg);
  return cfg;
}

/**
 * Chave de API efetiva: prioriza a configurada no painel e cai para a
 * variável de ambiente GOOGLE_PLACES_API_KEY quando o painel estiver vazia.
 */
export function chaveApiEfetiva(cfg: ConfigProspecção): string {
  return (cfg.api.chave || process.env.GOOGLE_PLACES_API_KEY || "").trim();
}

// —— Contas WhatsApp (conexão com a Cloud API) ——

/** Versão da conta sem o token — é o que pode ir para o cliente. */
export function contaPublica(c: ContaWhatsApp) {
  const { token, ...resto } = c;
  const status_conexao =
    c.status_conexao ||
    (c.provedor === "cloud_api" && c.phone_number_id
      ? token
        ? "conectada"
        : "erro"
      : "desconectada");
  return { ...resto, status_conexao, conectada: Boolean(token && c.phone_number_id) };
}

/**
 * Cria ou atualiza uma conta preservando o token existente quando o patch não
 * o informa (o cliente nunca envia o token de volta).
 */
export async function atualizarConta(
  id: string,
  patch: Partial<ContaWhatsApp>,
): Promise<ContaWhatsApp> {
  const cfg = await lerConfig();
  const i = cfg.contas.findIndex((c) => c.id === id);
  const base: ContaWhatsApp =
    i >= 0
      ? cfg.contas[i]
      : { id, nome: "Conta WhatsApp", limite_diario: 30, provedor: "manual" };
  const conta: ContaWhatsApp = { ...base, ...patch, id };
  if (i >= 0) cfg.contas[i] = conta;
  else cfg.contas.push(conta);
  await gravarConfig(cfg);
  return conta;
}

/** Remove uma conta da configuração. */
export async function removerConta(id: string): Promise<boolean> {
  const cfg = await lerConfig();
  const antes = cfg.contas.length;
  cfg.contas = cfg.contas.filter((c) => c.id !== id);
  if (cfg.contas.length === antes) return false;
  await gravarConfig(cfg);
  return true;
}

// —— Log de envios (fonte da verdade dos contadores) ——

type LinhaEnvio = {
  id: string;
  em: string;
  lead_id: string | null;
  nome: string | null;
  telefone: string | null;
  nicho: string | null;
  cidade: string | null;
  conta_id: string | null;
  conta_nome: string | null;
  mensagem: string | null;
  canal: string | null;
  wamid: string | null;
  status: string | null;
  erro: string | null;
};

function linhaParaEnvio(l: LinhaEnvio): EnvioRegistro {
  return {
    id: l.id,
    em: l.em,
    lead_id: l.lead_id || "",
    nome: l.nome || "",
    telefone: l.telefone || "",
    nicho: l.nicho || "",
    cidade: l.cidade ?? undefined,
    conta_id: l.conta_id || "",
    conta_nome: l.conta_nome || "",
    mensagem: l.mensagem || "",
    canal: (l.canal as EnvioRegistro["canal"]) ?? undefined,
    wamid: l.wamid ?? null,
    status: l.status ?? null,
    erro: l.erro ?? null,
  };
}

const COLUNAS_ENVIO =
  "id, em, lead_id, nome, telefone, nicho, cidade, conta_id, conta_nome, mensagem, canal, wamid, status, erro";

/** Grava um envio no log append-only. */
export async function registrarEnvio(
  dados: Omit<EnvioRegistro, "id" | "em">,
): Promise<EnvioRegistro> {
  const envio: EnvioRegistro = {
    id: `en_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    em: new Date().toISOString(),
    ...dados,
  };
  await executar(
    `INSERT INTO envios (${COLUNAS_ENVIO}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      envio.id,
      envio.em,
      envio.lead_id,
      envio.nome,
      envio.telefone,
      envio.nicho,
      envio.cidade ?? null,
      envio.conta_id,
      envio.conta_nome,
      envio.mensagem,
      envio.canal ?? null,
      envio.wamid ?? null,
      envio.status ?? null,
      envio.erro ?? null,
    ],
  );
  return envio;
}

/**
 * Atualiza o status de vários envios de uma vez (webhook da Meta).
 * Retorna quantos wamids foram encontrados.
 */
export async function atualizarStatusEnvios(
  itens: { wamid: string; status: string; erro?: string }[],
): Promise<number> {
  if (!itens.length) return 0;
  let achados = 0;
  const comandos: { sql: string; args: ValorSql[] }[] = [];
  for (const item of itens) {
    if (!item.wamid) continue;
    comandos.push({
      sql: "UPDATE envios SET status = ?, erro = COALESCE(?, erro) WHERE wamid = ?",
      args: [item.status, item.erro ?? null, item.wamid],
    });
  }
  if (!comandos.length) return 0;
  // Conta quantos realmente existiam (para o chamador não tratar como erro).
  const placeholders = itens.map(() => "?").join(", ");
  const linha = await consultarUm<{ n: number }>(
    `SELECT COUNT(*) AS n FROM envios WHERE wamid IN (${placeholders})`,
    itens.map((i) => i.wamid),
  );
  achados = Number(linha?.n || 0);
  await emLote(comandos);
  return achados;
}

/**
 * Quantos envios uma conta fez no dia informado — consulta direta ao banco.
 * Não dá para contar a partir da lista paginada do painel (ela é só uma página).
 */
export async function contarEnviosHojeConta(contaId: string, dia = hojeIso()): Promise<number> {
  const linha = await consultarUm<{ n: number }>(
    "SELECT COUNT(*) AS n FROM envios WHERE conta_id = ? AND substr(em, 1, 10) = ?",
    [contaId, dia],
  );
  return Number(linha?.n || 0);
}

/** Se o lead já tem envio registrado hoje (evita contar duas vezes o mesmo contato). */
export async function leadEnviadoHoje(leadId: string, dia = hojeIso()): Promise<boolean> {
  const linha = await consultarUm<{ n: number }>(
    "SELECT COUNT(*) AS n FROM envios WHERE lead_id = ? AND substr(em, 1, 10) = ?",
    [leadId, dia],
  );
  return Number(linha?.n || 0) > 0;
}

/** Filtros do histórico de envios do painel. */
export type FiltrosEnvios = { nicho?: string; cidade?: string };

function whereEnvios(f: FiltrosEnvios) {
  const cond: string[] = [];
  const args: ValorSql[] = [];
  if (f.nicho) {
    cond.push("nicho = ?");
    args.push(f.nicho);
  }
  if (f.cidade) {
    cond.push("cidade LIKE ?");
    args.push(`%${f.cidade}%`);
  }
  return { sql: cond.length ? `WHERE ${cond.join(" AND ")}` : "", args };
}

export async function contarEnvios(f: FiltrosEnvios): Promise<number> {
  const { sql, args } = whereEnvios(f);
  const linha = await consultarUm<{ n: number }>(
    `SELECT COUNT(*) AS n FROM envios ${sql}`,
    args,
  );
  return Number(linha?.n || 0);
}

export async function listarEnviosPainel(
  f: FiltrosEnvios,
  limite: number,
  offset: number,
): Promise<EnvioRegistro[]> {
  const { sql, args } = whereEnvios(f);
  const linhas = await consultar<LinhaEnvio>(
    `SELECT ${COLUNAS_ENVIO} FROM envios ${sql} ORDER BY em DESC LIMIT ? OFFSET ?`,
    [...args, limite, offset],
  );
  return linhas.map(linhaParaEnvio);
}

/** Cidades distintas já vistas nos envios (para o filtro do painel). */
export async function cidadesDeEnvios(): Promise<string[]> {
  const linhas = await consultar<{ cidade: string }>(
    "SELECT DISTINCT cidade FROM envios WHERE cidade IS NOT NULL AND cidade <> '' ORDER BY cidade",
  );
  return linhas.map((l) => l.cidade);
}

/** Cidades distintas já vistas nos leads (para o filtro do histórico de leads). */
export async function cidadesDeLeads(): Promise<string[]> {
  const linhas = await consultar<{ cidade: string }>(
    "SELECT DISTINCT cidade FROM leads WHERE cidade IS NOT NULL AND cidade <> '' ORDER BY cidade",
  );
  return linhas.map((l) => l.cidade);
}

// —— Mensagens recebidas (webhook) — base do uso em suporte ——

type LinhaMensagem = {
  id: string;
  wamid: string | null;
  em: string;
  remetente: string | null;
  nome_contato: string | null;
  texto: string | null;
  tipo: string | null;
  phone_number_id: string | null;
  conta_id: string | null;
  conta_nome: string | null;
  lead_id: string | null;
};

function linhaParaMensagem(l: LinhaMensagem): MensagemRecebida {
  return {
    id: l.id,
    wamid: l.wamid || "",
    em: l.em,
    de: l.remetente || "",
    nome_contato: l.nome_contato ?? null,
    texto: l.texto || "",
    tipo: l.tipo || "text",
    phone_number_id: l.phone_number_id ?? null,
    conta_id: l.conta_id ?? null,
    conta_nome: l.conta_nome ?? null,
    lead_id: l.lead_id ?? null,
  };
}

/** Lista as mensagens recebidas (mais recentes primeiro). */
export async function listarMensagens(limite = 200): Promise<MensagemRecebida[]> {
  const linhas = await consultar<LinhaMensagem>(
    `SELECT id, wamid, em, remetente, nome_contato, texto, tipo, phone_number_id, conta_id, conta_nome, lead_id
     FROM mensagens ORDER BY em DESC LIMIT ?`,
    [limite],
  );
  return linhas.map(linhaParaMensagem);
}

/**
 * Registra uma mensagem recebida. O webhook da Meta pode reentregar o mesmo
 * evento, então deduplicamos pelo wamid.
 */
export async function registrarMensagem(
  dados: Omit<MensagemRecebida, "id">,
): Promise<{ mensagem: MensagemRecebida; novo: boolean }> {
  if (dados.wamid) {
    const existente = await consultarUm<LinhaMensagem>(
      `SELECT id, wamid, em, remetente, nome_contato, texto, tipo, phone_number_id, conta_id, conta_nome, lead_id
       FROM mensagens WHERE wamid = ? LIMIT 1`,
      [dados.wamid],
    );
    if (existente) return { mensagem: linhaParaMensagem(existente), novo: false };
  }
  const mensagem: MensagemRecebida = {
    id: `ms_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    ...dados,
  };
  await executar(
    `INSERT INTO mensagens (id, wamid, em, remetente, nome_contato, texto, tipo, phone_number_id, conta_id, conta_nome, lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT DO NOTHING`,
    [
      mensagem.id,
      mensagem.wamid || null,
      mensagem.em,
      mensagem.de || null,
      mensagem.nome_contato ?? null,
      mensagem.texto || "",
      mensagem.tipo || "text",
      mensagem.phone_number_id ?? null,
      mensagem.conta_id ?? null,
      mensagem.conta_nome ?? null,
      mensagem.lead_id ?? null,
    ],
  );
  return { mensagem, novo: true };
}

// —— Histórico de buscas (por par nicho+cidade) ——

type LinhaSessao = {
  id: string;
  nicho: string;
  cidade: string;
  atualizado_em: string;
  total_leads: number;
};

type LinhaExecucao = {
  id: string;
  sessao_id: string;
  numero: number;
  em: string;
  termo: string;
  filtros: string | null;
  total_bruto: number;
  total_exibido: number;
  resultados?: string | null;
  ids?: string | null;
};

function parseFiltros(raw: string | null): BuscaExecucao["filtros"] {
  try {
    const o = raw ? JSON.parse(raw) : null;
    return {
      soComTelefone: Boolean(o?.soComTelefone),
      soNovos: Boolean(o?.soNovos),
      naoContatados: Boolean(o?.naoContatados),
    };
  } catch {
    return { soComTelefone: false, soNovos: false, naoContatados: false };
  }
}

function linhaParaExecucao(l: LinhaExecucao, comResultados = false): BuscaExecucao {
  const exec: BuscaExecucao = {
    id: l.id,
    em: l.em,
    numero: Number(l.numero),
    termo: l.termo,
    filtros: parseFiltros(l.filtros),
    totalBruto: Number(l.total_bruto),
    totalExibido: Number(l.total_exibido),
  };
  if (comResultados && l.resultados) {
    try {
      const arr = JSON.parse(l.resultados);
      exec.resultados = Array.isArray(arr) ? (arr as ResultadoBusca[]) : [];
    } catch {
      exec.resultados = [];
    }
  }
  return exec;
}

/**
 * Lista as sessões de busca (mais recentes primeiro) SEM os resultados —
 * a listagem leve é o que permite ter milhares de buscas sem baixar tudo.
 */
export async function listarSessoesBusca(): Promise<SessaoBusca[]> {
  const sessoes = await consultar<LinhaSessao>(
    `SELECT s.id, s.nicho, s.cidade, s.atualizado_em,
            (SELECT COUNT(*) FROM busca_exibidos e WHERE e.sessao_id = s.id) AS total_leads
     FROM busca_sessoes s
     ORDER BY s.atualizado_em DESC`,
  );
  if (!sessoes.length) return [];

  const execucoes = await consultar<LinhaExecucao>(
    `SELECT id, sessao_id, numero, em, termo, filtros, total_bruto, total_exibido
     FROM busca_execucoes ORDER BY numero ASC`,
  );
  const porSessao = new Map<string, BuscaExecucao[]>();
  for (const e of execucoes) {
    const lista = porSessao.get(e.sessao_id) || [];
    lista.push(linhaParaExecucao(e));
    porSessao.set(e.sessao_id, lista);
  }

  return sessoes.map((s) => ({
    nicho: s.nicho,
    cidade: s.cidade,
    atualizadoEm: s.atualizado_em,
    buscas: porSessao.get(s.id) || [],
    totalLeads: Number(s.total_leads || 0),
  }));
}

/** Busca a sessão de um par nicho+cidade (com as execuções, sem resultados). */
export async function buscarSessaoBusca(
  nicho: string,
  cidade: string,
): Promise<SessaoBusca | null> {
  const cidadeNorm = String(cidade || "").trim().toLowerCase();
  const sessao = await consultarUm<LinhaSessao>(
    `SELECT s.id, s.nicho, s.cidade, s.atualizado_em,
            (SELECT COUNT(*) FROM busca_exibidos e WHERE e.sessao_id = s.id) AS total_leads
     FROM busca_sessoes s WHERE s.nicho = ? AND s.cidade_norm = ? LIMIT 1`,
    [nicho, cidadeNorm],
  );
  if (!sessao) return null;
  const execucoes = await consultar<LinhaExecucao>(
    `SELECT id, sessao_id, numero, em, termo, filtros, total_bruto, total_exibido
     FROM busca_execucoes WHERE sessao_id = ? ORDER BY numero ASC`,
    [sessao.id],
  );
  return {
    nicho: sessao.nicho,
    cidade: sessao.cidade,
    atualizadoEm: sessao.atualizado_em,
    buscas: execucoes.map((e) => linhaParaExecucao(e)),
    totalLeads: Number(sessao.total_leads || 0),
  };
}

/**
 * external_ids já exibidos em todas as buscas anteriores deste par nicho+cidade
 * — é o que garante que a próxima busca traga resultados novos em vez de repetir.
 */
export async function idsJaExibidos(nicho: string, cidade: string): Promise<Set<string>> {
  const cidadeNorm = String(cidade || "").trim().toLowerCase();
  const linhas = await consultar<{ external_id: string }>(
    `SELECT e.external_id FROM busca_exibidos e
     JOIN busca_sessoes s ON s.id = e.sessao_id
     WHERE s.nicho = ? AND s.cidade_norm = ?`,
    [nicho, cidadeNorm],
  );
  return new Set(linhas.map((l) => l.external_id));
}

/** Registra a execução de uma busca (Busca N) e acumula os ids exibidos. */
export async function registrarExecucaoBusca(params: {
  nicho: string;
  cidade: string;
  termo: string;
  filtros: BuscaExecucao["filtros"];
  totalBruto: number;
  ids: string[];
  resultados: ResultadoBusca[];
}): Promise<BuscaExecucao> {
  const nicho = params.nicho;
  const cidade = params.cidade;
  const cidadeNorm = cidade.trim().toLowerCase();
  const agora = new Date().toISOString();

  let sessao = await consultarUm<{ id: string }>(
    "SELECT id FROM busca_sessoes WHERE nicho = ? AND cidade_norm = ? LIMIT 1",
    [nicho, cidadeNorm],
  );
  if (!sessao) {
    const id = novoIdSessao();
    await executar(
      `INSERT INTO busca_sessoes (id, nicho, cidade, cidade_norm, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(nicho, cidade_norm) DO NOTHING`,
      [id, nicho, cidade, cidadeNorm, agora, agora],
    );
    sessao = await consultarUm<{ id: string }>(
      "SELECT id FROM busca_sessoes WHERE nicho = ? AND cidade_norm = ? LIMIT 1",
      [nicho, cidadeNorm],
    );
  }
  const sessaoId = sessao!.id;

  const anterior = await consultarUm<{ n: number }>(
    "SELECT COALESCE(MAX(numero), 0) AS n FROM busca_execucoes WHERE sessao_id = ?",
    [sessaoId],
  );
  const numero = Number(anterior?.n || 0) + 1;

  const execucao: BuscaExecucao = {
    id: novoIdBusca(),
    em: agora,
    numero,
    termo: params.termo,
    filtros: params.filtros,
    totalBruto: params.totalBruto,
    totalExibido: params.ids.length,
    ids: params.ids,
    resultados: params.resultados,
  };

  const comandos: { sql: string; args: ValorSql[] }[] = [
    {
      sql: `INSERT INTO busca_execucoes (id, sessao_id, numero, em, termo, filtros, total_bruto, total_exibido, resultados, ids)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        execucao.id,
        sessaoId,
        numero,
        agora,
        params.termo,
        JSON.stringify(params.filtros),
        params.totalBruto,
        params.ids.length,
        JSON.stringify(params.resultados),
        JSON.stringify(params.ids),
      ],
    },
    {
      sql: "UPDATE busca_sessoes SET atualizado_em = ? WHERE id = ?",
      args: [agora, sessaoId],
    },
  ];
  for (const external_id of params.ids) {
    comandos.push({
      sql: "INSERT INTO busca_exibidos (sessao_id, external_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
      args: [sessaoId, external_id],
    });
  }
  await emLote(comandos);

  return execucao;
}

function parseIdsExecucao(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Monta um ResultadoBusca a partir do lead atual (para buscas antigas sem retrato). */
function leadParaResultado(lead: Lead, periodoDias: number): ResultadoBusca {
  const data = lead.data_ultimo_contato || null;
  const jaContatado = Boolean(data || lead.status === "enviado" || lead.status === "respondeu");
  const contatadoRecentemente = Boolean(
    data && Date.now() - new Date(data).getTime() < periodoDias * 86400_000,
  );
  return {
    nome: lead.nome,
    telefone: lead.telefone,
    telefone_normalizado: normalizarTelefone(lead.telefone),
    endereco: lead.endereco,
    cidade: lead.cidade,
    categoria: lead.categoria || "",
    site: lead.site ?? null,
    email: lead.email ?? null,
    external_id: lead.external_id || "",
    lead_id: lead.id,
    status: lead.status,
    ja_contatado: jaContatado,
    contatado_recentemente: contatadoRecentemente,
    data_ultimo_contato: data,
    congelado: Boolean(lead.congelado),
    arquivado: Boolean(lead.arquivado),
  };
}

/**
 * Carrega os resultados de uma execução (Busca N) e atualiza o status de cada
 * um com o dado ATUAL do lead — assim reabrir uma busca antiga mostra o status
 * de hoje, e não o retrato do dia em que a busca foi feita.
 */
export async function resultadosDaExecucao(execucaoId: string): Promise<{
  execucao: BuscaExecucao | null;
  nicho: string;
  cidade: string;
  resultados: ResultadoBusca[];
}> {
  const linha = await consultarUm<LinhaExecucao & { nicho: string; cidade: string }>(
    `SELECT e.id, e.sessao_id, e.numero, e.em, e.termo, e.filtros, e.total_bruto, e.total_exibido,
            e.resultados, e.ids, s.nicho, s.cidade
     FROM busca_execucoes e JOIN busca_sessoes s ON s.id = e.sessao_id
     WHERE e.id = ? LIMIT 1`,
    [execucaoId],
  );
  if (!linha) return { execucao: null, nicho: "", cidade: "", resultados: [] };

  const execucao = linhaParaExecucao(linha, true);
  let resultados = execucao.resultados || [];
  const execucaoLeve = { ...execucao, resultados: undefined };

  // Buscas antigas (modelo R2) não arquivaram o retrato `resultados`, só a lista
  // de external_ids exibidos. Reconstrói os resultados a partir dos leads atuais.
  if (!resultados.length) {
    const ids = parseIdsExecucao(linha.ids);
    if (ids.length) {
      const config = await lerConfig();
      const leads = await listarLeadsPorExternalIds(ids);
      resultados = ids
        .map((id) => leads.get(id))
        .filter((l): l is Lead => Boolean(l))
        .map((l) => leadParaResultado(l, config.periodo_recontato_dias));
    }
  }

  const telefones = resultados.map((r) => r.telefone_normalizado).filter(Boolean);
  if (telefones.length) {
    const atuais = await listarLeadsPorTelefones(telefones);
    const agora = Date.now();
    resultados = resultados.map((r) => {
      const lead = atuais.get(r.telefone_normalizado);
      if (!lead) return r;
      const jaContatado = Boolean(
        lead.data_ultimo_contato ||
          lead.status === "enviado" ||
          lead.status === "respondeu",
      );
      return {
        ...r,
        lead_id: lead.id,
        status: lead.status,
        ja_contatado: jaContatado,
        data_ultimo_contato: lead.data_ultimo_contato || null,
        congelado: Boolean(lead.congelado),
        arquivado: Boolean(lead.arquivado),
        site: r.site || lead.site || null,
        email: r.email || lead.email || null,
      };
    });
    void agora;
  }

  return { execucao: execucaoLeve, nicho: linha.nicho, cidade: linha.cidade, resultados };
}

// —— Uso da API (cota mensal) ——

export type UsoApi = {
  mes: string;
  buscas: number;
  limite_mensal: number;
  provedor: string;
};

const CHAVE_KV_USO = "uso";

function mesAtual(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function lerUso(provedor = "google"): Promise<UsoApi> {
  const mes = mesAtual();
  const base: UsoApi = { mes, buscas: 0, limite_mensal: LIMITE_BUSCAS_MES, provedor };
  const u = await lerKv<Partial<UsoApi>>(CHAVE_KV_USO);
  if (!u) return base;
  // Zera na virada do mês ou na troca de provedor (ex.: migração Foursquare → Google).
  if (u.mes !== mes || u.provedor !== provedor) return base;
  return { ...base, buscas: u.buscas || 0 };
}

/** Registra chamadas à API de busca (reseta automaticamente a cada mês/troca de provedor). */
export async function registrarBusca(delta = 1, provedor = "google"): Promise<UsoApi> {
  const atual = await lerUso(provedor);
  const proximo: UsoApi = { ...atual, buscas: atual.buscas + delta };
  await gravarKv(CHAVE_KV_USO, proximo);
  return proximo;
}
