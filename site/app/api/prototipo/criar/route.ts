import { NextRequest, NextResponse } from "next/server";
import { gerarSiteCliente } from "@/lib/automacao/gerar-site";
import { aplicarEstudio, sanitizarFotoSrc, sanitizarLogoSrc } from "@/lib/estudio/aplicar";
import { copiaParaGeracao, normalizarCopia } from "@/lib/estudio/copia-viva";
import { repararParaSchema } from "@/lib/automacao/limpar-exemplo";
import { validarSiteJson } from "@/lib/automacao/validar-site";
import { aplicarCampoNoSite } from "@/lib/estudio/copia-viva";
import { LIMITE_PEDIDOS_IA } from "@/lib/estudio/pedido-fechado";
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
    const fotosIn = body.fotos && typeof body.fotos === "object" ? body.fotos : {};
    const fotos = {
      hero: sanitizarFotoSrc(fotosIn.hero),
      sobre: sanitizarFotoSrc(fotosIn.sobre),
      galeria: Array.isArray(fotosIn.galeria)
        ? (fotosIn.galeria as unknown[]).map(sanitizarFotoSrc).filter((s): s is string => Boolean(s))
        : undefined,
    };
    const servicosRaw = Array.isArray(body.servicos) ? body.servicos : [];
    const profissionaisRaw = Array.isArray(body.profissionais) ? body.profissionais : [];
    const servicos = servicosRaw
      .map((s: { nome?: string; descricao?: string; preco?: string; duracao?: string; imagemSrc?: string }) => ({
        nome: String(s.nome || "").trim(),
        descricao: String(s.descricao || "").trim(),
        preco: String(s.preco || "").trim(),
        duracao: String(s.duracao || "").trim(),
        imagemSrc: sanitizarFotoSrc(s.imagemSrc),
      }))
      .filter((s: { nome: string }) => s.nome && s.nome !== "Novo serviço")
      .slice(0, 12);
    const profissionais = profissionaisRaw
      .map((p: { nome?: string; cargo?: string; descricao?: string; fotoSrc?: string }) => ({
        nome: String(p.nome || "").trim(),
        cargo: String(p.cargo || "").trim(),
        descricao: String(p.descricao || "").trim(),
        fotoSrc: sanitizarFotoSrc(p.fotoSrc) || "",
      }))
      .filter((p: { nome: string }) => p.nome && p.nome !== "Novo nome")
      .slice(0, 8);
    const tom = String(body.tom || tomDoEstilo(visual.estilo)).trim();
    const destaque = String(body.destaque || "").trim() || undefined;
    const iaEscreve = body.iaEscreve !== false;
    const copia = body.copia && typeof body.copia === "object" ? normalizarCopia(body.copia) : null;
    const textosProntos = copia?.hero?.titulo ? copiaParaGeracao(copia, servicos) : undefined;

    if (!nome || nome.length < 2) {
      return NextResponse.json({ erro: "informe o nome do negócio" }, { status: 400 });
    }
    if (!NICHOS_OK.has(nicho)) {
      return NextResponse.json({ erro: "nicho inválido" }, { status: 400 });
    }

    const imagensCliente = [
      ...(fotos.hero ? [{ categoria: "hero", src: fotos.hero, origem: "upload" as const }] : []),
      ...(fotos.sobre ? [{ categoria: "sobre", src: fotos.sobre, origem: "upload" as const }] : []),
      ...(fotos.galeria || []).map((src, i) => ({ categoria: "galeria", src, origem: "upload" as const, alt: `Galeria ${i + 1}` })),
    ];

    const token = sanitizarToken(novoToken());
    const horarioCliente = String(body.horario || "").replace(/\s+/g, " ").trim().slice(0, 160);
    const enderecoLivre = String(body.enderecoLivre || body.enderecoCompleto || "").replace(/\s+/g, " ").trim().slice(0, 180);
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
      horario: horarioCliente || undefined,
      iaEscreve,
      textosProntos,
      imagensCliente,
      servicos: servicos.map((s: { nome: string }) => s.nome),
      servicosDetalhe: servicos.map((s: { nome: string; descricao: string; preco: string; duracao: string }) => ({
        nome: s.nome,
        descricao: s.descricao || undefined,
        preco: s.preco || undefined,
        duracao: s.duracao || undefined,
      })),
      profissionaisDetalhe: profissionais.map((p: { nome: string; cargo: string; descricao: string }) => ({
        nome: p.nome,
        cargo: p.cargo || undefined,
        descricao: p.descricao || undefined,
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
      aplicarServicos: servicos.length > 0,
      aplicarProfissionais: profissionais.length > 0,
      preservarModeloQuandoVazio: true,
      fotos,
      bairroModelo: gerado.modelo?.bairro,
      cidadeModelo: gerado.modelo?.cidade,
    });
    const empresaHorario = { ...((gerado.site.empresa as Record<string, unknown>) || {}) };
    empresaHorario.horario_resumo = horarioCliente || "Horário a combinar";
    empresaHorario.cnpj = "";
    if (!instagram && !facebook && !tiktok && !youtube && !linkedin) empresaHorario.redes = [];
    const end = { ...((empresaHorario.endereco as Record<string, unknown>) || {}) };
    if (!logradouro && !numero && !bairro && !cidade && !cep && !enderecoLivre) {
      end.logradouro = "";
      end.numero = "";
      end.bairro = "";
      end.cidade = "";
      end.completo = "";
      if (String(end.estado || "").toUpperCase() === "NA") end.estado = "";
    } else if (enderecoLivre) {
      end.completo = enderecoLivre;
    }
    if (String(end.estado || "").toUpperCase() === "NA") end.estado = estado || "";
    empresaHorario.endereco = end;
    gerado.site.empresa = empresaHorario;

    const faqsBody = body.faqs as { titulo?: string; itens?: { pergunta?: string; resposta?: string }[] } | null;
    if (faqsBody && typeof faqsBody === "object") {
      const faq = { ...((gerado.site.faq as Record<string, unknown>) || {}) };
      faq.titulo = String(faqsBody.titulo || faq.titulo || "Dúvidas").slice(0, 80);
      const itens = (faqsBody.itens || []).filter((item) => item?.pergunta?.trim() && item?.resposta?.trim()).slice(0, 10);
      faq.itens = itens.map((item, i) => ({
        id: `faq_${String(i + 1).padStart(2, "0")}`,
        pergunta: String(item.pergunta).trim().slice(0, 180),
        resposta: String(item.resposta).trim().slice(0, 400),
      }));
      gerado.site.faq = faq;
    }

    const eventosBody = Array.isArray(body.eventos) ? body.eventos : null;
    if (eventosBody) {
      const eventos = { ...((gerado.site.eventos as Record<string, unknown>) || {}) };
      eventos.titulo = eventosBody.length ? String(eventos.titulo || "Agenda") : String(eventos.titulo || "Agenda");
      eventos.itens = eventosBody.slice(0, 4).map((item: { titulo?: string; descricao?: string; dataLabel?: string; horario?: string }, i: number) => ({
        id: `evt_cliente_${i + 1}`,
        titulo: String(item.titulo || "Evento").trim().slice(0, 80) || "Evento",
        descricao: String(item.descricao || "").trim().slice(0, 240),
        data: "2026-12-01",
        data_label: String(item.dataLabel || "A definir").trim().slice(0, 40) || "A definir",
        horario: /^\d{2}:\d{2}$/.test(String(item.horario || "")) ? String(item.horario) : "19:00",
        imagem: { id: `img_evt_cliente_${i + 1}`, src: "", alt: String(item.titulo || "Evento"), categoria: "evento" },
      }));
      gerado.site.eventos = eventos;
    }

    const menuBody = Array.isArray(body.menu) ? body.menu : null;
    const botaoAgendar = String(body.botaoAgendar || "").trim().slice(0, 40);
    if (menuBody?.length || botaoAgendar) {
      const header = { ...((gerado.site.header as Record<string, unknown>) || {}) };
      if (menuBody?.length) {
        header.menu = menuBody.slice(0, 7).map((m: { id?: string; label?: string; href?: string }) => ({
          id: String(m.id || "inicio"),
          label: String(m.label || "").slice(0, 48),
          href: String(m.href || "#inicio"),
        }));
      }
      if (botaoAgendar) header.botao_agendar = botaoAgendar;
      gerado.site.header = header;
    }

    const rodapeTexto = String(body.rodapeTexto || "").trim().slice(0, 160);
    const rodapeLinks = Array.isArray(body.rodapeLinks) ? body.rodapeLinks : null;
    if (rodapeTexto || rodapeLinks) {
      const rodape = { ...((gerado.site.rodape as Record<string, unknown>) || {}) };
      if (rodapeTexto) rodape.texto = rodapeTexto;
      if (rodapeLinks) rodape.links = rodapeLinks;
      gerado.site.rodape = rodape;
    }

    const difs = Array.isArray(body.diferenciais) ? body.diferenciais : null;
    if (difs && difs.length >= 3) {
      const bloco = { ...((gerado.site.diferenciais as Record<string, unknown>) || {}) };
      const atuais = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
      bloco.itens = difs.slice(0, 6).map((item: { titulo?: string; descricao?: string }, i: number) => ({
        ...(atuais[i] || atuais[0] || {}),
        id: String((atuais[i] || {}).id || `dif_extra_${i + 1}`),
        titulo: String(item.titulo || "").slice(0, 60),
        descricao: String(item.descricao || "").slice(0, 180),
        icone: (atuais[i] || atuais[0] || {}).icone || "check",
      }));
      gerado.site.diferenciais = bloco;
    }

    const avulsos = body.avulsos && typeof body.avulsos === "object" ? (body.avulsos as Record<string, string>) : null;
    if (avulsos) {
      for (const [campo, valor] of Object.entries(avulsos)) {
        if (campo && valor) aplicarCampoNoSite(gerado.site, campo, String(valor));
      }
    }

    repararParaSchema(gerado.site, {
      clienteId: `t${token}`,
      nicho,
      nome,
      slogan,
      cidade,
      whatsapp,
      email,
      profissionaisDetalhe: profissionais.map((p: { nome: string; cargo: string; descricao: string }) => ({
        nome: p.nome,
        cargo: p.cargo || undefined,
        descricao: p.descricao || undefined,
      })),
    });

    const validacao = await validarSiteJson(gerado.site);
    if (!validacao.ok) {
      return NextResponse.json(
        { erro: "O site ficou inconsistente na validação. Tente de novo." },
        { status: 500 },
      );
    }

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
      pedidosIa: Math.max(0, Math.min(LIMITE_PEDIDOS_IA, Number(body.pedidosIa) || 0)),
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
    const bruto = e instanceof Error ? e.message : "";
    const erro = /openai|api key/i.test(bruto)
      ? "Não deu para escrever os textos agora. Tente de novo em instantes."
      : /site\.json inválido/i.test(bruto)
        ? "O site ficou inconsistente na validação. Tente de novo."
        : "Não foi possível montar o site de teste.";
    return NextResponse.json({ erro }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ttlHoras: Math.round(PROTOTIPO_TTL_MS / 3600000),
    nota: "Rascunho por token. Nada fica publicado até a contratação.",
  });
}
