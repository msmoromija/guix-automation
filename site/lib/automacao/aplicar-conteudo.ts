import { precoDeRotulo } from "@/lib/estudio/aplicar";
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

function imagensDaCategoria(resolvidas: ImagemResolvida[], categoria: string) {
  return resolvidas.filter((i) => i.categoria === categoria && i.src);
}

function imagemResolvidaPorCategoria(resolvidas: ImagemResolvida[], categoria: string, indice = 0) {
  return imagensDaCategoria(resolvidas, categoria)[indice];
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
    if (textos.sobre.paragrafos?.length) {
      sobre.paragrafos = textos.sobre.paragrafos.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 3);
    }
    sobre.imagem = aplicarFoto(sobre.imagem as Record<string, unknown>, "sobre", entrada, resolvidas);
    site.sobre = sobre;
  }

  if (textos.servicos) {
    const servicos = { ...(site.servicos as Record<string, unknown>) };
    if (textos.servicos.titulo) servicos.titulo = textos.servicos.titulo;
    if (textos.servicos.subtitulo) servicos.subtitulo = textos.servicos.subtitulo;

    const itens = Array.isArray(servicos.itens) ? [...(servicos.itens as Record<string, unknown>[])] : [];
    const detalhe = entrada.servicosDetalhe || [];
    const nomes = detalhe.length
      ? detalhe.map((i) => i.nome)
      : (textos.servicos.itens || []).map((i) => i.nome).filter(Boolean);
    const fallbackNomes = textos.servicos.sugestoes || [];
    const lista = nomes.length ? nomes : fallbackNomes;
    const fotos = imagensDaCategoria(resolvidas, "servico");
    const n = detalhe.length || Math.min(itens.length, lista.length || itens.length);
    const novos = [];
    for (let i = 0; i < n; i++) {
      const extra = textos.servicos.itens?.[i];
      const doCliente = detalhe[i];
      const base = itens[i] || {};
      const foto = fotos[i] || fotos[0];
      const imgAtual = base.imagem as Record<string, unknown> | undefined;
      const precoLabel = doCliente?.preco?.trim() || "Sob consulta";
      const duracaoLabel = doCliente?.duracao?.trim() || "30 min";
      novos.push({
        ...base,
        id: String(base.id || `srv_${i + 1}`),
        nome: lista[i] || base.nome,
        descricao: doCliente?.descricao || extra?.descricao || "",
        preco: doCliente?.preco?.trim() ? precoDeRotulo(doCliente.preco) ?? 0 : 0,
        preco_label: precoLabel,
        duracao_label: duracaoLabel,
        imagem:
          foto?.src && (fotos.length > 1 || i === 0)
            ? patchImagem(imgAtual, {
                src: foto.src,
                origem: foto.origem === "unsplash" ? "unsplash" : "biblioteca",
                credito: foto.credito as unknown as Record<string, unknown> | undefined,
              })
            : imgAtual,
      });
    }
    servicos.itens = novos;
    site.servicos = servicos;
  }

  if (entrada.profissionaisDetalhe?.length) {
    const bloco = { ...(site.profissionais as Record<string, unknown>) };
    if (textos.profissionais?.titulo) bloco.titulo = textos.profissionais.titulo;
    if (textos.profissionais?.subtitulo) bloco.subtitulo = textos.profissionais.subtitulo;
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    bloco.itens = entrada.profissionaisDetalhe.map((p, i) => {
      const base = itens[i] || {};
      const fotoAtual = { ...((base.foto as Record<string, unknown>) || {}) };
      if (typeof fotoAtual.src !== "string") fotoAtual.src = "";
      if (!fotoAtual.id) fotoAtual.id = `img_pro_p${i + 1}`;
      if (!fotoAtual.alt) fotoAtual.alt = p.nome;
      if (!fotoAtual.categoria) fotoAtual.categoria = "profissional";
      return {
        ...base,
        id: String(base.id || `pro_p${i + 1}`),
        nome: p.nome,
        cargo: p.cargo || "",
        descricao: p.descricao || "",
        whatsapp: "",
        foto: fotoAtual,
      };
    });
    site.profissionais = bloco;
  }

  if (textos.faq?.itens?.length) {
    const faq = { ...(site.faq as Record<string, unknown>) };
    if (textos.faq.titulo) faq.titulo = textos.faq.titulo;
    const atuais = Array.isArray(faq.itens) ? [...(faq.itens as Record<string, unknown>[])] : [];
    faq.itens = textos.faq.itens
      .filter((f) => String(f.pergunta || "").trim() && String(f.resposta || "").trim())
      .slice(0, 10)
      .map((f, i) => ({
        id: String(atuais[i]?.id || `faq_${String(i + 1).padStart(2, "0")}`),
        pergunta: String(f.pergunta).trim().slice(0, 180),
        resposta: String(f.resposta).trim().slice(0, 400),
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
    const fotos = imagensDaCategoria(resolvidas, "galeria");
    for (let i = 0; i < itens.length; i++) {
      const cap = textos.galeria.legendas?.[i];
      const foto = fotos[i];
      const imgAtual = (itens[i] as { imagem?: Record<string, unknown> }).imagem;
      itens[i] = {
        ...itens[i],
        ...(cap ? { legenda: cap } : {}),
        imagem: foto?.src
          ? patchImagem(imgAtual, {
              src: foto.src,
              origem: foto.origem === "unsplash" ? "unsplash" : "biblioteca",
              credito: foto.credito as unknown as Record<string, unknown> | undefined,
            })
          : imgAtual,
      };
    }
    galeria.itens = itens;
    site.galeria = galeria;
  }

  // Eventos e promoções recebem fotos rotacionadas (mesma prioridade de galeria).
  for (const [chave, categoria] of [
    ["eventos", "evento"],
    ["promocoes", "promocao"],
  ] as const) {
    const bloco = { ...((site[chave] as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const fotos = imagensDaCategoria(resolvidas, categoria);
    for (let i = 0; i < itens.length; i++) {
      const foto = fotos[i];
      if (!foto?.src) continue;
      const imgAtual = (itens[i] as { imagem?: Record<string, unknown> }).imagem;
      itens[i] = {
        ...itens[i],
        imagem: patchImagem(imgAtual, {
          src: foto.src,
          origem: foto.origem === "unsplash" ? "unsplash" : "biblioteca",
          credito: foto.credito as unknown as Record<string, unknown> | undefined,
        }),
      };
    }
    bloco.itens = itens;
    site[chave] = bloco;
  }

  // Equipe: aplica o retrato rotacionado quando o cliente não enviou a própria foto.
  if (!imagemClientePorCategoria(entrada, "profissional")) {
    const bloco = { ...((site.profissionais as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const fotos = imagensDaCategoria(resolvidas, "profissional");
    for (let i = 0; i < itens.length; i++) {
      const foto = fotos[i];
      if (!foto?.src) continue;
      const base = { ...((itens[i].foto as Record<string, unknown>) || {}) };
      if (base.origem === "upload") continue;
      const nome = String(itens[i].nome || "");
      itens[i] = {
        ...itens[i],
        foto: patchImagem(
          { id: `img_pro_p${i + 1}`, alt: nome, categoria: "profissional", ...base },
          {
            src: foto.src,
            alt: nome || String(base.alt || ""),
            origem: foto.origem === "unsplash" ? "unsplash" : "biblioteca",
            credito: foto.credito as Record<string, unknown> | undefined,
          },
        ),
      };
    }
    bloco.itens = itens;
    site.profissionais = bloco;
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
  // Não copia o subtítulo do hero para o slogan — evita frase duplicada na capa.
  site.empresa = empresa;

  return { site, avisos };
}
