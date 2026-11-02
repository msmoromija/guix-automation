import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import type { Nicho } from "@/lib/media/tipos";
import type { StatusPrototipo } from "./cofre";

const REGISTRY_KEY = "sistema/aprovacoes/registry.json";

export type JobAprovado = {
  token: string;
  nicho: Nicho;
  nome: string;
  cidade?: string;
  whatsapp?: string;
  email?: string;
  aprovadoEm: string;
  prazoIntegracao: string;
  status: StatusPrototipo;
  contratarUrl: string;
  contaUrl: string;
  visualizarUrl: string;
  downloadUrl: string;
  contatoCliente?: { email?: string; telefone?: string };
};

type Registry = { atualizadosEm: string; itens: JobAprovado[] };

async function ler(): Promise<Registry> {
  try {
    const buf = await baixarObjeto(REGISTRY_KEY);
    const j = JSON.parse(buf.toString("utf8")) as Registry;
    return { atualizadosEm: j.atualizadosEm || new Date().toISOString(), itens: Array.isArray(j.itens) ? j.itens : [] };
  } catch {
    return { atualizadosEm: new Date().toISOString(), itens: [] };
  }
}

async function gravar(reg: Registry) {
  reg.atualizadosEm = new Date().toISOString();
  await enviarBuffer({
    key: REGISTRY_KEY,
    body: Buffer.from(JSON.stringify(reg, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "registry aprovacoes",
    tags: ["sistema", "aprovacoes"],
    status: "aprovada",
  });
}

export async function registrarJobAprovado(job: JobAprovado) {
  const reg = await ler();
  reg.itens = [job, ...reg.itens.filter((i) => i.token !== job.token)].slice(0, 200);
  await gravar(reg);
  return job;
}

export async function listarJobsAprovados(limite = 50) {
  const reg = await ler();
  return reg.itens.slice(0, limite);
}

export async function atualizarStatusJob(token: string, status: StatusPrototipo) {
  const reg = await ler();
  const item = reg.itens.find((i) => i.token === token);
  if (!item) return null;
  item.status = status;
  await gravar(reg);
  return item;
}
