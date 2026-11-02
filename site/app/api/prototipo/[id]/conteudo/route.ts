import { NextRequest, NextResponse } from "next/server";
import { autenticarPreview, lerSitePreview } from "@/lib/previews/store";

export const runtime = "nodejs";

/** site.json inline para a vitrine ao vivo (não é download). */
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
  return NextResponse.json({
    id: meta.id,
    nicho: meta.nicho,
    status: meta.status,
    site,
  });
}
