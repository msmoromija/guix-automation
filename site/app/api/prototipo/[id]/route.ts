import { NextRequest, NextResponse } from "next/server";
import { gravarPacote, horasRestantes, lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { aplicarEstudio, aplicarSrcNoSlot, sanitizarFotoSrc, sanitizarLogoSrc } from "@/lib/estudio/aplicar";
import { aplicarCampoNoSite, aplicarCopiaNoSite, normalizarCopia } from "@/lib/estudio/copia-viva";
import { avisoFora, limparHorario } from "@/lib/estudio/pedido-fechado";
import { ajustarBloco } from "@/lib/media/openai";
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

  const pedido = String(body.pedido || "").trim().slice(0, 80);
  const alvo = String(body.alvo || "");
  if (alvo && body.nome == null && !body.visual) {
    const fora = avisoFora(pedido);
    if (fora) return NextResponse.json({ aviso: fora, site: pacote.site });
    if (alvo === "horario") {
      const horario = limparHorario(pedido);
      if (!horario) return NextResponse.json({ aviso: "Escreva os dias e as horas." });
      const site = aplicarCampoNoSite(structuredClone(pacote.site), "horario", horario);
      await gravarPacote({ ...pacote, site });
      return NextResponse.json({ ok: true, token, site, aviso: "", expiraEm: pacote.expiraEm });
    }
    if (alvo !== "capa" && alvo !== "sobre" && alvo !== "servicos") {
      return NextResponse.json({ aviso: "Escolha horário, capa, sobre ou serviços." });
    }
    try {
      const empresa = (pacote.site.empresa || {}) as { nome?: string; endereco?: { cidade?: string; bairro?: string } };
      const itens = ((pacote.site.servicos as { itens?: { nome?: string; descricao?: string }[] })?.itens || []).map((s) => ({
        nome: String(s.nome || ""),
        descricao: String(s.descricao || ""),
      }));
      const atual =
        alvo === "capa" ? pacote.site.hero : alvo === "sobre" ? pacote.site.sobre : { itens: itens.map((s) => ({ descricao: s.descricao })) };
      const gerado = await ajustarBloco({
        alvo,
        instrucao: pedido,
        nome: empresa.nome || pacote.nome,
        nicho: pacote.nicho as Nicho,
        cidade: empresa.endereco?.cidade || pacote.cidade,
        bairro: empresa.endereco?.bairro,
        servicos: itens,
        atual,
      });
      const copia = normalizarCopia(gerado.copia);
      const site = aplicarCopiaNoSite(structuredClone(pacote.site), copia);
      await gravarPacote({ ...pacote, site });
      return NextResponse.json({
        ok: true,
        token,
        site,
        aviso: String(gerado.aviso || "").slice(0, 280),
        expiraEm: pacote.expiraEm,
      });
    } catch {
      return NextResponse.json({ aviso: "Demorou demais. Esse bloco não mudou. Edite o texto direto no quadro.", site: pacote.site });
    }
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
