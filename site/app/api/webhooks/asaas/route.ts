import { timingSafeEqual } from "crypto";
import { marcarPreviewPago } from "@/lib/previews/store";
import { executarPosPagamento } from "@/lib/automacao/pos-pagamento";
import { avisarPagamentoConfirmado } from "@/lib/automacao/aviso-compra";
import { lerPedido, linksDoPrototipo, type PedidoCompra } from "@/lib/pedidos/compra";
import { lerCobranca } from "@/lib/asaas";
import { planoPorId, type PlanoId } from "@/lib/planos";

export const runtime = "nodejs";
export const maxDuration = 60;

function tokenConfere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

const PAGOS = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

function planoDaRef(ref: string): PlanoId {
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
    const planoNome = planoPorId(plano)?.nome ?? "GuiX.net";
    const nichoId = nichoDaRef(ref) || "—";
    return {
      id: cobrancaId,
      criadoEm: new Date().toISOString(),
      status: "pago",
      pagoEm: new Date().toISOString(),
      plano,
      planoNome,
      nichoId,
      nichoNome: nichoId,
      configuracao: "ia",
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
      try {
        pos = await executarPosPagamento({ previewId: pv, cobrancaId: pagamento });
      } catch (e) {
        console.error("pos pagamento", e);
        pos = { ok: false, erro: e instanceof Error ? e.message : "falha" };
      }
    }

    try {
      const fallback = await pedidoFallback(pagamento, ref);
      aviso = await avisarPagamentoConfirmado(pagamento, fallback);
      try {
        const { lerPedido } = await import("@/lib/pedidos/compra");
        const { prepararEntregaPedido } = await import("@/lib/pedidos/preparar-entrega");
        const ped =
          (await lerPedido(pagamento)) ||
          (aviso && typeof aviso === "object" && "pedido" in aviso
            ? (aviso as { pedido?: import("@/lib/pedidos/compra").PedidoCompra }).pedido
            : null);
        // Sempre reforça snapshot JSON/ZIP após pagamento (mesmo se já existia)
        if (ped) {
          await prepararEntregaPedido({ ...ped, status: "pago", pagoEm: ped.pagoEm || new Date().toISOString() });
        }
      } catch (e) {
        console.error("snapshot pos-pago", e);
      }
    } catch (e) {
      console.error("aviso pagamento", e);
      aviso = { ok: false, erro: e instanceof Error ? e.message : "falha" };
    }
  }

  return Response.json({ received: true, pos, aviso });
}
