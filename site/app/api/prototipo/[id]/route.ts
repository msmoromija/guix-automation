import { NextRequest, NextResponse } from "next/server";
import { gravarPacote, horasRestantes, lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { aprovarPrototipo, type CanalAprovacao } from "@/lib/prototipos/aprovar";
import { aplicarEstudio, aplicarSrcNoSlot, minutosDeRotulo, sanitizarFotoSrc, sanitizarLogoSrc } from "@/lib/estudio/aplicar";
import { normalizarPassoMinutos } from "@/lib/estudio/expediente";
import { urlCanal } from "@/lib/estudio/canais";
import { aplicarPedido, type PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { aplicarCampoNoSite } from "@/lib/estudio/copia-viva";
import { AVISO_FECHADO, AVISO_LIMITE, LIMITE_PEDIDOS_IA } from "@/lib/estudio/pedido-fechado";
import type { Nicho } from "@/lib/media/tipos";
import { sanitizarVisual, visualPadrao, type VisualConfig } from "@/lib/estudio/visual";

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
  const empresa = site.empresa as { nome?: string; slogan?: string; logo?: { src?: string } } | undefined;
  const logoSrc = String(empresa?.logo?.src || "");

  return NextResponse.json({
    id: token,
    token,
    nicho: pacote.nicho,
    nome: pacote.nome,
    cidade: pacote.cidade,
    whatsapp: pacote.whatsapp,
    status: pacote.status || (pacote.edicaoFechada ? "aprovado" : "rascunho"),
    expiraEm: pacote.expiraEm,
    horasRestantes: horasRestantes(pacote),
    previewUrl: `/visualizar/${token}`,
    contaUrl: `/conta/${token}?t=${token}`,
    downloadUrl: `/api/prototipo/${token}/site.json?t=${token}`,
    completoUrl: `/api/prototipo/${token}/completo.json?t=${token}`,
    pacoteZipUrl: `/api/prototipo/${token}/pacote.zip?t=${token}`,
    extratoUrl: `/conta/${token}/extrato?t=${token}`,
    agendaUrl: `/conta/${token}/agenda?t=${token}`,
    adminUrl: `/conta/${token}/admin?t=${token}`,
    demoUrl: `/casas/${pacote.nicho}/`,
    contratarUrl: `/contratar?plano=simples&nicho=${pacote.nicho}&preview=${token}&t=${token}`,
    agendarUrl: `/visualizar/${token}#agendar`,
    logoUrl: logoSrc.startsWith("http") || logoSrc.startsWith("data:") || logoSrc.startsWith("/") ? logoSrc : "",
    visual: pacote.visual,
    edicaoFechada: Boolean(pacote.edicaoFechada),
    aprovadoEm: pacote.aprovadoEm,
    prazoIntegracao: pacote.prazoIntegracao,
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

  if (body.aprovar === true) {
    const canaisRaw = Array.isArray(body.canais) ? body.canais : ["email", "sms", "whatsapp"];
    const canais = canaisRaw
      .map((c) => String(c))
      .filter((c): c is CanalAprovacao => c === "email" || c === "sms" || c === "whatsapp");
    const resultado = await aprovarPrototipo(pacote, {
      email: body.email != null ? String(body.email) : pacote.email,
      telefone: body.telefone != null ? String(body.telefone) : pacote.whatsapp,
      canais: canais.length ? canais : ["email"],
    });
    return NextResponse.json({
      ok: true,
      aprovado: true,
      token,
      status: resultado.pacote.status,
      aprovadoEm: resultado.pacote.aprovadoEm,
      prazoIntegracao: resultado.pacote.prazoIntegracao,
      links: resultado.links,
      envios: resultado.envios,
      ops: resultado.ops,
      edicaoFechada: true,
      site: resultado.pacote.site,
      visual: resultado.pacote.visual,
    });
  }

  if (pacote.edicaoFechada && body.fechar !== true && body.somenteAgenda !== true && body.somenteAdmin !== true) {
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
    const waNovo = String(empresa?.whatsapp || "").replace(/\D/g, "");
    const waOk = waNovo && !/^(55)?79999990000$/.test(waNovo) ? empresa?.whatsapp : pacote.whatsapp;
    const historico = [...(pacote.historico || []), { site: pacote.site, visual: pacote.visual }].slice(-3);
    const pedidosIa = usados + 1;
    await gravarPacote({
      ...pacote,
      site: resultado.site,
      visual: resultado.visual,
      whatsapp: waOk,
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

  /** Atualiza só horário da casa + grade/ausências por profissional (área do cliente). */
  if (body.somenteAgenda === true) {
    const site = structuredClone(pacote.site);
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    if (Array.isArray(body.expediente)) {
      empresa.expediente = body.expediente
        .map((raw) => {
          const d = raw as { dia?: string; label?: string; intervalos?: string[] };
          const dia = String(d.dia || "").slice(0, 3);
          const intervalos = Array.isArray(d.intervalos)
            ? d.intervalos.map((h) => String(h).slice(0, 5)).filter((h) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(h)).slice(0, 24)
            : [];
          if (!dia || !intervalos.length) return null;
          return { dia, label: String(d.label || dia).slice(0, 24), intervalos };
        })
        .filter(Boolean)
        .slice(0, 7);
    }
    site.empresa = empresa;

    const visualBase = { ...visualPadrao(pacote.nicho), ...(pacote.visual || {}) };
    let agendaEquipe = visualBase.agendaEquipe || [];
    if (Array.isArray(body.agendaEquipe)) {
      agendaEquipe = body.agendaEquipe
        .map((raw) => {
          const a = raw as {
            nome?: string;
            dias?: Array<string | { dia?: string; inicio?: string; fim?: string; pausa?: boolean; pausaInicio?: string; pausaFim?: string }>;
            ausencias?: Array<{ de?: string; ate?: string; motivo?: string }>;
          };
          const nome = String(a.nome || "").trim().slice(0, 80);
          if (!nome) return null;
          const dias = (a.dias || [])
            .map((item) => {
              if (typeof item === "string") {
                if (!["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(item)) return null;
                return { dia: item, inicio: "09:00", fim: "18:00" };
              }
              const dia = String(item?.dia || "");
              if (!["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(dia)) return null;
              return {
                dia,
                inicio: String(item.inicio || "09:00").slice(0, 5),
                fim: String(item.fim || "18:00").slice(0, 5),
                pausa: Boolean(item.pausa),
                pausaInicio: String(item.pausaInicio || "12:00").slice(0, 5),
                pausaFim: String(item.pausaFim || "13:00").slice(0, 5),
              };
            })
            .filter(Boolean)
            .slice(0, 7);
          const ausencias = (a.ausencias || [])
            .map((u) => ({
              de: String(u.de || "").slice(0, 10),
              ate: String(u.ate || u.de || "").slice(0, 10),
              motivo: String(u.motivo || "Ausente").slice(0, 80),
            }))
            .filter((u) => /^\d{4}-\d{2}-\d{2}$/.test(u.de))
            .slice(0, 24);
          return { nome, dias, ausencias };
        })
        .filter(Boolean)
        .slice(0, 24) as NonNullable<VisualConfig["agendaEquipe"]>;
    }
    const passoAgenda = normalizarPassoMinutos(
      Number(body.duracaoSlotMinutos) || visualBase.duracaoSlotMinutos,
    );
    const modoRaw = String(body.modoConfirmacaoAgenda || visualBase.modoConfirmacaoAgenda || "manual");
    const modoConfirmacaoAgenda =
      modoRaw === "automatico" || modoRaw === "whatsapp" || modoRaw === "manual" ? modoRaw : "manual";
    const visual: VisualConfig = {
      ...visualBase,
      agendaEquipe,
      duracaoSlotMinutos: passoAgenda,
      modoConfirmacaoAgenda,
    };
    await gravarPacote({ ...pacote, site, visual });
    return NextResponse.json({ ok: true, token, site, visual, expiraEm: pacote.expiraEm });
  }

  /** Painel administrador pós-venda (sem IA): equipe, avisos, serviços, FAQ, contato, horário. */
  if (body.somenteAdmin === true) {
    const site = structuredClone(pacote.site);
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    const passo = normalizarPassoMinutos(Number(body.duracaoSlotMinutos) || (pacote.visual as VisualConfig | undefined)?.duracaoSlotMinutos);

    if (Array.isArray(body.expediente)) {
      empresa.expediente = body.expediente
        .map((raw) => {
          const d = raw as { dia?: string; label?: string; intervalos?: string[] };
          const dia = String(d.dia || "").slice(0, 3);
          const intervalos = Array.isArray(d.intervalos)
            ? d.intervalos.map((h) => String(h).slice(0, 5)).filter((h) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(h)).slice(0, 48)
            : [];
          if (!dia || !intervalos.length) return null;
          return { dia, label: String(d.label || dia).slice(0, 24), intervalos };
        })
        .filter(Boolean)
        .slice(0, 7);
    }
    if (typeof body.horarioResumo === "string") {
      empresa.horario_resumo = String(body.horarioResumo).slice(0, 160);
    }
    if (typeof body.whatsapp === "string") {
      const dig = body.whatsapp.replace(/\D/g, "");
      if (dig.length >= 10) empresa.whatsapp = dig.startsWith("55") ? dig : `55${dig}`;
    }
    if (typeof body.email === "string") {
      empresa.email = String(body.email).trim().slice(0, 120);
    }
    if (body.endereco && typeof body.endereco === "object") {
      const end = body.endereco as Record<string, string>;
      const atual = { ...((empresa.endereco as Record<string, unknown>) || {}) };
      for (const k of ["logradouro", "numero", "bairro", "cidade", "estado", "cep", "mapa_embed_url"] as const) {
        if (end[k] !== undefined) atual[k] = String(end[k] || "").slice(0, k === "mapa_embed_url" ? 500 : 120);
      }
      empresa.endereco = atual;
    }
    if (body.redes && typeof body.redes === "object") {
      const redesIn = body.redes as { instagram?: string; facebook?: string };
      const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
      const upsert = (id: string, label: string, raw?: string) => {
        const url = raw ? urlCanal(id, raw) : "";
        const idx = redes.findIndex((r) => r.id === id);
        if (!url) {
          if (idx >= 0) redes.splice(idx, 1);
          return;
        }
        const item = { id, label, url };
        if (idx >= 0) redes[idx] = { ...redes[idx], ...item };
        else redes.push(item);
      };
      upsert("instagram", "Instagram", redesIn.instagram);
      upsert("facebook", "Facebook", redesIn.facebook);
      empresa.redes = redes;
    }
    site.empresa = empresa;

    if (Array.isArray(body.profissionais)) {
      const itens = body.profissionais
        .map((raw, i) => {
          const p = raw as { nome?: string; cargo?: string; descricao?: string; fotoSrc?: string; whatsapp?: string };
          const nome = String(p.nome || "").trim().slice(0, 80);
          if (!nome) return null;
          const fotoSrc = sanitizarFotoSrc(p.fotoSrc) || "";
          const wa = String(p.whatsapp || "").replace(/\D/g, "");
          return {
            id: `pro_p${i + 1}`,
            nome,
            cargo: String(p.cargo || "").slice(0, 80),
            descricao: String(p.descricao || "").slice(0, 400),
            whatsapp: wa.length >= 10 ? (wa.startsWith("55") ? wa : `55${wa}`) : "",
            foto: {
              id: `img_pro_p${i + 1}`,
              src: fotoSrc,
              alt: nome,
              categoria: "profissional",
              origem: fotoSrc.startsWith("data:") ? "upload" : fotoSrc ? "unsplash" : "biblioteca",
            },
          };
        })
        .filter(Boolean)
        .slice(0, 24);
      site.profissionais = {
        titulo: "Equipe",
        subtitulo: itens.length ? "Escolha quem prefere no agendamento." : "O agendamento não destina profissional.",
        itens: itens.length
          ? itens
          : [
              {
                id: "pro_sempref",
                nome: "Sem preferência",
                cargo: "",
                descricao: "O horário não destina um profissional.",
                whatsapp: "",
                foto: { id: "img_pro_sempref", src: "", alt: "Sem preferência", categoria: "profissional" },
              },
            ],
      };
    }

    if (Array.isArray(body.avisos)) {
      site.eventos = {
        titulo: "Avisos",
        itens: body.avisos
          .map((raw, i) => {
            const a = raw as { titulo?: string; descricao?: string; dataLabel?: string; horario?: string };
            const titulo = String(a.titulo || "").trim().slice(0, 80);
            if (!titulo) return null;
            return {
              id: `evt_${i + 1}`,
              titulo,
              descricao: String(a.descricao || "").slice(0, 400),
              data: "",
              data_label: String(a.dataLabel || "").slice(0, 40),
              horario: String(a.horario || "09:00").slice(0, 5),
            };
          })
          .filter(Boolean)
          .slice(0, 4),
      };
    }

    if (Array.isArray(body.servicos)) {
      const atuais = Array.isArray((site.servicos as { itens?: unknown[] } | undefined)?.itens)
        ? ([...((site.servicos as { itens: Record<string, unknown>[] }).itens)] as Record<string, unknown>[])
        : [];
      site.servicos = {
        titulo: String((site.servicos as { titulo?: string } | undefined)?.titulo || "Serviços"),
        subtitulo: String((site.servicos as { subtitulo?: string } | undefined)?.subtitulo || ""),
        itens: body.servicos
          .map((raw, i) => {
            const s = raw as { nome?: string; preco?: string; duracao?: string; descricao?: string };
            const nome = String(s.nome || "").trim().slice(0, 80);
            if (!nome) return null;
            const dur = String(s.duracao || `${passo} min`).slice(0, 32);
            const mins = minutosDeRotulo(dur) || passo;
            const base = { ...(atuais[i] || {}) };
            return {
              ...base,
              id: String(base.id || `srv_${i + 1}`),
              nome,
              descricao: String(s.descricao || "").slice(0, 400),
              preco_label: String(s.preco || "").slice(0, 40),
              duracao_label: dur,
              duracao_minutos: mins,
            };
          })
          .filter(Boolean)
          .slice(0, 24),
      };
    }

    if (body.faq && typeof body.faq === "object") {
      const faq = body.faq as { titulo?: string; itens?: Array<{ pergunta?: string; resposta?: string }> };
      site.faq = {
        titulo: String(faq.titulo || "Dúvidas").slice(0, 80),
        itens: (faq.itens || [])
          .map((item, i) => {
            const pergunta = String(item.pergunta || "").trim().slice(0, 160);
            const resposta = String(item.resposta || "").trim().slice(0, 800);
            if (!pergunta || !resposta) return null;
            return { id: `faq_${i + 1}`, pergunta, resposta };
          })
          .filter(Boolean)
          .slice(0, 10),
      };
    }

    if (typeof body.comoEncontrar === "string") {
      const contato = { ...((site.contato as Record<string, unknown>) || {}) };
      contato.texto = String(body.comoEncontrar).slice(0, 400);
      site.contato = contato;
    }

    const visualBase = { ...visualPadrao(pacote.nicho), ...(pacote.visual || {}) };
    let agendaEquipe = visualBase.agendaEquipe || [];
    if (Array.isArray(body.agendaEquipe)) {
      agendaEquipe = body.agendaEquipe
        .map((raw) => {
          const a = raw as {
            nome?: string;
            dias?: Array<string | { dia?: string; inicio?: string; fim?: string; pausa?: boolean; pausaInicio?: string; pausaFim?: string }>;
            ausencias?: Array<{ de?: string; ate?: string; motivo?: string }>;
          };
          const nome = String(a.nome || "").trim().slice(0, 80);
          if (!nome) return null;
          const dias = (a.dias || [])
            .map((item) => {
              if (typeof item === "string") {
                if (!["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(item)) return null;
                return { dia: item, inicio: "09:00", fim: "18:00" };
              }
              const dia = String(item?.dia || "");
              if (!["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(dia)) return null;
              return {
                dia,
                inicio: String(item.inicio || "09:00").slice(0, 5),
                fim: String(item.fim || "18:00").slice(0, 5),
                pausa: Boolean(item.pausa),
                pausaInicio: String(item.pausaInicio || "12:00").slice(0, 5),
                pausaFim: String(item.pausaFim || "13:00").slice(0, 5),
              };
            })
            .filter(Boolean)
            .slice(0, 7);
          const ausencias = (a.ausencias || [])
            .map((u) => ({
              de: String(u.de || "").slice(0, 10),
              ate: String(u.ate || u.de || "").slice(0, 10),
              motivo: String(u.motivo || "Ausente").slice(0, 80),
            }))
            .filter((u) => /^\d{4}-\d{2}-\d{2}$/.test(u.de))
            .slice(0, 24);
          return { nome, dias, ausencias };
        })
        .filter(Boolean)
        .slice(0, 24) as NonNullable<VisualConfig["agendaEquipe"]>;
    }
    const visual: VisualConfig = { ...visualBase, agendaEquipe, duracaoSlotMinutos: passo };
    await gravarPacote({ ...pacote, site, visual });
    return NextResponse.json({ ok: true, token, site, visual, expiraEm: pacote.expiraEm });
  }

  const campo = String(body.campo || "");
  const valorCampo = String(body.valor || "");
  if (campo && valorCampo && body.nome == null && !body.visual && !body.fotoSrc) {
    const site = aplicarCampoNoSite(structuredClone(pacote.site), campo, valorCampo);
    let visual = pacote.visual;
    const redeCampo = campo.match(/^rede\.([a-z]+)\.label$/);
    if (redeCampo) {
      const id = redeCampo[1];
      visual = {
        ...(visual || visualPadrao(pacote.nicho)),
        rotulosRede: { ...(visual?.rotulosRede || {}), [id]: valorCampo.slice(0, 32) },
      };
    }
    await gravarPacote({ ...pacote, site, visual });
    return NextResponse.json({ ok: true, token, site, visual, expiraEm: pacote.expiraEm });
  }

  const fotoSrc = sanitizarFotoSrc(body.fotoSrc);
  const slot = body.slot as { tipo?: "hero" | "sobre" | "galeria" | "servico"; indice?: number } | undefined;
  const creditoFoto =
    body.credito && typeof body.credito === "object" ? (body.credito as Record<string, unknown>) : undefined;
  const soFoto = Boolean(fotoSrc && slot?.tipo && body.nome == null && body.cidade == null && body.whatsapp == null && body.slogan == null && !body.visual && !body.logoSrc);

  if (soFoto && fotoSrc && slot?.tipo) {
    const site = aplicarSrcNoSlot({ ...pacote.site }, { tipo: slot.tipo, indice: slot.indice }, fotoSrc, creditoFoto);
    const atualizado = { ...pacote, site };
    await gravarPacote(atualizado);
    return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
  }

  const empresaAtual = (pacote.site.empresa || {}) as {
    nome?: string;
    slogan?: string;
    whatsapp?: string;
    email?: string;
    endereco?: { cidade?: string; bairro?: string; logradouro?: string; numero?: string; estado?: string; cep?: string };
  };
  const nome = String(body.nome ?? empresaAtual.nome ?? pacote.nome).trim() || pacote.nome;
  const cidade =
    body.cidade !== undefined
      ? String(body.cidade || "").trim() || undefined
      : empresaAtual.endereco?.cidade || pacote.cidade;
  const whatsappBruto =
    body.whatsapp !== undefined ? String(body.whatsapp || "").trim() : empresaAtual.whatsapp || pacote.whatsapp || "";
  const whatsappDigitos = whatsappBruto.replace(/\D/g, "");
  const whatsapp = whatsappDigitos && !/^(55)?79999990000$/.test(whatsappDigitos) ? whatsappBruto : undefined;
  const slogan =
    body.slogan !== undefined
      ? String(body.slogan || "").trim() || undefined
      : empresaAtual.slogan || pacote.slogan;
  const visual: VisualConfig = {
    ...visualPadrao(pacote.nicho),
    ...(pacote.visual || {}),
    ...sanitizarVisual(body.visual && typeof body.visual === "object" ? (body.visual as VisualConfig) : {}),
  };
  const end = empresaAtual.endereco || {};

  const site = aplicarEstudio(pacote.site, {
    entrada: {
      clienteId: `t${token}`,
      nicho: pacote.nicho as Nicho,
      nome,
      cidade,
      whatsapp,
      slogan,
      email: empresaAtual.email,
      bairro: end.bairro,
      logradouro: end.logradouro,
      numero: end.numero,
      estado: end.estado && String(end.estado).toUpperCase() !== "NA" ? end.estado : undefined,
      cep: end.cep,
    },
    visual,
    logoSrc: sanitizarLogoSrc(body.logoSrc),
    aplicarServicos: false,
    aplicarProfissionais: false,
    preservarModeloQuandoVazio: true,
  });
  if (fotoSrc && slot?.tipo) {
    aplicarSrcNoSlot(site, { tipo: slot.tipo, indice: slot.indice }, fotoSrc, creditoFoto);
  }

  const atualizado = {
    ...pacote,
    nome,
    cidade,
    whatsapp: whatsapp || pacote.whatsapp,
    slogan,
    visual,
    site,
  };
  await gravarPacote(atualizado);
  return NextResponse.json({ ok: true, token, site, expiraEm: pacote.expiraEm });
}
