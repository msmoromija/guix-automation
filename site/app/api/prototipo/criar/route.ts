import { NextRequest, NextResponse } from "next/server";
import { gerarSiteCliente } from "@/lib/automacao/gerar-site";
import { aplicarEstudio, sanitizarLogoSrc } from "@/lib/estudio/aplicar";
import { repararParaSchema } from "@/lib/automacao/limpar-exemplo";
import { visualPadrao, type VisualConfig } from "@/lib/estudio/visual";
import { tomDoEstilo } from "@/lib/media/catalogo";
import type { Nicho } from "@/lib/media/tipos";
import {
  gravarPacote,
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
    const slogan = String(body.slogan || "").trim() || undefined;
    const instagram = String(body.instagram || body.redes?.instagram || "").trim() || undefined;
    const facebook = String(body.facebook || body.redes?.facebook || "").trim() || undefined;
    const tiktok = String(body.tiktok || body.redes?.tiktok || "").trim() || undefined;
    const youtube = String(body.youtube || body.redes?.youtube || "").trim() || undefined;
    const linkedin = String(body.linkedin || body.redes?.linkedin || "").trim() || undefined;
    const logradouro = String(body.logradouro || body.endereco?.logradouro || "").trim() || undefined;
    const numero = String(body.numero || body.endereco?.numero || "").trim() || undefined;
    const bairro = String(body.bairro || body.endereco?.bairro || "").trim() || undefined;
    const estado = String(body.estado || body.endereco?.estado || "").trim() || undefined;
    const cep = String(body.cep || body.endereco?.cep || "").trim() || undefined;
    const visual: VisualConfig = { ...visualPadrao(nicho), ...(body.visual || {}) };
    const logoSrc = sanitizarLogoSrc(body.logoSrc);
    const servicos = Array.isArray(body.servicos) ? body.servicos : [];
    const profissionais = Array.isArray(body.profissionais) ? body.profissionais : [];
    const tom = String(body.tom || tomDoEstilo(visual.estilo)).trim();
    const destaque = String(body.destaque || "").trim() || undefined;
    const iaEscreve = body.iaEscreve !== false;

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
      slogan,
      cidade,
      whatsapp,
      email,
      instagram,
      facebook,
      tiktok,
      youtube,
      linkedin,
      logradouro,
      numero,
      bairro,
      estado,
      cep,
      tom,
      estilo: visual.estilo,
      destaque,
      iaEscreve,
      servicos: servicos.map((s: { nome?: string }) => String(s.nome || "").trim()).filter(Boolean),
      servicosDetalhe: servicos
        .filter((s: { nome?: string }) => String(s.nome || "").trim())
        .map((s: { nome?: string; descricao?: string; preco?: string; duracao?: string }) => ({
          nome: String(s.nome || "").trim(),
          descricao: String(s.descricao || "").trim() || undefined,
          preco: String(s.preco || "").trim() || undefined,
          duracao: String(s.duracao || "").trim() || undefined,
        })),
      profissionaisDetalhe: profissionais
        .filter((p: { nome?: string }) => {
          const n = String(p.nome || "").trim();
          return n && n !== "Novo nome";
        })
        .map((p: { nome?: string; cargo?: string; descricao?: string }) => ({
          nome: String(p.nome || "").trim(),
          cargo: String(p.cargo || "").trim() || undefined,
          descricao: String(p.descricao || "").trim() || undefined,
        })),
    });
    aplicarEstudio(gerado.site, {
      entrada: {
        clienteId: `t${token}`,
        nicho,
        nome,
        slogan,
        cidade,
        whatsapp,
        email,
        instagram,
        facebook,
        tiktok,
        youtube,
        linkedin,
        logradouro,
        numero,
        bairro,
        estado,
        cep,
      },
      visual,
      logoSrc,
      servicos,
      profissionais,
    });
    repararParaSchema(gerado.site, {
      clienteId: `t${token}`,
      nicho,
      nome,
      slogan,
      cidade,
      whatsapp,
      email,
      profissionaisDetalhe: profissionais
        .filter((p: { nome?: string }) => {
          const n = String(p.nome || "").trim();
          return n && n !== "Novo nome";
        })
        .map((p: { nome?: string; cargo?: string; descricao?: string }) => ({
          nome: String(p.nome || "").trim(),
          cargo: String(p.cargo || "").trim() || undefined,
          descricao: String(p.descricao || "").trim() || undefined,
        })),
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
      visual,
      slogan,
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
