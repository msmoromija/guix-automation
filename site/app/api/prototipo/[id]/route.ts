import { NextRequest, NextResponse } from "next/server";
import { gravarPacote, horasRestantes, lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { aplicarEstudio, aplicarSrcNoSlot, sanitizarFotoSrc, sanitizarLogoSrc } from "@/lib/estudio/aplicar";
import { aplicarPedido, type PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { aplicarCampoNoSite } from "@/lib/estudio/copia-viva";
import { AVISO_FECHADO, AVISO_LIMITE, LIMITE_PEDIDOS_IA } from "@/lib/estudio/pedido-fechado";
import type { Nicho } from "@/lib/media/tipos";
import { visualPadrao, type VisualConfig } from "@/lib/estudio/visual";

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
    visual: pacote.visual,
    edicaoFechada: Boolean(pacote.edicaoFechada),
    pedidosIa: pacote.pedidosIa || 0,
    limitePedidos: LIMITE_PEDIDOS_IA,
    desfazer: (pacote.historico || []).length,
    resumo: {
      empresa: empresa?.nome || pacote.nome,
      slogan: empresa?.slogan,
      heroTitulo: hero?.titulo,
      heroSubtitulo: hero?.subtitulo,
    },
  });
}

/** Edição leve do rascunho. Foto-only não reescreve copy. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = tokenDaReq(req, id);
  const pacote = await lerPacote(token);
  if (!pacote) {
    return NextResponse.json({ erro: "Rascunho inválido ou expirado." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const mexe = Boolean(body.patch || body.campo || body.fotoSrc || body.logoSrc || body.visual || body.nome != null);
  if (pacote.edicaoFechada && body.fechar !== true && mexe) {
    return NextResponse.json({
      aviso: AVISO_FECHADO,
      edicaoFechada: true,
      site: pacote.site,
      visual: pacote.visual,
    });
  }

  if (body.fechar === true) {
    const atualizado = {
      ...pacote,
      edicaoFechada: true,
      fechadoEm: pacote.fechadoEm || new Date().toISOString(),
    };
    await gravarPacote(atualizado);
    return NextResponse.json({
      ok: true,
      edicaoFechada: true,
      site: pacote.site,
      visual: pacote.visual,
      aviso: AVISO_FECHADO,
    });
  }

  if (body.desfazer === true) {
    const historico = pacote.historico || [];
    const anterior = historico[historico.length - 1];
    if (!anterior) return NextResponse.json({ aviso: "Nada para desfazer.", desfazer: 0 });
    const atualizado = {
      ...pacote,
      site: anterior.site,
      visual: anterior.visual || pacote.visual,
      historico: historico.slice(0, -1),
    };
    await gravarPacote(atualizado);
    return NextResponse.json({
      ok: true,
      site: atualizado.site,
      visual: atualizado.visual,
      desfazer: atualizado.historico.length,
      pedidosIa: pacote.pedidosIa || 0,
      limitePedidos: LIMITE_PEDIDOS_IA,
    });
  }

  if (body.patch && typeof body.patch === "object") {
    const usados = pacote.pedidosIa || 0;
    if (usados >= LIMITE_PEDIDOS_IA) {
      return NextResponse.json({
        aviso: AVISO_LIMITE,
        limite: true,
        pedidosIa: usados,
        limitePedidos: LIMITE_PEDIDOS_IA,
        site: pacote.site,
        visual: pacote.visual,
      });
    }
    const visual = { ...visualPadrao(pacote.nicho), ...(pacote.visual || {}) };
    const resultado = aplicarPedido(structuredClone(pacote.site), visual, body.patch as PatchPedido);
    const empresa = resultado.site.empresa as { whatsapp?: string; endereco?: { cidade?: string } } | undefined;
    const historico = [...(pacote.historico || []), { site: pacote.site, visual: pacote.visual }].slice(-3);
    const pedidosIa = usados + 1;
    await gravarPacote({
      ...pacote,
      site: resultado.site,
      visual: resultado.visual,
      whatsapp: empresa?.whatsapp || pacote.whatsapp,
      cidade: empresa?.endereco?.cidade || pacote.cidade,
      historico,
      pedidosIa,
    });
    return NextResponse.json({
      ok: true,
      token,
      site: resultado.site,
      visual: resultado.visual,
      aviso: [resultado.aviso, pedidosIa >= LIMITE_PEDIDOS_IA ? AVISO_LIMITE : ""].filter(Boolean).join(" "),
      resumo: resultado.resumo,
      abrir: resultado.abrir,
      pedidosIa,
      limitePedidos: LIMITE_PEDIDOS_IA,
      desfazer: historico.length,
      expiraEm: pacote.expiraEm,
    });
  }

  if (body.somenteLogo === true) {
    const logoSrc = sanitizarLogoSrc(body.logoSrc);
    if (!logoSrc) return NextResponse.json({ erro: "Envie uma imagem de logo." }, { status: 400 });
    const site = structuredClone(pacote.site);
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    const logo = { ...((empresa.logo as Record<string, unknown>) || {}) };
    logo.src = logoSrc;
    logo.alt = String(empresa.nome || "Logo");
    delete logo.credito;
    empresa.logo = logo;
    site.empresa = empresa;
    await gravarPacote({ ...pacote, site });
    return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
  }

  const campo = String(body.campo || "");
  const valorCampo = String(body.valor || "");
  if (campo && valorCampo && body.nome == null && !body.visual && !body.fotoSrc) {
    const site = aplicarCampoNoSite(structuredClone(pacote.site), campo, valorCampo);
    await gravarPacote({ ...pacote, site });
    return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
  }

  const fotoSrc = sanitizarFotoSrc(body.fotoSrc);
  const slot = body.slot as { tipo?: "hero" | "sobre" | "galeria" | "servico"; indice?: number } | undefined;
  const soFoto = Boolean(fotoSrc && slot?.tipo && body.nome == null && body.cidade == null && body.whatsapp == null && body.slogan == null && !body.visual && !body.logoSrc);

  if (soFoto && fotoSrc && slot?.tipo) {
    const site = aplicarSrcNoSlot({ ...pacote.site }, { tipo: slot.tipo, indice: slot.indice }, fotoSrc);
    const atualizado = { ...pacote, site };
    await gravarPacote(atualizado);
    return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
  }

  const nome = String(body.nome ?? pacote.nome).trim();
  const cidade = body.cidade !== undefined ? String(body.cidade || "").trim() || undefined : pacote.cidade;
  const whatsapp = body.whatsapp !== undefined ? String(body.whatsapp || "").trim() || undefined : pacote.whatsapp;
  const slogan = body.slogan !== undefined ? String(body.slogan || "").trim() || undefined : pacote.slogan;
  const visual: VisualConfig = {
    ...visualPadrao(pacote.nicho),
    ...(pacote.visual || {}),
    ...(body.visual && typeof body.visual === "object" ? (body.visual as VisualConfig) : {}),
  };

  const site = aplicarEstudio(pacote.site, {
    entrada: {
      clienteId: `t${token}`,
      nicho: pacote.nicho as Nicho,
      nome,
      cidade,
      whatsapp,
      slogan,
    },
    visual,
    logoSrc: sanitizarLogoSrc(body.logoSrc),
    aplicarServicos: false,
    aplicarProfissionais: false,
    preservarModeloQuandoVazio: true,
  });
  if (fotoSrc && slot?.tipo) {
    aplicarSrcNoSlot(site, { tipo: slot.tipo, indice: slot.indice }, fotoSrc);
  }

  const atualizado = {
    ...pacote,
    nome,
    cidade,
    whatsapp,
    slogan,
    visual,
    site,
  };
  await gravarPacote(atualizado);
  return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
}
