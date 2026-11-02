import { NextRequest, NextResponse } from "next/server";
import { gerarSiteCliente } from "@/lib/automacao/gerar-site";
import type { Nicho } from "@/lib/media/tipos";
import {
  gravarPacote,
  horasRestantes,
  novoToken,
  PROTOTIPO_TTL_MS,
  sanitizarToken,
} from "@/lib/prototipos/cofre";

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

const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string) {
  const agora = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < agora) {
    hits.set(ip, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 8) return false;
  cur.n += 1;
  return true;
}

/**
 * Gera site.json, guarda com token (72h). Não reserva página no ar.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { erro: "Limite de rascunhos nesta hora. Tente mais tarde ou fale no WhatsApp." },
      { status: 429 },
    );
  }

  try {
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

    const token = sanitizarToken(novoToken());
    const gerado = await gerarSiteCliente({
      clienteId: `t${token}`,
      nicho,
      nome,
      cidade,
      whatsapp,
      email,
      tom: "profissional e acolhedor",
    });

    const agora = Date.now();
    await gravarPacote({
      token,
      nicho,
      nome,
      cidade,
      whatsapp,
      email,
      criadoEm: new Date(agora).toISOString(),
      expiraEm: new Date(agora + PROTOTIPO_TTL_MS).toISOString(),
      site: gerado.site,
    });

    return NextResponse.json({
      ok: true,
      token,
      expiraEm: new Date(agora + PROTOTIPO_TTL_MS).toISOString(),
      horas: Math.round(PROTOTIPO_TTL_MS / 3600000),
      visualizarUrl: `/visualizar/${token}`,
      downloadUrl: `/api/prototipo/${token}/site.json?t=${token}`,
      avisos: gerado.avisos,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ttlHoras: Math.round(PROTOTIPO_TTL_MS / 3600000),
    nota: "Rascunho por token. Nada fica publicado até a contratação.",
  });
}
