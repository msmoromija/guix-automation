import { NextRequest, NextResponse } from "next/server";
import { textoContratoOrcamento } from "@/lib/orcamentos/contrato";
import { montarContratoPdf } from "@/lib/orcamentos/contrato-pdf";
import { lerOrcamento, totalOrcamento } from "@/lib/orcamentos/store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const orcamento = await lerOrcamento(String(id || "").trim());
  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado." }, { status: 404 });
  }
  const texto = textoContratoOrcamento(orcamento);
  const pdf = montarContratoPdf({
    titulo: orcamento.titulo,
    id: orcamento.id,
    texto,
    clienteNome: orcamento.clienteNome,
    valorCentavos: orcamento.valorCentavos,
    descontoCentavos: orcamento.descontoCentavos,
    totalCentavos: totalOrcamento(orcamento),
    prazo: orcamento.prazo,
  });
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="guix-contrato-${orcamento.id}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
