import { randomBytes } from "crypto";
import { apagarObjeto, baixarObjeto, enviarBuffer } from "@/lib/media/r2";
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
} from "./tipos";

const PASTA = "prospeccao";
const CHAVE_CONFIG = `${PASTA}/config.json`;
const CHAVE_ENVIOS = `${PASTA}/_envios.json`;
const CHAVE_MENSAGENS = `${PASTA}/_mensagens.json`;
const CHAVE_USO = `${PASTA}/_uso.json`;
const CHAVE_BUSCAS = `${PASTA}/_buscas.json`;
const CHAVE_INDICE = `${PASTA}/leads/_indice.json`;

/** Quantos envios mantemos no log (mais recentes primeiro). */
const LIMITE_ENVIOS_LOG = 2000;
/** Quantas mensagens recebidas mantemos no log (mais recentes primeiro). */
const LIMITE_MENSAGENS_LOG = 1000;
/** Quantos eventos mantemos na linha do tempo de cada lead. */
const LIMITE_HISTORICO_LEAD = 50;

/** Cota mensal da Google Places API (Text Search Enterprise). */
export const LIMITE_BUSCAS_MES = 1000;

type IndiceLeads = { atualizadoEm: string; ids: string[] };

function chaveLead(id: string) {
  return `${PASTA}/leads/${id}.json`;
}

export function novoIdLead() {
  return `ld_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

async function lerIndice(): Promise<IndiceLeads> {
  try {
    const buf = await baixarObjeto(CHAVE_INDICE);
    return JSON.parse(buf.toString("utf8")) as IndiceLeads;
  } catch {
    return { atualizadoEm: new Date().toISOString(), ids: [] };
  }
}

async function gravarIndice(indice: IndiceLeads) {
  indice.atualizadoEm = new Date().toISOString();
  await enviarBuffer({
    key: CHAVE_INDICE,
    body: Buffer.from(JSON.stringify(indice, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "indice leads prospeccao",
    tags: ["prospeccao", "leads", "indice"],
    status: "aprovada",
    clienteId: "ops",
  });
}

async function gravarLeadArquivo(lead: Lead) {
  await enviarBuffer({
    key: chaveLead(lead.id),
    body: Buffer.from(JSON.stringify(lead, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: `lead ${lead.nome}`,
    tags: ["prospeccao", "lead", lead.nicho],
    status: "aprovada",
    clienteId: "ops",
  });
}

export async function gravarLead(lead: Lead) {
  await gravarLeadArquivo(lead);
  const indice = await lerIndice();
  if (!indice.ids.includes(lead.id)) {
    indice.ids = [lead.id, ...indice.ids].slice(0, 5000);
    await gravarIndice(indice);
  }
  return lead;
}

/**
 * Salva vários leads de uma vez (ex.: resultados de uma busca). Grava os
 * arquivos em paralelo e atualiza o índice uma única vez.
 */
export async function salvarLeads(lote: Lead[]): Promise<number> {
  if (!lote.length) return 0;
  const CONCORRENCIA = 20;
  for (let i = 0; i < lote.length; i += CONCORRENCIA) {
    await Promise.all(lote.slice(i, i + CONCORRENCIA).map(gravarLeadArquivo));
  }
  const indice = await lerIndice();
  const novos = lote.map((l) => l.id).filter((id) => !indice.ids.includes(id));
  if (novos.length) {
    indice.ids = [...novos, ...indice.ids].slice(0, 5000);
    await gravarIndice(indice);
  }
  return lote.length;
}

export async function lerLead(id: string): Promise<Lead | null> {
  try {
    const buf = await baixarObjeto(chaveLead(id));
    return JSON.parse(buf.toString("utf8")) as Lead;
  } catch {
    return null;
  }
}

/** Remove um lead do armazenamento e do índice. */
export async function removerLead(id: string) {
  await apagarObjeto(chaveLead(id));
  const indice = await lerIndice();
  if (indice.ids.includes(id)) {
    indice.ids = indice.ids.filter((x) => x !== id);
    await gravarIndice(indice);
  }
}

/** Busca lead por telefone (normalizado) para evitar duplicatas. */
export async function buscarLeadPorTelefone(
  telefoneNormalizado: string,
): Promise<Lead | null> {
  const indice = await lerIndice();
  const CONCORRENCIA = 20;
  for (let i = 0; i < indice.ids.length; i += CONCORRENCIA) {
    const lote = await Promise.all(indice.ids.slice(i, i + CONCORRENCIA).map((id) => lerLead(id)));
    const achado = lote.find((l) => l && normalizarTelefone(l.telefone) === telefoneNormalizado);
    if (achado) return achado;
  }
  return null;
}

export function normalizarTelefone(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

/**
 * Lista os leads mais recentes. A linha do tempo (historico) é omitida por
 * padrão para manter a listagem leve — use `lerLead` para obter o lead completo.
 */
export async function listarLeads(limite = 500): Promise<Lead[]> {
  const indice = await lerIndice();
  const ids = indice.ids.slice(0, limite);
  const out: Lead[] = [];
  const CONCORRENCIA = 20;
  for (let i = 0; i < ids.length; i += CONCORRENCIA) {
    const lote = await Promise.all(ids.slice(i, i + CONCORRENCIA).map((id) => lerLead(id)));
    for (const l of lote) if (l) out.push({ ...l, historico: undefined });
  }
  return out;
}

/** Acrescenta um evento à linha do tempo do lead (mantém os N mais recentes). */
export function registrarEvento(lead: Lead, evento: Omit<EventoLead, "em">): void {
  const eventos = [...(lead.historico || []), { em: new Date().toISOString(), ...evento }];
  lead.historico = eventos.slice(-LIMITE_HISTORICO_LEAD);
}

export async function listarLeadsPorTelefones(
  telefonesNorm: string[],
): Promise<Map<string, Lead>> {
  const mapa = new Map<string, Lead>();
  if (!telefonesNorm.length) return mapa;
  const todos = await listarLeads(2000);
  for (const l of todos) {
    const t = normalizarTelefone(l.telefone);
    if (telefonesNorm.includes(t)) mapa.set(t, l);
  }
  return mapa;
}

// —— Configuração ——

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
  try {
    const buf = await baixarObjeto(CHAVE_CONFIG);
    const cfg = JSON.parse(buf.toString("utf8")) as Partial<ConfigProspecção>;

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
  } catch {
    return { ...CONFIG_PADRAO };
  }
}

export async function gravarConfig(cfg: ConfigProspecção) {
  cfg.atualizadoEm = new Date().toISOString();
  await enviarBuffer({
    key: CHAVE_CONFIG,
    body: Buffer.from(JSON.stringify(cfg, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "config prospeccao",
    tags: ["prospeccao", "config"],
    status: "aprovada",
    clienteId: "ops",
  });
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

export function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Lista os envios registrados (mais recentes primeiro). */
export async function listarEnvios(limite = LIMITE_ENVIOS_LOG): Promise<EnvioRegistro[]> {
  try {
    const buf = await baixarObjeto(CHAVE_ENVIOS);
    const arr = JSON.parse(buf.toString("utf8")) as EnvioRegistro[];
    return Array.isArray(arr) ? arr.slice(0, limite) : [];
  } catch {
    return [];
  }
}

/** Grava o log de envios no R2. */
async function gravarEnvios(envios: EnvioRegistro[]): Promise<void> {
  await enviarBuffer({
    key: CHAVE_ENVIOS,
    body: Buffer.from(JSON.stringify(envios.slice(0, LIMITE_ENVIOS_LOG), null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "envios prospeccao",
    tags: ["prospeccao", "envios"],
    status: "aprovada",
    clienteId: "ops",
  });
}

/** Grava um envio no log append-only do R2. */
export async function registrarEnvio(
  dados: Omit<EnvioRegistro, "id" | "em">,
): Promise<EnvioRegistro> {
  const envio: EnvioRegistro = {
    id: `en_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    em: new Date().toISOString(),
    ...dados,
  };
  const atuais = await listarEnvios();
  await gravarEnvios([envio, ...atuais]);
  return envio;
}

/**
 * Atualiza o status de vários envios de uma vez (webhook da Meta), com uma
 * única leitura/escrita para evitar corrida entre os eventos de um mesmo lote.
 * Retorna quantos wamids foram encontrados.
 */
export async function atualizarStatusEnvios(
  itens: { wamid: string; status: string; erro?: string }[],
): Promise<number> {
  if (!itens.length) return 0;
  const envios = await listarEnvios();
  const porWamid = new Map(itens.map((i) => [i.wamid, i]));
  let achados = 0;
  const proximos = envios.map((e) => {
    const item = e.wamid ? porWamid.get(e.wamid) : undefined;
    if (!item) return e;
    achados += 1;
    return { ...e, status: item.status, erro: item.erro || e.erro || null };
  });
  if (achados > 0) await gravarEnvios(proximos);
  return achados;
}

/** Quantos envios uma conta fez no dia informado (derivado do log). */
export function contarEnviosHoje(
  envios: EnvioRegistro[],
  contaId: string,
  dia = hojeIso(),
): number {
  return envios.filter((e) => e.conta_id === contaId && e.em.slice(0, 10) === dia).length;
}

/** Se o lead já tem envio registrado hoje (evita contar duas vezes o mesmo contato). */
export function leadEnviadoHoje(
  envios: EnvioRegistro[],
  leadId: string,
  dia = hojeIso(),
): boolean {
  return envios.some((e) => e.lead_id === leadId && e.em.slice(0, 10) === dia);
}

// —— Mensagens recebidas (webhook) — base do uso em suporte ——

/** Lista as mensagens recebidas (mais recentes primeiro). */
export async function listarMensagens(limite = 200): Promise<MensagemRecebida[]> {
  try {
    const buf = await baixarObjeto(CHAVE_MENSAGENS);
    const arr = JSON.parse(buf.toString("utf8")) as MensagemRecebida[];
    return Array.isArray(arr) ? arr.slice(0, limite) : [];
  } catch {
    return [];
  }
}

async function gravarMensagens(lista: MensagemRecebida[]): Promise<void> {
  await enviarBuffer({
    key: CHAVE_MENSAGENS,
    body: Buffer.from(JSON.stringify(lista.slice(0, LIMITE_MENSAGENS_LOG), null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "mensagens recebidas prospeccao",
    tags: ["prospeccao", "mensagens"],
    status: "aprovada",
    clienteId: "ops",
  });
}

/**
 * Registra uma mensagem recebida. O webhook da Meta pode reentregar o mesmo
 * evento, então deduplicamos pelo wamid.
 */
export async function registrarMensagem(
  dados: Omit<MensagemRecebida, "id">,
): Promise<{ mensagem: MensagemRecebida; novo: boolean }> {
  const atuais = await listarMensagens(LIMITE_MENSAGENS_LOG);
  const existente = atuais.find((m) => m.wamid && m.wamid === dados.wamid);
  if (existente) return { mensagem: existente, novo: false };
  const mensagem: MensagemRecebida = {
    id: `ms_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    ...dados,
  };
  await gravarMensagens([mensagem, ...atuais]);
  return { mensagem, novo: true };
}

// —— Histórico de buscas (por par nicho+cidade) ——

type ArquivoBuscas = { atualizadoEm: string; sessoes: SessaoBusca[] };

/** Quantas execuções (Busca 1, Busca 2…) mantemos por cidade+nicho. */
const LIMITE_BUSCAS_POR_SESSAO = 8;
/** Quantas cidades+nichos mantemos no histórico de buscas. */
const LIMITE_SESSOES_BUSCA = 60;

export function novoIdBusca() {
  return `bs_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

/** Compara cidades ignorando caixa e acentos simples (espaços nas pontas). */
export function mesmaCidade(a: string, b: string): boolean {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

/** Lista as sessões de busca (mais recentes primeiro). */
export async function listarSessoesBusca(): Promise<SessaoBusca[]> {
  try {
    const buf = await baixarObjeto(CHAVE_BUSCAS);
    const arq = JSON.parse(buf.toString("utf8")) as ArquivoBuscas;
    return Array.isArray(arq.sessoes) ? arq.sessoes : [];
  } catch {
    return [];
  }
}

/** Busca a sessão de um par nicho+cidade. */
export async function buscarSessaoBusca(
  nicho: string,
  cidade: string,
): Promise<SessaoBusca | null> {
  const sessoes = await listarSessoesBusca();
  return sessoes.find((s) => s.nicho === nicho && mesmaCidade(s.cidade, cidade)) || null;
}

/**
 * Acumula os external_ids já exibidos em todas as buscas anteriores deste
 * par nicho+cidade — é o que garante que a próxima busca traga resultados
 * novos em vez de repetir os já mostrados.
 */
export function idsJaExibidos(sessao: SessaoBusca | null): Set<string> {
  const set = new Set<string>();
  for (const b of sessao?.buscas || []) for (const id of b.ids || []) set.add(id);
  return set;
}

/** Grava/atualiza a sessão (nicho+cidade) no histórico de buscas do R2. */
export async function gravarSessaoBusca(sessao: SessaoBusca): Promise<SessaoBusca> {
  const sessoes = await listarSessoesBusca();
  const i = sessoes.findIndex(
    (s) => s.nicho === sessao.nicho && mesmaCidade(s.cidade, sessao.cidade),
  );
  sessao.atualizadoEm = new Date().toISOString();
  sessao.buscas = sessao.buscas.slice(-LIMITE_BUSCAS_POR_SESSAO);
  if (i >= 0) sessoes[i] = sessao;
  else sessoes.unshift(sessao);

  const arquivo: ArquivoBuscas = {
    atualizadoEm: new Date().toISOString(),
    sessoes: sessoes.slice(0, LIMITE_SESSOES_BUSCA),
  };
  await enviarBuffer({
    key: CHAVE_BUSCAS,
    body: Buffer.from(JSON.stringify(arquivo, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "historico de buscas prospeccao",
    tags: ["prospeccao", "buscas"],
    status: "aprovada",
    clienteId: "ops",
  });
  return sessao;
}

/** Monta o registro de uma execução de busca a partir da sessão anterior. */
export function proximaBuscaExecucao(
  sessao: SessaoBusca | null,
  termo: string,
  filtros: BuscaExecucao["filtros"],
  totalBruto: number,
  ids: string[],
  resultados: ResultadoBusca[] = [],
): BuscaExecucao {
  return {
    id: novoIdBusca(),
    em: new Date().toISOString(),
    numero: (sessao?.buscas.length || 0) + 1,
    termo,
    filtros,
    totalBruto,
    totalExibido: ids.length,
    ids,
    resultados,
  };
}

// —— Última busca ——
//
// O histórico oficial das buscas vive em `_buscas.json` (listarSessoesBusca);
// o painel restaura a última sessão a partir dele, sem gastar cota.

// —— Uso da API (cota mensal) ——

export type UsoApi = {
  mes: string;
  buscas: number;
  limite_mensal: number;
  provedor: string;
};

function mesAtual(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function lerUso(provedor = "google"): Promise<UsoApi> {
  const mes = mesAtual();
  const base: UsoApi = { mes, buscas: 0, limite_mensal: LIMITE_BUSCAS_MES, provedor };
  try {
    const buf = await baixarObjeto(CHAVE_USO);
    const u = JSON.parse(buf.toString("utf8")) as Partial<UsoApi>;
    // Zera na virada do mês ou na troca de provedor (ex.: migração Foursquare → Google).
    if (u.mes !== mes || u.provedor !== provedor) return base;
    return { ...base, buscas: u.buscas || 0 };
  } catch {
    return base;
  }
}

/** Registra chamadas à API de busca (reseta automaticamente a cada mês/troca de provedor). */
export async function registrarBusca(delta = 1, provedor = "google"): Promise<UsoApi> {
  const atual = await lerUso(provedor);
  const proximo: UsoApi = { ...atual, buscas: atual.buscas + delta };
  await enviarBuffer({
    key: CHAVE_USO,
    body: Buffer.from(JSON.stringify(proximo, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "uso api prospeccao",
    tags: ["prospeccao", "uso"],
    status: "aprovada",
    clienteId: "ops",
  });
  return proximo;
}
