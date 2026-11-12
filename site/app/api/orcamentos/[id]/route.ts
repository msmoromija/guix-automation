import { NextRequest, NextResponse } from "next/server";
import { textoContratoOrcamento } from "@/lib/orcamentos/contrato";
import { lerOrcamento, totalOrcamento, urlOrcamento } from "@/lib/orcamentos/store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const orcamento = await lerOrcamento(String(id || "").trim());
  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado ou link inválido." }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    orcamento: {
      id: orcamento.id,
      titulo: orcamento.titulo,
      descricao: orcamento.descricao,
      prazo: orcamento.prazo || "",
      clienteNome: orcamento.clienteNome,
      valorCentavos: orcamento.valorCentavos,
      descontoCentavos: orcamento.descontoCentavos,
      totalCentavos: totalOrcamento(orcamento),
      status: orcamento.status,
      criadoEm: orcamento.criadoEm,
      url: urlOrcamento(orcamento.id),
    },
    contrato: textoContratoOrcamento(orcamento),
  });
}
