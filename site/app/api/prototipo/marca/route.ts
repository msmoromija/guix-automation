import { NextRequest, NextResponse } from "next/server";
import { gerarEmblemaIa, montarLockupComEmblema } from "@/lib/estudio/ia-marca";
import { lockupEmblema } from "@/lib/estudio/marca";
import { paletaPorId } from "@/lib/estudio/visual";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string) {
  const agora = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < agora) {
    hits.set(ip, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 4) return false;
  cur.n += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ erro: "Limite de marcas com IA nesta hora." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const nome = String(body.nome || "").trim();
    if (nome.length < 2) {
      return NextResponse.json({ erro: "informe o nome do negócio para gerar a marca" }, { status: 400 });
    }
    const nicho = String(body.nicho || "barbearia") as Nicho;
    const slogan = String(body.slogan || "").trim() || undefined;
    const paleta = paletaPorId(String(body.paletaId || ""));

    let origem: "ia" | "estudio" = "ia";
    let aviso: string | undefined;
    let src: string;
    try {
      const emblema = await gerarEmblemaIa({
        nome,
        nicho,
        acento: paleta.color_accent,
        fundo: paleta.color_background,
      });
      src = montarLockupComEmblema({
        nome,
        slogan,
        fundo: paleta.color_background,
        tinta: paleta.color_text,
        acento: paleta.color_accent,
        nicho,
        emblemaWebp: emblema,
      });
    } catch {
      origem = "estudio";
      aviso = "A geração de imagem não respondeu. Montamos o símbolo do ofício com o nome tipografado.";
      src = lockupEmblema({
        nome,
        slogan,
        fundo: paleta.color_background,
        tinta: paleta.color_text,
        acento: paleta.color_accent,
        nicho,
      });
    }

    return NextResponse.json({
      ok: true,
      origem,
      aviso,
      proposta: {
        id: `ia-${Date.now().toString(36)}`,
        titulo: origem === "ia" ? "Marca com IA" : "Símbolo do ofício",
        nota: aviso || "Emblema gerado + nome tipografado",
        src,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
