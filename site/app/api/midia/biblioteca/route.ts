import { NextRequest, NextResponse } from "next/server";
import { autorizarPainel } from "@/lib/media/auth";
import { listarPrefixo } from "@/lib/media/r2";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!autorizarPainel(req)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const nicho = (req.nextUrl.searchParams.get("nicho") || "generico") as Nicho;
  const categoria = req.nextUrl.searchParams.get("categoria") || "hero";
  const prefix = `imagens/${nicho}/${categoria}/`;

  try {
    const itens = await listarPrefixo(prefix);
    return NextResponse.json({ nicho, categoria, itens });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
