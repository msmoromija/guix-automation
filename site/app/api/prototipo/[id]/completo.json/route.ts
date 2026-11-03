import { NextRequest, NextResponse } from "next/server";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { googleFontsHref, tipoPorId } from "@/lib/estudio/visual";

export const runtime = "nodejs";

/** JSON completo para replicar: site + visual + meta + fontes (sem binários). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = sanitizarToken(req.nextUrl.searchParams.get("t") || id);
  const pacote = await lerPacote(token);
  if (!pacote) {
    return NextResponse.json({ erro: "Rascunho inválido ou expirado." }, { status: 404 });
  }

  const visual = pacote.visual || null;
  const tipo = visual ? tipoPorId(visual.tipografiaId) : null;
  const corpo = {
    versaoPacote: "1.0",
    meta: {
      token: pacote.token,
      nicho: pacote.nicho,
      nome: pacote.nome,
      cidade: pacote.cidade || "",
      whatsapp: pacote.whatsapp || "",
      email: pacote.email || "",
      slogan: pacote.slogan || "",
      status: pacote.status || "rascunho",
      criadoEm: pacote.criadoEm,
      expiraEm: pacote.expiraEm,
    },
    site: pacote.site,
    visual: visual || {},
    fonts: visual
      ? {
          tipografiaId: visual.tipografiaId,
          font_heading: tipo?.font_heading,
          font_body: tipo?.font_body,
          googleFontsCss: googleFontsHref(visual),
        }
      : {},
    pacoteZipUrl: `/api/prototipo/${token}/pacote.zip?t=${token}`,
  };

  return new NextResponse(JSON.stringify(corpo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="guix-${token}-completo.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
