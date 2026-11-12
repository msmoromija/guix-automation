import { randomBytes } from "crypto";
import { apagarObjeto, baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import type {
  ConfigProspecção,
  ContadoresDiários,
  Lead,
} from "./tipos";

const PASTA = "prospeccao";
const CHAVE_CONFIG = `${PASTA}/config.json`;
const CHAVE_CONTADORES = `${PASTA}/_contadores.json`;
const CHAVE_USO = `${PASTA}/_uso.json`;
const CHAVE_INDICE = `${PASTA}/leads/_indice.json`;

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

export async function gravarLead(lead: Lead) {
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
  const indice = await lerIndice();
  if (!indice.ids.includes(lead.id)) {
    indice.ids = [lead.id, ...indice.ids].slice(0, 5000);
    await gravarIndice(indice);
  }
  return lead;
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
  for (const id of indice.ids) {
    const l = await lerLead(id);
    if (l && normalizarTelefone(l.telefone) === telefoneNormalizado) return l;
  }
  return null;
}

export function normalizarTelefone(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

export async function listarLeads(limite = 500): Promise<Lead[]> {
  const indice = await lerIndice();
  const out: Lead[] = [];
  for (const id of indice.ids.slice(0, limite)) {
    const l = await lerLead(id);
    if (l) out.push(l);
  }
  return out;
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
  nichos: [
    {
      slug: "dentista",
      nome: "Dentista",
      modelo_url: "https://guix.net.br/exemplos/dentista",
      termos_busca: ["dentista", "consultório odontológico", "clínica odontológica"],
    },
  ],
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

    return { ...CONFIG_PADRAO, ...cfg, api, templates };
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

// —— Contadores diários ——

export async function lerContadores(): Promise<ContadoresDiários> {
  try {
    const buf = await baixarObjeto(CHAVE_CONTADORES);
    return JSON.parse(buf.toString("utf8")) as ContadoresDiários;
  } catch {
    return {};
  }
}

export async function gravarContadores(c: ContadoresDiários) {
  await enviarBuffer({
    key: CHAVE_CONTADORES,
    body: Buffer.from(JSON.stringify(c, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "contadores prospeccao",
    tags: ["prospeccao", "contadores"],
    status: "aprovada",
    clienteId: "ops",
  });
}

export function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Retorna contagem de envios hoje de uma conta. */
export function enviosHoje(contadores: ContadoresDiários, contaId: string): number {
  return contadores[contaId]?.[hojeIso()] || 0;
}

export async function incrementarContador(contaId: string, delta = 1) {
  const c = await lerContadores();
  const hoje = hojeIso();
  if (!c[contaId]) c[contaId] = {};
  c[contaId][hoje] = (c[contaId][hoje] || 0) + delta;
  // limpa entradas com mais de 9 dias para não crescer indefinidamente
  const corte = new Date(Date.now() - 9 * 86400_000).toISOString().slice(0, 10);
  for (const conta of Object.keys(c)) {
    for (const dia of Object.keys(c[conta])) {
      if (dia < corte) delete c[conta][dia];
    }
  }
  await gravarContadores(c);
  return c;
}

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
