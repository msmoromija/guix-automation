import { lerCobranca } from "@/lib/asaas";
import { obterPreviewPorCobranca, urlPreview } from "@/lib/previews/store";

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) {
    return Response.json({ erro: "Cobrança não encontrada." }, { status: 404 });
  }
  try {
    const cobranca = await lerCobranca(id);
    let preview: { id: string; url: string; downloadUrl: string; status: string } | null = null;
    try {
      const meta = await obterPreviewPorCobranca(id);
      if (meta) {
        preview = {
          id: meta.id,
          url: urlPreview(meta.id, meta.token),
          downloadUrl: `/api/prototipo/${meta.id}/site.json?t=${meta.token}`,
          status: meta.status,
        };
      }
    } catch {
      /* store opcional */
    }
    return Response.json({ cobranca, preview });
  } catch (erro) {
    const mensagem =
      erro instanceof Error && erro.message !== "ASAAS_NAO_CONFIGURADO"
        ? erro.message
        : "Não foi possível consultar esta cobrança.";
    return Response.json({ erro: mensagem }, { status: 502 });
  }
}
