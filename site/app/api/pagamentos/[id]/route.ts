import { lerCobranca } from "@/lib/asaas";

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) {
    return Response.json({ erro: "Cobrança não encontrada." }, { status: 404 });
  }
  try {
    const cobranca = await lerCobranca(id);
    return Response.json({ cobranca });
  } catch (erro) {
    const mensagem = erro instanceof Error && erro.message !== "ASAAS_NAO_CONFIGURADO"
      ? erro.message
      : "Não foi possível consultar esta cobrança.";
    return Response.json({ erro: mensagem }, { status: 502 });
  }
}
