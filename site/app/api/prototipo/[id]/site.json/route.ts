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
  return new NextResponse(JSON.stringify(pacote.site, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${token}-site.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
