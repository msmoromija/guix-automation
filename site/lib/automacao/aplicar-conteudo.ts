import type { GeracaoSiteJson } from "@/lib/media/tipos";
import type { ImagemResolvida } from "@/lib/media/resolver-imagens";
import type { EntradaAutomacao } from "./tipos";

function patchImagem(
  img: Record<string, unknown> | undefined,
  opts: {
    src?: string;
    alt?: string;
    origem?: string;
    credito?: Record<string, unknown>;
  },
) {
  if (!img || typeof img !== "object") return img;
  const next = { ...img };
  if (opts.src) next.src = opts.src;
  if (opts.alt) next.alt = opts.alt;
  if (opts.origem) next.origem = opts.origem;
  if (opts.origem === "unsplash" && opts.credito) next.credito = opts.credito;
  else if (opts.origem && opts.origem !== "unsplash") delete next.credito;
  return next;
}

function imagemClientePorCategoria(entrada: EntradaAutomacao, categoria: string) {
  return entrada.imagensCliente?.find((i) => i.categoria === categoria);
}

function imagemResolvidaPorCategoria(resolvidas: ImagemResolvida[], categoria: string) {
  return resolvidas.find((i) => i.categoria === categoria && i.src);
}

function aplicarFoto(
  img: Record<string, unknown> | undefined,
  categoria: string,
  entrada: EntradaAutomacao,
  resolvidas: ImagemResolvida[],
) {
  const doCliente = imagemClientePorCategoria(entrada, categoria);
  const daLib = imagemResolvidaPorCategoria(resolvidas, categoria);
  if (doCliente) {
    return patchImagem(img, {
      src: doCliente.src,
      alt: doCliente.alt,
      origem: doCliente.origem,
      credito: doCliente.credito as unknown as Record<string, unknown> | undefined,
    });
  }
  if (daLib?.src) {
    return patchImagem(img, {
      src: daLib.src,
      origem: daLib.origem === "unsplash" ? "unsplash" : "biblioteca",
      credito: daLib.credito as unknown as Record<string, unknown> | undefined,
    });
  }
  return img;
}

/** Aplica textos da IA e imagens (cliente tem prioridade; senão biblioteca). */
export function aplicarConteudoGerado(
  site: Record<string, unknown>,
  textos: GeracaoSiteJson,
  resolvidas: ImagemResolvida[],
  entrada: EntradaAutomacao,
) {
  const avisos: string[] = [];
  const cidade = entrada.cidade || "";

  if (textos.hero) {
    const hero = { ...(site.hero as Record<string, unknown>) };
    if (textos.hero.titulo) hero.titulo = textos.hero.titulo;
    if (textos.hero.subtitulo) hero.subtitulo = textos.hero.subtitulo;
    const antes = (hero.imagem as Record<string, unknown>)?.src;
    hero.imagem = aplicarFoto(hero.imagem as Record<string, unknown>, "hero", entrada, resolvidas);
    if (antes && antes === (hero.imagem as Record<string, unknown>)?.src) {
      if (!imagemClientePorCategoria(entrada, "hero") && !imagemResolvidaPorCategoria(resolvidas, "hero")) {
        avisos.push("hero sem imagem da biblioteca — mantida do exemplo");
      }
    }
    site.hero = hero;
  }

  if (textos.sobre) {
    const sobre = { ...(site.sobre as Record<string, unknown>) };
    if (textos.sobre.titulo) sobre.titulo = textos.sobre.titulo;
    if (textos.sobre.paragrafos?.length) sobre.paragrafos = textos.sobre.paragrafos;
    sobre.imagem = aplicarFoto(sobre.imagem as Record<string, unknown>, "sobre", entrada, resolvidas);
    site.sobre = sobre;
  }

  if (textos.servicos) {
    const servicos = { ...(site.servicos as Record<string, unknown>) };
    if (textos.servicos.titulo) servicos.titulo = textos.servicos.titulo;
    if (textos.servicos.subtitulo) servicos.subtitulo = textos.servicos.subtitulo;

    const itens = Array.isArray(servicos.itens) ? [...(servicos.itens as Record<string, unknown>[])] : [];
    const nomes = (textos.servicos.itens || []).map((i) => i.nome).filter(Boolean);
    const fallbackNomes = textos.servicos.sugestoes || [];
    const lista = nomes.length ? nomes : fallbackNomes;
    for (let i = 0; i < Math.min(itens.length, lista.length); i++) {
      const extra = textos.servicos.itens?.[i];
      itens[i] = {
        ...itens[i],
        nome: lista[i],
        ...(extra?.descricao ? { descricao: extra.descricao } : {}),
      };
    }

    const fotoServico = imagemClientePorCategoria(entrada, "servico") || imagemResolvidaPorCategoria(resolvidas, "servico");
    if (fotoServico) {
      for (let i = 0; i < itens.length; i++) {
        itens[i] = {
          ...itens[i],
          imagem: aplicarFoto(itens[i].imagem as Record<string, unknown>, "servico", entrada, resolvidas),
        };
      }
    }
    servicos.itens = itens;
    site.servicos = servicos;
  }

  if (textos.profissionais?.itens?.length) {
    const bloco = { ...(site.profissionais as Record<string, unknown>) };
    if (textos.profissionais.titulo) bloco.titulo = textos.profissionais.titulo;
    if (textos.profissionais.subtitulo) bloco.subtitulo = textos.profissionais.subtitulo;
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    for (let i = 0; i < Math.min(itens.length, textos.profissionais.itens.length); i++) {
      const p = textos.profissionais.itens[i];
      itens[i] = {
        ...itens[i],
        nome: p.nome,
        ...(p.cargo ? { cargo: p.cargo } : {}),
        ...(p.descricao ? { descricao: p.descricao } : {}),
        foto: aplicarFoto(itens[i].foto as Record<string, unknown>, "profissional", entrada, resolvidas),
      };
    }
    bloco.itens = itens;
    site.profissionais = bloco;
  }

  if (textos.faq?.itens?.length) {
    const faq = { ...(site.faq as Record<string, unknown>) };
    if (textos.faq.titulo) faq.titulo = textos.faq.titulo;
    const atuais = Array.isArray(faq.itens) ? [...(faq.itens as Record<string, unknown>[])] : [];
    faq.itens = textos.faq.itens.map((f, i) => ({
      id: String(atuais[i]?.id || `faq_${String(i + 1).padStart(2, "0")}`),
      pergunta: f.pergunta,
      resposta: f.resposta,
    }));
    site.faq = faq;
  }

  if (textos.contato) {
    const contato = { ...(site.contato as Record<string, unknown>) };
    if (textos.contato.titulo) contato.titulo = textos.contato.titulo;
    if (textos.contato.subtitulo) contato.subtitulo = textos.contato.subtitulo;
    site.contato = contato;
  }

  if (textos.galeria) {
    const galeria = { ...(site.galeria as Record<string, unknown>) };
    if (textos.galeria.titulo) galeria.titulo = textos.galeria.titulo;
    const itens = Array.isArray(galeria.itens) ? [...(galeria.itens as Record<string, unknown>[])] : [];
    const foto = aplicarFoto(
      (itens[0] as { imagem?: Record<string, unknown> } | undefined)?.imagem,
      "galeria",
      entrada,
      resolvidas,
    );
    for (let i = 0; i < itens.length; i++) {
      const cap = textos.galeria.legendas?.[i];
      itens[i] = {
        ...itens[i],
        ...(cap ? { legenda: cap } : {}),
        imagem: foto || (itens[i] as { imagem?: Record<string, unknown> }).imagem,
      };
    }
    galeria.itens = itens;
    site.galeria = galeria;
  }

  if (textos.rodape?.texto) {
    const rodape = { ...(site.rodape as Record<string, unknown>) };
    rodape.texto = textos.rodape.texto;
    site.rodape = rodape;
  }

  const seo = { ...(site.seo as Record<string, unknown>) };
  const heroImg = (site.hero as Record<string, unknown>)?.imagem as Record<string, unknown> | undefined;
  if (heroImg?.src && seo.og_image) {
    seo.og_image = patchImagem(seo.og_image as Record<string, unknown>, {
      src: String(heroImg.src),
      origem: String(heroImg.origem || "biblioteca"),
      credito: heroImg.credito as Record<string, unknown> | undefined,
    });
  }
  if (textos.seo?.title) {
    seo.title = textos.seo.title;
    seo.og_title = textos.seo.title;
  } else if (entrada.nome) {
    seo.title = cidade ? `${entrada.nome} | ${cidade}` : entrada.nome;
    seo.og_title = seo.title;
  }
  if (textos.seo?.description) {
    seo.description = textos.seo.description;
    seo.og_description = textos.seo.description;
  } else if (textos.sobre?.paragrafos?.[0]) {
    seo.description = textos.sobre.paragrafos[0];
    seo.og_description = textos.sobre.paragrafos[0];
  }
  if (textos.seo?.keywords?.length) seo.keywords = textos.seo.keywords;
  site.seo = seo;

  const empresa = { ...(site.empresa as Record<string, unknown>) };
  if (empresa.logo) {
    empresa.logo = aplicarFoto(empresa.logo as Record<string, unknown>, "logo", entrada, resolvidas);
  }
  site.empresa = empresa;

  return { site, avisos };
}
