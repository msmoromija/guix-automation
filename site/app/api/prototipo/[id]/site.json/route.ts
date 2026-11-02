import { NextRequest, NextResponse } from "next/server";
import { autenticarPreview, lerSitePreview } from "@/lib/previews/store";

export const runtime = "nodejs";

/** Download do site.json do protótipo (exige token). */
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
  if (!site) {
    return NextResponse.json({ erro: "site.json não encontrado" }, { status: 404 });
  }

  const nome = `${meta.clienteId}-site.json`;
  return new NextResponse(JSON.stringify(site, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
