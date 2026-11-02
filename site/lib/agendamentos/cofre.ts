import { randomBytes } from "crypto";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import type { Agendamento, StatusAgendamento } from "./tipos";

type IndiceItem = { id: string; hora: string; profissional: string; status: StatusAgendamento };

function sanitizarSiteId(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}

function chave(siteId: string, id: string) {
  return `agendamentos/${sanitizarSiteId(siteId)}/${id}.json`;
}

function chaveIndice(siteId: string, data: string) {
  return `agendamentos/${sanitizarSiteId(siteId)}/indice-${data}.json`;
}

export function novoIdAgendamento() {
  return randomBytes(6).toString("hex");
}

export function novoCancelToken() {
  return randomBytes(12).toString("hex");
}

async function lerIndice(siteId: string, data: string): Promise<IndiceItem[]> {
  try {
    const buf = await baixarObjeto(chaveIndice(siteId, data));
    const lista = JSON.parse(buf.toString("utf8")) as IndiceItem[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

async function gravarIndice(siteId: string, data: string, lista: IndiceItem[]) {
  await enviarBuffer({
    key: chaveIndice(siteId, data),
    body: Buffer.from(JSON.stringify(lista, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "indice agendamento",
    tags: ["agendamento", "indice", siteId],
    status: "aprovada",
    clienteId: `a${siteId}`,
  });
}

export async function gravarAgendamento(ag: Agendamento) {
  const siteId = sanitizarSiteId(ag.siteId);
  const salvo = { ...ag, siteId };
  await enviarBuffer({
    key: chave(siteId, ag.id),
    body: Buffer.from(JSON.stringify(salvo, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "agendamento",
    tags: ["agendamento", siteId, ag.status],
    status: "aprovada",
    clienteId: `a${siteId}`,
  });
  const indice = await lerIndice(siteId, ag.data);
  const proximo = [...indice.filter((x) => x.id !== ag.id), { id: ag.id, hora: ag.hora, profissional: ag.profissional, status: ag.status }];
  await gravarIndice(siteId, ag.data, proximo);
  return salvo;
}

export async function lerAgendamento(siteId: string, id: string): Promise<Agendamento | null> {
  try {
    const buf = await baixarObjeto(chave(sanitizarSiteId(siteId), id));
    return JSON.parse(buf.toString("utf8")) as Agendamento;
  } catch {
    return null;
  }
}

export async function ocupadosNoDia(siteId: string, data: string, profissional?: string) {
  const lista = await lerIndice(sanitizarSiteId(siteId), data);
  return lista
    .filter((a) => a.status === "confirmado")
    .filter((a) => !profissional || profissional === "Sem preferência" || a.profissional === profissional)
    .map((a) => ({ hora: a.hora, profissional: a.profissional }));
}

export async function cancelarAgendamento(siteId: string, id: string, cancelToken: string) {
  const ag = await lerAgendamento(siteId, id);
  if (!ag) return { ok: false as const, erro: "Agendamento não encontrado." };
  if (ag.cancelToken !== cancelToken) return { ok: false as const, erro: "Link de cancelamento inválido." };
  if (ag.status === "cancelado") return { ok: true as const, ag };
  const atualizado: Agendamento = {
    ...ag,
    status: "cancelado",
    canceladoEm: new Date().toISOString(),
  };
  await gravarAgendamento(atualizado);
  return { ok: true as const, ag: atualizado };
}

/** Interpreta data+hora no fuso de Brasília (UTC-3). */
export function iniciaEmISO(data: string, hora: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) return "";
  return `${data}T${hora}:00-03:00`;
}

export function podeCancelar(ag: Agendamento, agora = Date.now(), horasAntecedencia = 3) {
  const inicio = new Date(ag.iniciaEm).getTime();
  if (!Number.isFinite(inicio)) return false;
  return agora <= inicio - horasAntecedencia * 60 * 60 * 1000;
}

export function sanitizarSiteIdPublico(raw: string) {
  return sanitizarSiteId(raw);
}
