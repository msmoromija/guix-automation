import { NextRequest, NextResponse } from "next/server";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = sanitizarToken(req.nextUrl.searchParams.get("t") || id);
  const pacote = await lerPacote(token);
  if (!pacote) {
    return NextResponse.json({ erro: "Rascunho inválido ou expirado." }, { status: 404 });
  }
  return NextResponse.json({
    id: token,
    token,
    nicho: pacote.nicho,
    status: "rascunho",
    expiraEm: pacote.expiraEm,
    site: pacote.site,
    visual: pacote.visual,
  });
}
