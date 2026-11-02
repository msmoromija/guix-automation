import { NextRequest, NextResponse } from "next/server";
import { BUSCA_FOTO } from "@/lib/media/catalogo";
import type { Nicho } from "@/lib/media/tipos";
import { buscarUnsplash } from "@/lib/media/unsplash";
import { enquadrarFoto } from "@/lib/media/tratar-url";

export const runtime = "nodejs";

const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string) {
  const agora = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < agora) {
    hits.set(ip, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 20) return false;
  cur.n += 1;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ erro: "muitas buscas" }, { status: 429 });
  }
  const nicho = (req.nextUrl.searchParams.get("nicho") || "barbearia") as Nicho;
  const cfg = BUSCA_FOTO[nicho] || BUSCA_FOTO.generico;
  const q = req.nextUrl.searchParams.get("q") || cfg.query.servico || cfg.query.hero;
  try {
    const fotos = await buscarUnsplash(q, 8);
    return NextResponse.json({
      fotos: fotos.map((f) => ({
        src: enquadrarFoto(f.url_regular, 900, 560) || f.url_regular,
        thumb: f.url_thumb,
        alt: f.descricao,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg, fotos: [] }, { status: 200 });
  }
}
