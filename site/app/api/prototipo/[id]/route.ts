import { NextRequest, NextResponse } from "next/server";
import { autenticarPreview, lerSitePreview, urlConta, urlPreview } from "@/lib/previews/store";

export const runtime = "nodejs";

/** Metadados + resumo do protótipo. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = req.nextUrl.searchParams.get("t") || "";
  const meta = await autenticarPreview(id, token);
  if (!meta) {
    return NextResponse.json({ erro: "protótipo inválido ou expirado" }, { status: 403 });
  }

  const site = await lerSitePreview(meta.clienteId);
  const hero = site?.hero as { titulo?: string; subtitulo?: string } | undefined;
  const empresa = site?.empresa as { nome?: string; slogan?: string } | undefined;

  return NextResponse.json({
    id: meta.id,
    nicho: meta.nicho,
    nome: meta.nome,
    cidade: meta.cidade,
    status: meta.status,
    expiraEm: meta.expiraEm,
    previewUrl: urlPreview(meta.id, meta.token),
    contaUrl: urlConta(meta.id, meta.token),
    downloadUrl: `/api/prototipo/${meta.id}/site.json?t=${meta.token}`,
    demoUrl: `/casas/${meta.nicho}/`,
    contratarUrl: `/contratar?plano=simples&nicho=${meta.nicho}&preview=${meta.id}&t=${meta.token}`,
    resumo: {
      empresa: empresa?.nome || meta.nome,
      slogan: empresa?.slogan,
      heroTitulo: hero?.titulo,
      heroSubtitulo: hero?.subtitulo,
    },
  });
}
