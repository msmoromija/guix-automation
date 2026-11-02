import { NextRequest, NextResponse } from "next/server";
import { BUSCA_FOTO } from "@/lib/media/catalogo";
import type { Nicho } from "@/lib/media/tipos";
import { buscarUnsplash, montarCredito } from "@/lib/media/unsplash";
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
  if (cur.n >= 40) return false;
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
  const buscaLivre = (req.nextUrl.searchParams.get("busca") || "").trim().slice(0, 80);
  const chave = req.nextUrl.searchParams.get("q") || "servico";
  const mapa = cfg.query as Record<string, string>;
  const q = buscaLivre || mapa[chave] || mapa.servico || mapa.hero;
  try {
    const fotos = await buscarUnsplash(q, 12);
    return NextResponse.json({
      fotos: fotos.map((f) => ({
        src: enquadrarFoto(f.url_regular, 900, 560) || f.url_regular,
        thumb: f.url_thumb,
        alt: f.descricao,
        credito: montarCredito(f),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg || "Não deu para buscar fotos agora.", fotos: [] }, { status: 502 });
  }
}
