import { NextRequest, NextResponse } from "next/server";
import { gerarLoteLogos } from "@/lib/estudio/ia-marca";
import { LIMITE_IA_LOGO, type SpecLogo } from "@/lib/estudio/logo-spec";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";
export const maxDuration = 30;

const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string) {
  const agora = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < agora) {
    hits.set(ip, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 12) return false;
  cur.n += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ erro: "Limite de lotes de marca nesta hora." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const nome = String(body.nome || "").trim();
    const nicho = String(body.nicho || "barbearia") as Nicho;
    const evitar = Array.isArray(body.evitar) ? (body.evitar as SpecLogo[]) : [];
    const jaIa = evitar.filter((e) => e?.origem === "ia").length;
    if (jaIa >= LIMITE_IA_LOGO) {
      return NextResponse.json({ erro: "Limite de 10 marcas geradas. Escolha na lista ou envie o arquivo." }, { status: 400 });
    }
    const propostas = await gerarLoteLogos({ nome: nome || nicho, nicho, evitar });
    return NextResponse.json({ ok: true, propostas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
