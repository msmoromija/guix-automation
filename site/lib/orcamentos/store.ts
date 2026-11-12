import { randomBytes } from "crypto";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import { siteBase } from "@/lib/pedidos/compra";

export type StatusOrcamento = "aberto" | "aguardando_pagamento" | "pago" | "cancelado";

export type Orcamento = {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
  status: StatusOrcamento;
  titulo: string;
  /** Escopo do que será elaborado — texto livre do comercial. */
  descricao: string;
  /** Prazo de elaboração/entrega (ex.: "até 24 horas") — entra no contrato. */
  prazo: string;
  /** Valor de tabela / padrão, em centavos. */
  valorCentavos: number;
  /** Desconto concedido, em centavos. */
  descontoCentavos: number;
  /** Nome do negócio ou do cliente (exibição). */
  clienteNome: string;
  /** Domínio informado no comercial para provisionamento de e-mail e site. */
  dominio?: string | null;
  criadoPor: string;
  notaInterna: string;
  cobrancaId?: string | null;
  pagoEm?: string | null;
};

type Indice = { atualizadoEm: string; ids: string[] };

const INDICE = "orcamentos/_indice.json";

function chave(id: string) {
  const limpo = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return `orcamentos/${limpo}.json`;
}

export function novoIdOrcamento() {
  return `or${randomBytes(5).toString("hex")}`;
}

export function totalOrcamento(o: Pick<Orcamento, "valorCentavos" | "descontoCentavos">) {
  return Math.max(0, o.valorCentavos - o.descontoCentavos);
}

export function urlOrcamento(id: string) {
  return `${siteBase()}/orcamento/${encodeURIComponent(id)}`;
}

async function lerIndice(): Promise<Indice> {
  try {
    const buf = await baixarObjeto(INDICE);
    return JSON.parse(buf.toString("utf8")) as Indice;
  } catch {
    return { atualizadoEm: new Date().toISOString(), ids: [] };
  }
}

async function gravarIndice(indice: Indice) {
  indice.atualizadoEm = new Date().toISOString();
  await enviarBuffer({
    key: INDICE,
    body: Buffer.from(JSON.stringify(indice, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "indice orcamentos",
    tags: ["orcamento", "indice"],
    status: "aprovada",
    clienteId: "ops",
  });
}

export async function gravarOrcamento(o: Orcamento) {
  const body = { ...o, atualizadoEm: new Date().toISOString() };
  await enviarBuffer({
    key: chave(o.id),
    body: Buffer.from(JSON.stringify(body, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "orcamento",
    tags: ["orcamento", o.status, o.id],
    status: "aprovada",
    clienteId: "ops",
  });
  const indice = await lerIndice();
  if (!indice.ids.includes(o.id)) {
    indice.ids = [o.id, ...indice.ids].slice(0, 400);
    await gravarIndice(indice);
  }
  return body;
}

export async function lerOrcamento(id: string): Promise<Orcamento | null> {
  try {
    const buf = await baixarObjeto(chave(id));
    return JSON.parse(buf.toString("utf8")) as Orcamento;
  } catch {
    return null;
  }
}

export async function listarOrcamentos(limite = 80): Promise<Orcamento[]> {
  const indice = await lerIndice();
  const out: Orcamento[] = [];
  for (const id of indice.ids.slice(0, limite)) {
    const o = await lerOrcamento(id);
    if (o) out.push(o);
  }
  return out;
}

export async function marcarOrcamentoPago(id: string, cobrancaId: string) {
  const o = await lerOrcamento(id);
  if (!o) return null;
  if (o.status === "pago") return o;
  return gravarOrcamento({
    ...o,
    status: "pago",
    cobrancaId,
    pagoEm: new Date().toISOString(),
  });
}
