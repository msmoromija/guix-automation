import { NextRequest, NextResponse } from "next/server";
import { gerarSiteCliente } from "@/lib/automacao/gerar-site";
import type { Nicho } from "@/lib/media/tipos";
import {
  reservarSlot,
  salvarSitePreview,
  slotsLivres,
  urlConta,
  urlPreview,
} from "@/lib/previews/store";
import { PREVIEW_MAX_SLOTS } from "@/lib/previews/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

const NICHOS_OK = new Set([
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
]);

/** Rate limit simples em memória (por IP). */
const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string) {
  const agora = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < agora) {
    hits.set(ip, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 5) return false;
  cur.n += 1;
  return true;
}

/**
 * Protótipo grátis (antes de pagar):
 * gera site.json, reserva slot de preview, devolve links + token.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { erro: "Limite de protótipos nesta hora. Tente mais tarde ou fale no WhatsApp." },
      { status: 429 },
    );
  }

  try {
    const livres = await slotsLivres();
    if (livres <= 0) {
      return NextResponse.json(
        {
          erro: `Todos os ${PREVIEW_MAX_SLOTS} slots de preview estão em uso. Tente em breve ou contrate direto.`,
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const nome = String(body.nome || "").trim();
    const nicho = String(body.nicho || "").trim() as Nicho;
    const cidade = String(body.cidade || "").trim() || undefined;
    const whatsapp = String(body.whatsapp || "").trim() || undefined;
    const email = String(body.email || "").trim() || undefined;

    if (!nome || nome.length < 2) {
      return NextResponse.json({ erro: "informe o nome do negócio" }, { status: 400 });
    }
    if (!NICHOS_OK.has(nicho)) {
      return NextResponse.json({ erro: "nicho inválido" }, { status: 400 });
    }

    const meta = await reservarSlot({ nicho, nome, cidade, whatsapp, email });

    const gerado = await gerarSiteCliente({
      clienteId: meta.clienteId,
      nicho,
      nome,
      cidade,
      whatsapp,
      email,
      tom: "profissional e acolhedor",
    });

    await salvarSitePreview(meta.clienteId, gerado.site);

    return NextResponse.json({
      ok: true,
      id: meta.id,
      token: meta.token,
      clienteId: meta.clienteId,
      expiraEm: meta.expiraEm,
      slotsLivres: livres - 1,
      previewUrl: urlPreview(meta.id, meta.token),
      contaUrl: urlConta(meta.id, meta.token),
      downloadUrl: `/api/prototipo/${meta.id}/site.json?t=${meta.token}`,
      avisos: gerado.avisos,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}

export async function GET() {
  const livres = await slotsLivres();
  return NextResponse.json({ slotsLivres: livres, max: PREVIEW_MAX_SLOTS });
}
