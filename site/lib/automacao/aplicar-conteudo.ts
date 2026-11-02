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
  if (opts.credito) next.credito = opts.credito;
  else if (opts.origem && opts.origem !== "unsplash") delete next.credito;
  return next;
}

function imagemClientePorCategoria(entrada: EntradaAutomacao, categoria: string) {
  return entrada.imagensCliente?.find((i) => i.categoria === categoria);
}

function imagemResolvidaPorCategoria(resolvidas: ImagemResolvida[], categoria: string) {
  return resolvidas.find((i) => i.categoria === categoria && i.src);
}

/** Aplica textos da IA e imagens (cliente tem prioridade; senão biblioteca). */
export function aplicarConteudoGerado(
  site: Record<string, unknown>,
  textos: GeracaoSiteJson,
  resolvidas: ImagemResolvida[],
  entrada: EntradaAutomacao,
) {
  const avisos: string[] = [];

  if (textos.hero) {
    const hero = { ...(site.hero as Record<string, unknown>) };
    if (textos.hero.titulo) hero.titulo = textos.hero.titulo;
    if (textos.hero.subtitulo) hero.subtitulo = textos.hero.subtitulo;

    const doCliente = imagemClientePorCategoria(entrada, "hero");
    const daLib = imagemResolvidaPorCategoria(resolvidas, "hero");
    if (doCliente) {
      hero.imagem = patchImagem(hero.imagem as Record<string, unknown>, {
        src: doCliente.src,
        alt: doCliente.alt,
        origem: doCliente.origem,
        credito: doCliente.credito as unknown as Record<string, unknown> | undefined,
      });
    } else if (daLib?.src) {
      hero.imagem = patchImagem(hero.imagem as Record<string, unknown>, {
        src: daLib.src,
        origem: "biblioteca",
      });
    } else {
      avisos.push("hero sem imagem da biblioteca — mantida do exemplo");
    }
    site.hero = hero;
  }

  if (textos.sobre) {
    const sobre = { ...(site.sobre as Record<string, unknown>) };
    if (textos.sobre.titulo) sobre.titulo = textos.sobre.titulo;
    if (textos.sobre.paragrafos?.length) sobre.paragrafos = textos.sobre.paragrafos;

    const doCliente = imagemClientePorCategoria(entrada, "sobre");
    const daLib = imagemResolvidaPorCategoria(resolvidas, "sobre");
    if (doCliente) {
      sobre.imagem = patchImagem(sobre.imagem as Record<string, unknown>, {
        src: doCliente.src,
        alt: doCliente.alt,
        origem: doCliente.origem,
        credito: doCliente.credito as unknown as Record<string, unknown> | undefined,
      });
    } else if (daLib?.src) {
      sobre.imagem = patchImagem(sobre.imagem as Record<string, unknown>, {
        src: daLib.src,
        origem: "biblioteca",
      });
    }
    site.sobre = sobre;
  }

  if (textos.servicos) {
    const servicos = { ...(site.servicos as Record<string, unknown>) };
    if (textos.servicos.titulo) servicos.titulo = textos.servicos.titulo;
    if (textos.servicos.subtitulo) servicos.subtitulo = textos.servicos.subtitulo;

    const itens = Array.isArray(servicos.itens) ? [...(servicos.itens as Record<string, unknown>[])] : [];
    const sugestoes = textos.servicos.sugestoes || [];
    for (let i = 0; i < Math.min(itens.length, sugestoes.length); i++) {
      itens[i] = { ...itens[i], nome: sugestoes[i] };
    }

    const doCliente = imagemClientePorCategoria(entrada, "servico");
    const daLib = imagemResolvidaPorCategoria(resolvidas, "servico");
    if (itens[0] && (doCliente || daLib?.src)) {
      const img = itens[0].imagem as Record<string, unknown>;
      itens[0] = {
        ...itens[0],
        imagem: doCliente
          ? patchImagem(img, {
              src: doCliente.src,
              alt: doCliente.alt,
              origem: doCliente.origem,
              credito: doCliente.credito as unknown as Record<string, unknown> | undefined,
            })
          : patchImagem(img, { src: daLib!.src, origem: "biblioteca" }),
      };
    }
    servicos.itens = itens;
    site.servicos = servicos;
  }

  // SEO og a partir do hero se biblioteca resolveu
  const seo = { ...(site.seo as Record<string, unknown>) };
  const heroImg = (site.hero as Record<string, unknown>)?.imagem as Record<string, unknown> | undefined;
  if (heroImg?.src && seo.og_image) {
    seo.og_image = patchImagem(seo.og_image as Record<string, unknown>, {
      src: String(heroImg.src),
      origem: String(heroImg.origem || "biblioteca"),
      credito: heroImg.credito as Record<string, unknown> | undefined,
    });
  }
  if (textos.hero?.titulo) {
    seo.description = textos.hero.subtitulo || seo.description;
    seo.og_description = textos.hero.subtitulo || seo.og_description;
  }
  site.seo = seo;

  return { site, avisos };
}
