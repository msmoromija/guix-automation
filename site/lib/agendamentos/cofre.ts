import { randomBytes } from "crypto";
import { baixarObjeto, enviarBuffer, listarPrefixo } from "@/lib/media/r2";
import { statusOcupaHorario, type Agendamento, type StatusAgendamento } from "./tipos";

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

export function novoManageToken() {
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
  const proximo = [
    ...indice.filter((x) => x.id !== ag.id),
    { id: ag.id, hora: ag.hora, profissional: ag.profissional, status: ag.status },
  ];
  await gravarIndice(siteId, ag.data, proximo);
  return salvo;
}

export async function lerAgendamento(siteId: string, id: string): Promise<Agendamento | null> {
  try {
    const buf = await baixarObjeto(chave(sanitizarSiteId(siteId), id));
    const ag = JSON.parse(buf.toString("utf8")) as Agendamento;
    if (!ag.manageToken) ag.manageToken = ag.cancelToken;
    return ag;
  } catch {
    return null;
  }
}

/** Pendente e confirmado bloqueiam o horário até resposta ou cancelamento. */
export async function ocupadosNoDia(siteId: string, data: string, profissional?: string) {
  const lista = await lerIndice(sanitizarSiteId(siteId), data);
  return lista
    .filter((a) => statusOcupaHorario(a.status))
    .filter((a) => !profissional || profissional === "Sem preferência" || a.profissional === profissional)
    .map((a) => ({ hora: a.hora, profissional: a.profissional, status: a.status }));
}

export async function cancelarAgendamento(siteId: string, id: string, cancelToken: string) {
  const ag = await lerAgendamento(siteId, id);
  if (!ag) return { ok: false as const, erro: "Agendamento não encontrado." };
  if (ag.cancelToken !== cancelToken) return { ok: false as const, erro: "Link de cancelamento inválido." };
  if (ag.status === "cancelado" || ag.status === "recusado") return { ok: true as const, ag };
  const atualizado: Agendamento = {
    ...ag,
    status: "cancelado",
    canceladoEm: new Date().toISOString(),
  };
  await gravarAgendamento(atualizado);
  return { ok: true as const, ag: atualizado };
}

export async function responderAgendamento(
  siteId: string,
  id: string,
  manageToken: string,
  acao: "aceitar" | "recusar",
  nota?: string,
) {
  const ag = await lerAgendamento(siteId, id);
  if (!ag) return { ok: false as const, erro: "Solicitação não encontrada." };
  if (ag.manageToken !== manageToken && ag.cancelToken !== manageToken) {
    return { ok: false as const, erro: "Link de gestão inválido." };
  }
  if (ag.status === "cancelado") return { ok: false as const, erro: "Cliente já cancelou esta solicitação." };
  if (ag.status === "confirmado" && acao === "aceitar") return { ok: true as const, ag };
  if (ag.status === "recusado" && acao === "recusar") return { ok: true as const, ag };
  if (ag.status !== "pendente" && ag.status !== "confirmado") {
    return { ok: false as const, erro: "Esta solicitação não pode mais ser alterada." };
  }
  if (acao === "aceitar" && ag.status === "pendente") {
    const conflito = (await ocupadosNoDia(siteId, ag.data, ag.profissional)).some(
      (o) => o.hora === ag.hora && o.status === "confirmado",
    );
    if (conflito) return { ok: false as const, erro: "Horário já confirmado para outro cliente." };
  }
  const atualizado: Agendamento = {
    ...ag,
    status: acao === "aceitar" ? "confirmado" : "recusado",
    respondidoEm: new Date().toISOString(),
    respostaNota: String(nota || "").trim().slice(0, 200) || undefined,
  };
  await gravarAgendamento(atualizado);
  return { ok: true as const, ag: atualizado };
}

/** Lista solicitações recentes do site (até ~120 arquivos). */
export async function listarAgendamentosSite(siteId: string, limite = 80): Promise<Agendamento[]> {
  const sid = sanitizarSiteId(siteId);
  const prefix = `agendamentos/${sid}/`;
  let keys: string[] = [];
  try {
    const itens = await listarPrefixo(prefix, 200);
    keys = itens
      .map((i) => i.key)
      .filter((k) => k.endsWith(".json") && !k.includes("/indice-"))
      .slice(0, limite);
  } catch {
    return [];
  }
  const out: Agendamento[] = [];
  for (const key of keys) {
    try {
      const buf = await baixarObjeto(key);
      const ag = JSON.parse(buf.toString("utf8")) as Agendamento;
      if (!ag.manageToken) ag.manageToken = ag.cancelToken;
      out.push(ag);
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Interpreta data+hora no fuso de Brasília (UTC-3). */
export function iniciaEmISO(data: string, hora: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) return "";
  return `${data}T${hora}:00-03:00`;
}

export function podeCancelar(ag: Agendamento, agora = Date.now(), horasAntecedencia = 3) {
  if (ag.status === "pendente") return true;
  if (ag.status !== "confirmado") return false;
  const inicio = new Date(ag.iniciaEm).getTime();
  if (!Number.isFinite(inicio)) return false;
  return agora <= inicio - horasAntecedencia * 60 * 60 * 1000;
}

export function sanitizarSiteIdPublico(raw: string) {
  return sanitizarSiteId(raw);
}
