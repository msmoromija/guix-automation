import { NextResponse } from "next/server";
import { calcularTotal, type Configuracao, type PlanoId } from "@/lib/planos";
import { lerCupom, normalizarCodigo, validarCupomParaTotal } from "@/lib/cupons/store";

export const runtime = "nodejs";

export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const codigo = normalizarCodigo(String(corpo.codigo || ""));
  const plano: PlanoId | null =
    corpo.plano === "avancado" ? "avancado" : corpo.plano === "simples" ? "simples" : null;
  const configuracao: Configuracao | null =
    corpo.configuracao === "equipe" ? "equipe" : corpo.configuracao === "ia" ? "ia" : null;

  if (!codigo) return NextResponse.json({ erro: "Informe o código do cupom." }, { status: 400 });
  if (!plano || !configuracao) {
    return NextResponse.json({ erro: "Escolha o plano e a configuração." }, { status: 400 });
  }

  const centavos = calcularTotal(plano, configuracao);
  const cupom = await lerCupom(codigo);
  const resultado = validarCupomParaTotal(cupom, centavos, plano);
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    codigo: resultado.cupom.codigo,
    tipo: resultado.cupom.tipo,
    mensagem: resultado.mensagem,
    subtotalCentavos: centavos,
    descontoCentavos: resultado.descontoCentavos,
    totalCentavos: resultado.totalCentavos,
  });
}
