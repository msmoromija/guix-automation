import { BUSCA_FOTO, tagsDoNicho } from "./catalogo";
import { listarPrefixo, metadadosObjeto, urlPublica } from "./r2";
import { enquadrarFoto } from "./tratar-url";
import type { CategoriaImagem, CreditoUnsplash, Nicho, UnsplashFoto } from "./tipos";
import { buscarUnsplash, escolherFotoAleatoria, montarCredito, paginaAleatoriaUnsplash } from "./unsplash";
import type { ImagemResolvida } from "./resolver-imagens";

function textoBloqueado(texto: string, bloquear: string[]) {
  const t = texto.toLowerCase();
  return bloquear.some((b) => t.includes(b.toLowerCase()));
}

const recorte: Record<string, { w: number; h: number; faces?: boolean }> = {
  hero: { w: 1600, h: 900 },
  sobre: { w: 1200, h: 900 },
  servico: { w: 1200, h: 800 },
  profissional: { w: 800, h: 800, faces: true },
  galeria: { w: 900, h: 900 },
  evento: { w: 1600, h: 800 },
  promocao: { w: 1600, h: 900 },
};

async function melhorDoR2(nicho: Nicho, categoria: CategoriaImagem, tags: string[], usadas: Set<string>) {
  const prefix = `imagens/${nicho}/${categoria}/`;
  try {
    const itens = await listarPrefixo(prefix, 60);
    if (!itens.length) return { foto: null, quantidade: 0 };
    let candidatos: { id: string; key: string; url: string; score: number }[] = itens
      .filter((item) => !usadas.has(item.key))
      .map((item) => ({ id: item.key, key: item.key, url: item.url || urlPublica(item.key), score: 0 }));
    if (!candidatos.length) return { foto: null, quantidade: itens.length };
    // A pasta (nicho/categoria) já garante o contexto. As tags só entram como
    // desempate quando o chamador pediu termos específicos (ex.: sugestões da IA);
    // assim a biblioteca curada nunca é ignorada por falta de tag.
    if (tags.length) {
      const quer = new Set([...tags, ...tagsDoNicho(nicho)].map((t) => t.toLowerCase()));
      for (const c of candidatos) {
        try {
          const head = await metadadosObjeto(c.key);
          c.score = (head.metadata.tags || "")
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t && quer.has(t)).length;
        } catch {
          /* sem metadado */
        }
      }
      const maiorScore = Math.max(...candidatos.map((item) => item.score));
      candidatos = candidatos.filter((item) => item.score === maiorScore);
    }
    return {
      foto: escolherFotoAleatoria(candidatos, usadas) || null,
      quantidade: itens.length,
    };
  } catch {
    return { foto: null, quantidade: 0 };
  }
}

/**
 * Cache em memória (por instância) dos resultados do Unsplash. Sem isso, cada
 * carga do modelo dispara novas buscas e estoura o limite da chave (403), o que
 * fazia a foto fixa do modelo ser mantida em vez de substituída.
 */
const CACHE_UNSPLASH = new Map<string, { ts: number; fotos: UnsplashFoto[] }>();
const TTL_CACHE = 10 * 60 * 1000;

async function buscarPool(nicho: Nicho, query: string): Promise<UnsplashFoto[]> {
  const chave = `${nicho}:${query}`;
  const agora = Date.now();
  const hit = CACHE_UNSPLASH.get(chave);
  if (hit && agora - hit.ts < TTL_CACHE) return hit.fotos;
  try {
    const pagina = paginaAleatoriaUnsplash();
    const fotos = await buscarUnsplash(query, 12, AbortSignal.timeout(5000), pagina);
    const ok = fotos.length ? fotos : await buscarUnsplash(query, 12, AbortSignal.timeout(5000), 1);
    if (ok.length) CACHE_UNSPLASH.set(chave, { ts: agora, fotos: ok });
    return ok;
  } catch {
    // Limite esgotado: aproveita o cache anterior (mesmo vencido) se houver.
    return hit?.fotos || [];
  }
}

async function proximaUnsplash(nicho: Nicho, categoria: CategoriaImagem, usadas: Set<string>) {
  const cfg = BUSCA_FOTO[nicho] || BUSCA_FOTO.generico;
  const principal = cfg.query[categoria] || cfg.query.galeria || cfg.query.hero;
  // Uma busca pode voltar vazia (ou só com resultados bloqueados). Nesses casos
  // tenta as outras buscas do nicho para nunca deixar o slot sem foto.
  const cadeia = [principal, cfg.query.galeria, cfg.query.hero, cfg.query.sobre].filter(
    (q, i, arr): q is string => Boolean(q) && arr.indexOf(q) === i,
  );
  for (const query of cadeia) {
    const fotos = (await buscarPool(nicho, query)).filter(
      (foto) =>
        !cfg.bloquearIds?.includes(foto.id) &&
        !textoBloqueado(`${foto.descricao} ${foto.fotografo}`, cfg.bloquear),
    );
    const foto = escolherFotoAleatoria(fotos, usadas);
    if (!foto) continue;
    usadas.add(foto.id);
    const box = recorte[categoria] || recorte.hero;
    return {
      src: enquadrarFoto(foto.url_regular, box.w, box.h, box.faces) || foto.url_regular,
      credito: montarCredito(foto),
    };
  }
  return null;
}

export type ReservaFotos = Partial<Record<CategoriaImagem, string[]>>;

/** Imagens reais já presentes no modelo do nicho — reserva quando o Unsplash não responde. */
export function reservaDoModelo(site: Record<string, unknown>): ReservaFotos {
  const lista = (bloco: unknown, campo: string): string[] => {
    const b = bloco as { itens?: unknown } | undefined;
    if (!b || !Array.isArray(b.itens)) return [];
    return (b.itens as Record<string, unknown>[])
      .map((it) => it[campo])
      .filter((o): o is { src: string } => Boolean(o) && typeof (o as { src?: unknown }).src === "string" && Boolean((o as { src: string }).src))
      .map((o) => o.src);
  };
  const unica = (bloco: unknown, campo: string): string[] => {
    const o = (bloco as Record<string, unknown> | undefined)?.[campo];
    return o && typeof (o as { src?: unknown }).src === "string" && (o as { src: string }).src ? [(o as { src: string }).src] : [];
  };
  return {
    hero: unica(site.hero, "imagem"),
    sobre: unica(site.sobre, "imagem"),
    servico: lista(site.servicos, "imagem"),
    galeria: lista(site.galeria, "imagem"),
    profissional: lista(site.profissionais, "foto"),
    promocao: lista(site.promocoes, "imagem"),
    evento: lista(site.eventos, "imagem"),
  };
}

function escolherReserva(
  categoria: CategoriaImagem,
  reserva: ReservaFotos | undefined,
  usadas: Set<string>,
): string | null {
  if (!reserva) return null;
  const geral = Object.values(reserva).flat().filter(Boolean) as string[];
  const propria = reserva[categoria] || [];
  // Categoria com poucas imagens (ex.: 2 eventos) repete demais; nela usa o
  // acervo do nicho inteiro para variar. Retratos só usam a própria pasta.
  const lista = propria.length >= 3 ? propria : geral;
  if (!lista.length) return null;
  const livres = lista.filter((u) => !usadas.has(u));
  const fonte = livres.length ? livres : lista;
  const escolhida = fonte[Math.floor(Math.random() * fonte.length)] || null;
  if (!escolhida) return null;
  const box = recorte[categoria] || recorte.hero;
  return enquadrarFoto(escolhida, box.w, box.h, box.faces) || escolhida;
}

function itensDoBloco(bloco: unknown): Record<string, unknown>[] {
  const itens = (bloco as { itens?: unknown } | undefined)?.itens;
  return Array.isArray(itens) ? (itens as Record<string, unknown>[]) : [];
}

/**
 * Aplica fotos rotativas (biblioteca R2 / Unsplash) nos slots visíveis do modelo,
 * para que a prévia do estúdio não mostre sempre as imagens fixas do JSON.
 * Não altera textos nem dados do cliente — só as `imagem` de capa, sobre, serviços e galeria.
 */
export async function rotacionarFotosDoModelo(
  site: Record<string, unknown>,
  nicho: Nicho,
): Promise<Record<string, unknown>> {
  const itensServ = itensDoBloco(site.servicos);
  const itensGal = itensDoBloco(site.galeria);
  const itensPro = itensDoBloco(site.profissionais);
  const itensPromo = itensDoBloco(site.promocoes);
  const itensEvento = itensDoBloco(site.eventos);
  const sugestoes: Array<{ categoria: CategoriaImagem; tags: string[]; motivo: string }> = [
    { categoria: "hero", tags: [], motivo: "capa" },
    { categoria: "sobre", tags: [], motivo: "sobre" },
  ];
  for (let i = 0; i < itensServ.length; i++) {
    sugestoes.push({ categoria: "servico", tags: [], motivo: `serviço ${i + 1}` });
  }
  for (let i = 0; i < itensGal.length; i++) {
    sugestoes.push({ categoria: "galeria", tags: [], motivo: `galeria ${i + 1}` });
  }
  for (let i = 0; i < itensPro.length; i++) {
    sugestoes.push({ categoria: "profissional", tags: [], motivo: `profissional ${i + 1}` });
  }
  for (let i = 0; i < itensPromo.length; i++) {
    sugestoes.push({ categoria: "promocao", tags: [], motivo: `promoção ${i + 1}` });
  }
  for (let i = 0; i < itensEvento.length; i++) {
    sugestoes.push({ categoria: "evento", tags: [], motivo: `evento ${i + 1}` });
  }

  let resolvidas: ImagemResolvida[];
  try {
    resolvidas = await escolherImagensDoNicho({ nicho, sugestoes, reserva: reservaDoModelo(site) });
  } catch {
    return site;
  }
  const daCategoria = (cat: CategoriaImagem) => resolvidas.filter((r) => r.categoria === cat && r.src);

  const out = JSON.parse(JSON.stringify(site)) as Record<string, unknown>;
  const patch = (img: unknown, r: ImagemResolvida) => {
    const base = img && typeof img === "object" ? { ...(img as Record<string, unknown>) } : {};
    const origem = r.origem === "unsplash" ? "unsplash" : "biblioteca";
    base.src = r.src;
    base.origem = origem;
    if (origem === "unsplash" && r.credito) base.credito = r.credito;
    else delete base.credito;
    return base;
  };
  const trocaUnica = (chave: string, categoria: CategoriaImagem) => {
    const foto = daCategoria(categoria)[0];
    if (!foto?.src) return;
    const bloco = { ...(out[chave] as Record<string, unknown>) };
    bloco.imagem = patch(bloco.imagem, foto);
    out[chave] = bloco;
  };
  const trocaLista = (chave: string, categoria: CategoriaImagem, campo: "imagem" | "foto" = "imagem") => {
    const fotos = daCategoria(categoria);
    if (!fotos.length) return;
    const bloco = { ...(out[chave] as Record<string, unknown>) };
    bloco.itens = itensDoBloco(bloco).map((item, i) => {
      const foto = fotos[i] || fotos[0];
      return foto?.src ? { ...item, [campo]: patch(item[campo], foto) } : item;
    });
    out[chave] = bloco;
  };

  trocaUnica("hero", "hero");
  trocaUnica("sobre", "sobre");
  trocaLista("servicos", "servico");
  trocaLista("galeria", "galeria");
  // Equipe usa `foto` (retrato); promoções e eventos usam `imagem`.
  trocaLista("profissionais", "profissional", "foto");
  trocaLista("promocoes", "promocao");
  trocaLista("eventos", "evento");

  // og_image acompanha a capa para o compartilhamento não ficar com a foto fixa do modelo.
  const heroFoto = daCategoria("hero")[0];
  if (heroFoto?.src && out.seo && typeof out.seo === "object") {
    const seo = { ...(out.seo as Record<string, unknown>) };
    seo.og_image = patch(seo.og_image, heroFoto);
    out.seo = seo;
  }
  return out;
}

/** Biblioteca do nicho com tags; senão Unsplash, uma foto diferente por bloco. */
export async function escolherImagensDoNicho(opts: {
  nicho: Nicho;
  sugestoes: Array<{ categoria: CategoriaImagem; tags: string[]; motivo: string }>;
  reserva?: ReservaFotos;
}): Promise<ImagemResolvida[]> {
  const usadas = new Set<string>();
  const out: ImagemResolvida[] = [];
  for (const s of opts.sugestoes) {
    const catalogo = await melhorDoR2(opts.nicho, s.categoria, s.tags, usadas);
    const r2 = catalogo.foto;
    // Bibliotecas pequenas não devem fixar todos os novos sites na mesma foto.
    const priorizarCatalogo = r2 && catalogo.quantidade > 1;
    if (r2 && priorizarCatalogo) {
      usadas.add(r2.key);
      out.push({
        categoria: s.categoria,
        tags: s.tags,
        motivo: s.motivo,
        src: r2.url,
        r2_key: r2.key,
        origem: "biblioteca",
      });
      continue;
    }
    const un = await proximaUnsplash(opts.nicho, s.categoria, usadas);
    if (un) {
      out.push({
        categoria: s.categoria,
        tags: s.tags,
        motivo: s.motivo,
        src: un.src,
        origem: "unsplash",
        credito: un.credito as CreditoUnsplash,
      });
      continue;
    }
    if (r2) {
      usadas.add(r2.key);
      out.push({
        categoria: s.categoria,
        tags: s.tags,
        motivo: s.motivo,
        src: r2.url,
        r2_key: r2.key,
        origem: "biblioteca",
      });
      continue;
    }
    // Sem biblioteca e sem Unsplash (ex.: limite 403): usa o acervo real do
    // modelo do nicho para o bloco não ficar com a foto fixa de sempre.
    const reserva = escolherReserva(s.categoria, opts.reserva, usadas);
    if (reserva) {
      usadas.add(reserva);
      out.push({ categoria: s.categoria, tags: s.tags, motivo: s.motivo, src: reserva, origem: "biblioteca" });
      continue;
    }
    out.push({
      categoria: s.categoria,
      tags: s.tags,
      motivo: s.motivo,
      origem: "pendente",
    });
  }
  return out;
}
