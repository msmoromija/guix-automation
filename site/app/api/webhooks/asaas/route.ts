import { timingSafeEqual } from "crypto";
import { marcarPreviewPago } from "@/lib/previews/store";
import { executarPosPagamento } from "@/lib/automacao/pos-pagamento";
import { avisarPagamentoConfirmado } from "@/lib/automacao/aviso-compra";
import {
  avisarClientePagamentoCancelado,
  avisarClientePagamentoEmAtraso,
} from "@/lib/automacao/emails-institucionais";
import { lerPedido, linksDoPrototipo, gravarPedido, type PedidoCompra } from "@/lib/pedidos/compra";
import { lerCobranca } from "@/lib/asaas";
import { planoPorId, type PlanoId } from "@/lib/planos";

export const runtime = "nodejs";
export const maxDuration = 120;

function tokenConfere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

const PAGOS = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);
const ATRASADOS = new Set(["OVERDUE"]);
const CANCELADOS = new Set(["DELETED", "REFUNDED"]);

function planoDaRef(ref: string): PlanoId | "personalizado" {
  if (ref.startsWith("or:")) return "personalizado";
  const partes = ref.split(":");
  if (partes[2] === "avancado" || partes[2] === "simples") return partes[2];
  if (ref.includes("-avancado-")) return "avancado";
  return "simples";
}

function nichoDaRef(ref: string) {
  if (ref.startsWith("pv:")) return ref.split(":")[3] || "";
  const m = ref.match(/^guix-(?:simples|avancado)-([^-]+)-/);
  return m?.[1] || "";
}

async function pedidoFallback(cobrancaId: string, ref: string): Promise<PedidoCompra | null> {
  const existente = await lerPedido(cobrancaId);
  if (existente) return existente;
  try {
    const cob = await lerCobranca(cobrancaId);
    const plano = planoDaRef(ref);
    const previewId = ref.startsWith("pv:") ? ref.split(":")[1] || null : null;
    const orcamentoId = ref.startsWith("or:") ? ref.split(":")[1] || null : null;
    const planoNome =
      plano === "personalizado" ? "Presença Personalizada" : planoPorId(plano)?.nome ?? "GuiX.net";
    const nichoId = orcamentoId ? "personalizado" : nichoDaRef(ref) || "—";
    return {
      id: cobrancaId,
      criadoEm: new Date().toISOString(),
      status: "pago",
      pagoEm: new Date().toISOString(),
      plano,
      planoNome,
      nichoId,
      nichoNome: nichoId,
      configuracao: plano === "personalizado" ? "equipe" : "ia",
      centavos: Math.round(cob.valor * 100),
      forma: cob.forma,
      parcelas: cob.parcelas,
      descricao: cob.descricao || "",
      cliente: {
        nome: "Consultar Asaas",
        email: "—",
        telefone: "—",
        documento: "—",
      },
      temPrototipo: Boolean(previewId),
      previewId,
      previewToken: previewId,
      orcamentoId,
      links: previewId ? linksDoPrototipo(previewId) : undefined,
      asaas: { invoiceUrl: cob.invoiceUrl, bankSlipUrl: cob.bankSlipUrl },
    };
  } catch {
    return null;
  }
}

export async function POST(requisicao: Request) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN?.trim() ?? "";
  const recebido = requisicao.headers.get("asaas-access-token") ?? "";
  if (!esperado || !tokenConfere(recebido, esperado)) {
    return Response.json({ erro: "Token do webhook inválido." }, { status: 401 });
  }

  let corpo: {
    id?: string;
    event?: string;
    payment?: { id?: string; status?: string; externalReference?: string };
  };
  try {
    corpo = await requisicao.json();
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const evento = typeof corpo.event === "string" ? corpo.event : "desconhecido";
  const pagamento = corpo.payment?.id ?? "sem-id";
  const status = corpo.payment?.status ?? "sem-status";
  const ref = corpo.payment?.externalReference || "";
  console.info(`asaas ${corpo.id ?? "sem-evento"} ${evento} ${pagamento} ${status} ${ref}`);

  let pos: unknown = null;
  let aviso: unknown = null;

  if (PAGOS.has(status) && pagamento !== "sem-id") {
    const pv = ref.startsWith("pv:") ? ref.split(":")[1] : "";
    if (pv) {
      try {
        await marcarPreviewPago(pv, pagamento);
      } catch (e) {
        console.error("preview pago", e);
      }
    }

    const fallback = await pedidoFallback(pagamento, ref).catch(() => null);

    // 1) E-mail / marcar pago — isolado para não bloquear o runner
    try {
      aviso = await avisarPagamentoConfirmado(pagamento, fallback);
    } catch (e) {
      console.error("aviso pagamento", e);
      aviso = { ok: false, erro: e instanceof Error ? e.message : "falha" };
    }

    // 2) Snapshot ZIP/JSON
    let ped: PedidoCompra | null = null;
    try {
      const { prepararEntregaPedido } = await import("@/lib/pedidos/preparar-entrega");
      ped =
        (await lerPedido(pagamento)) ||
        (aviso && typeof aviso === "object" && "pedido" in aviso
          ? (aviso as { pedido?: PedidoCompra }).pedido || null
          : null) ||
        fallback;
      if (ped) {
        const prep = await prepararEntregaPedido({
          ...ped,
          status: "pago",
          pagoEm: ped.pagoEm || new Date().toISOString(),
        });
        ped = prep.pedido;
      }
    } catch (e) {
      console.error("snapshot pos-pago", e);
      ped = (await lerPedido(pagamento).catch(() => null)) || fallback;
    }

    // 3) Runner (git/vercel/dns) — sempre tenta, mesmo se o e-mail falhou
    try {
      pos = await executarPosPagamento({
        previewId: pv || ped?.previewId || null,
        cobrancaId: pagamento,
        pedido: ped,
      });
    } catch (e) {
      console.error("pos pagamento", e);
      pos = { ok: false, erro: e instanceof Error ? e.message : "falha" };
    }
  } else if (ATRASADOS.has(status) && pagamento !== "sem-id") {
    try {
      const pedido = (await lerPedido(pagamento)) || (await pedidoFallback(pagamento, ref));
      if (pedido && pedido.status !== "pago" && pedido.cliente?.email && !pedido.cliente.email.includes("—")) {
        aviso = await avisarClientePagamentoEmAtraso(pedido);
      }
    } catch (e) {
      console.error("aviso atraso", e);
      aviso = { ok: false, erro: e instanceof Error ? e.message : "falha" };
    }
  } else if (CANCELADOS.has(status) && pagamento !== "sem-id") {
    try {
      const pedido = await lerPedido(pagamento);
      if (pedido) {
        if (pedido.status !== "cancelado") {
          await gravarPedido({ ...pedido, status: "cancelado" });
        }
        if (pedido.cliente?.email && !pedido.cliente.email.includes("—")) {
          aviso = await avisarClientePagamentoCancelado(
            { ...pedido, status: "cancelado" },
            status === "REFUNDED" ? "estornado" : "cancelado",
          );
        }
      }
    } catch (e) {
      console.error("aviso cancelado", e);
      aviso = { ok: false, erro: e instanceof Error ? e.message : "falha" };
    }
  }

  return Response.json({ received: true, pos, aviso });
}
