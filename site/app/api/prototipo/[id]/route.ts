import { NextRequest, NextResponse } from "next/server";
import { gravarPacote, horasRestantes, lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { aplicarDadosCliente } from "@/lib/automacao/aplicar-cliente";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";

function tokenDaReq(req: NextRequest, id: string) {
  return sanitizarToken(req.nextUrl.searchParams.get("t") || id);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = tokenDaReq(req, id);
  const pacote = await lerPacote(token);
  if (!pacote) {
    return NextResponse.json(
      { erro: "Rascunho inválido ou expirado. Gere de novo — o prazo é de 72 horas." },
      { status: 404 },
    );
  }

  const site = pacote.site;
  const hero = site.hero as { titulo?: string; subtitulo?: string } | undefined;
  const empresa = site.empresa as { nome?: string; slogan?: string } | undefined;

  return NextResponse.json({
    id: token,
    token,
    nicho: pacote.nicho,
    nome: pacote.nome,
    cidade: pacote.cidade,
    status: "rascunho",
    expiraEm: pacote.expiraEm,
    horasRestantes: horasRestantes(pacote),
    previewUrl: `/visualizar/${token}`,
    contaUrl: `/visualizar/${token}`,
    downloadUrl: `/api/prototipo/${token}/site.json?t=${token}`,
    demoUrl: `/casas/${pacote.nicho}/`,
    contratarUrl: `/contratar?plano=simples&nicho=${pacote.nicho}&preview=${token}&t=${token}`,
    resumo: {
      empresa: empresa?.nome || pacote.nome,
      slogan: empresa?.slogan,
      heroTitulo: hero?.titulo,
      heroSubtitulo: hero?.subtitulo,
    },
  });
}

/** Edição leve do rascunho (nome/cidade/whatsapp) sem republicar página. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = tokenDaReq(req, id);
  const pacote = await lerPacote(token);
  if (!pacote) {
    return NextResponse.json({ erro: "Rascunho inválido ou expirado." }, { status: 404 });
  }

  const body = await req.json();
  const nome = String(body.nome || pacote.nome).trim();
  const cidade = String(body.cidade || pacote.cidade || "").trim() || undefined;
  const whatsapp = String(body.whatsapp || pacote.whatsapp || "").trim() || undefined;

  let site = aplicarDadosCliente(pacote.site, {
    clienteId: `t${token}`,
    nicho: pacote.nicho as Nicho,
    nome,
    cidade,
    whatsapp,
  });

  const atualizado = {
    ...pacote,
    nome,
    cidade,
    whatsapp,
    site,
  };
  await gravarPacote(atualizado);
  return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
}
