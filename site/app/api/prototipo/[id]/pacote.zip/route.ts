import { NextRequest, NextResponse } from "next/server";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { montarPacoteZip } from "@/lib/prototipos/pacote-zip";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = sanitizarToken(req.nextUrl.searchParams.get("t") || id);
  const pacote = await lerPacote(token);
  if (!pacote) {
    return NextResponse.json({ erro: "Rascunho inválido ou expirado." }, { status: 404 });
  }

  try {
    const { buffer } = await montarPacoteZip(pacote);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="guix-${token}-pacote.zip"`,
        "Cache-Control": "private, no-store",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    console.error("pacote.zip", e);
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Não foi possível montar o pacote." },
      { status: 500 },
    );
  }
}
