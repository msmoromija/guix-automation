import { timingSafeEqual } from "crypto";
import { marcarPreviewPago } from "@/lib/previews/store";
import { executarPosPagamento } from "@/lib/automacao/pos-pagamento";

export const runtime = "nodejs";
export const maxDuration = 60;

function tokenConfere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

const PAGOS = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

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
  }

  return Response.json({ received: true, pos });
}
