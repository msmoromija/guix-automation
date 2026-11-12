import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import { contato } from "@/lib/contato";
import type { FormaPagamento } from "@/lib/cobranca";
import type { Configuracao, PlanoId } from "@/lib/planos";
import { linkWhatsapp } from "@/lib/contato";

export type StatusPedido = "aguardando" | "pago" | "cancelado";

export type PedidoCompra = {
  id: string;
  criadoEm: string;
  status: StatusPedido;
  pagoEm?: string;
  plano: PlanoId | "personalizado";
  planoNome: string;
  /** Orçamento sob medida (Presença Personalizada). */
  orcamentoId?: string | null;
  nichoId: string;
  nichoNome: string;
  configuracao: Configuracao;
  centavos: number;
  subtotalCentavos?: number;
  descontoCentavos?: number;
  cupomCodigo?: string | null;
  forma: FormaPagamento;
  parcelas: number;
  descricao: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    documento: string;
  };
  temPrototipo: boolean;
  previewId?: string | null;
  previewToken?: string | null;
  /** Snapshot do pacote no R2 (não depende do prazo do protótipo). */
  pacoteZipKey?: string | null;
  pacoteZipBytes?: number;
  pacoteJsonKey?: string | null;
  links?: {
    visualizar?: string;
    download?: string;
    completo?: string;
    pacoteZip?: string;
    pacoteZipPainel?: string;
    conta?: string;
    contratar?: string;
  };
  asaas?: {
    invoiceUrl?: string | null;
    bankSlipUrl?: string | null;
  };
};

type IndicePedidos = { atualizadoEm: string; ids: string[] };

const INDICE = "pedidos/_indice.json";

function chave(id: string) {
  const limpo = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `pedidos/${limpo}.json`;
}

export function chavePacoteZip(id: string) {
  const limpo = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `pedidos/${limpo}/pacote.zip`;
}

export function chavePacoteJson(id: string) {
  const limpo = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `pedidos/${limpo}/completo.json`;
}

export function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");
}

export function destinatariosOps() {
  const extras = `${process.env.GUIX_OPS_EMAILS || ""},${process.env.GUIX_OPS_EMAIL || ""}`
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(["msmoromija@gmail.com", contato.email.toLowerCase(), ...extras])];
}

export function linksDoPrototipo(token: string, cobrancaId?: string) {
  const t = encodeURIComponent(token);
  const base = siteBase();
  return {
    visualizar: `${base}/visualizar/${token}`,
    download: `${base}/api/prototipo/${token}/site.json?t=${t}`,
    completo: `${base}/api/prototipo/${token}/completo.json?t=${t}`,
    pacoteZip: `${base}/api/prototipo/${token}/pacote.zip?t=${t}`,
    pacoteZipPainel: cobrancaId
      ? `${base}/api/painel/pedidos/${encodeURIComponent(cobrancaId)}/pacote.zip`
      : undefined,
    conta: `${base}/conta/${token}?t=${t}`,
    contratar: `${base}/contratar?preview=${token}&t=${t}`,
  };
}

async function lerIndice(): Promise<IndicePedidos> {
  try {
    const buf = await baixarObjeto(INDICE);
    return JSON.parse(buf.toString("utf8")) as IndicePedidos;
  } catch {
    return { atualizadoEm: new Date().toISOString(), ids: [] };
  }
}

async function gravarIndice(indice: IndicePedidos) {
  indice.atualizadoEm = new Date().toISOString();
  await enviarBuffer({
    key: INDICE,
    body: Buffer.from(JSON.stringify(indice, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "indice pedidos",
    tags: ["pedido", "indice"],
    status: "aprovada",
    clienteId: "ops",
  });
}

export async function gravarPedido(pedido: PedidoCompra) {
  const body = Buffer.from(JSON.stringify(pedido, null, 2));
  await enviarBuffer({
    key: chave(pedido.id),
    body,
    contentType: "application/json",
    origem: "biblioteca",
    alt: "pedido compra",
    tags: ["pedido", pedido.status, pedido.plano],
    status: "aprovada",
    clienteId: pedido.previewId ? `t${pedido.previewId}` : "ops",
  });
  const indice = await lerIndice();
  if (!indice.ids.includes(pedido.id)) {
    indice.ids = [pedido.id, ...indice.ids].slice(0, 300);
    await gravarIndice(indice);
  }
  return pedido;
}

export async function lerPedido(cobrancaId: string): Promise<PedidoCompra | null> {
  try {
    const buf = await baixarObjeto(chave(cobrancaId));
    return JSON.parse(buf.toString("utf8")) as PedidoCompra;
  } catch {
    return null;
  }
}

export async function listarPedidos(limite = 80): Promise<PedidoCompra[]> {
  const indice = await lerIndice();
  const out: PedidoCompra[] = [];
  for (const id of indice.ids.slice(0, limite)) {
    const p = await lerPedido(id);
    if (p) out.push(p);
  }
  return out;
}

export async function marcarPedidoPago(cobrancaId: string) {
  const pedido = await lerPedido(cobrancaId);
  if (!pedido) return null;
  if (pedido.status === "pago") return pedido;
  const atualizado: PedidoCompra = {
    ...pedido,
    status: "pago",
    pagoEm: new Date().toISOString(),
  };
  await gravarPedido(atualizado);
  return atualizado;
}

/** Guarda o ZIP no R2 ligado à cobrança (sobrevive à expiração do protótipo). */
export async function snapshotPacoteZip(cobrancaId: string, buffer: Buffer) {
  const key = chavePacoteZip(cobrancaId);
  await enviarBuffer({
    key,
    body: buffer,
    contentType: "application/zip",
    origem: "biblioteca",
    alt: "pacote zip pedido",
    tags: ["pedido", "pacote-zip", cobrancaId],
    status: "aprovada",
    clienteId: "ops",
  });
  return { key, bytes: buffer.length };
}

export async function snapshotPacoteJson(cobrancaId: string, corpo: unknown) {
  const key = chavePacoteJson(cobrancaId);
  const body = Buffer.from(JSON.stringify(corpo, null, 2));
  await enviarBuffer({
    key,
    body,
    contentType: "application/json",
    origem: "biblioteca",
    alt: "pacote json pedido",
    tags: ["pedido", "pacote-json", cobrancaId],
    status: "aprovada",
    clienteId: "ops",
  });
  return { key, bytes: body.length };
}

export async function lerPacoteZipPedido(cobrancaId: string): Promise<Buffer | null> {
  try {
    return await baixarObjeto(chavePacoteZip(cobrancaId));
  } catch {
    return null;
  }
}

export async function lerPacoteJsonPedido(cobrancaId: string): Promise<Buffer | null> {
  try {
    return await baixarObjeto(chavePacoteJson(cobrancaId));
  } catch {
    return null;
  }
}

export function textoWhatsappPedido(pedido: PedidoCompra) {
  const base = siteBase();
  return [
    `Nova venda GuiX — ${pedido.status.toUpperCase()}`,
    `${pedido.cliente.nome} · ${pedido.cliente.telefone}`,
    `${pedido.planoNome} · ${pedido.nichoNome} · ${pedido.forma}`,
    `Valor: R$ ${(pedido.centavos / 100).toFixed(2)}${pedido.cupomCodigo ? ` (cupom ${pedido.cupomCodigo})` : ""}`,
    pedido.temPrototipo
      ? `Protótipo: SIM (${pedido.previewId})`
      : `Protótipo: NÃO — montar do zero`,
    pedido.pacoteZipKey || pedido.links?.pacoteZipPainel
      ? `ZIP: ${base}/api/painel/pedidos/${pedido.id}/pacote.zip`
      : pedido.links?.pacoteZip || "Sem ZIP",
    `Painel: ${base}/painel/pedidos`,
    `Cobrança: ${pedido.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function linkWhatsappPedido(pedido: PedidoCompra) {
  return linkWhatsapp(textoWhatsappPedido(pedido));
}
