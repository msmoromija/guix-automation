import { BUSCA_FOTO, tagsDoNicho } from "./catalogo";
import { listarPrefixo, metadadosObjeto, urlPublica } from "./r2";
import type { CategoriaImagem, CreditoUnsplash, Nicho } from "./tipos";
import { buscarUnsplash, montarCredito } from "./unsplash";
import type { ImagemResolvida } from "./resolver-imagens";

function textoBloqueado(texto: string, bloquear: string[]) {
  const t = texto.toLowerCase();
  return bloquear.some((b) => t.includes(b.toLowerCase()));
}

async function melhorDoR2(nicho: Nicho, categoria: CategoriaImagem, tags: string[]) {
  const prefix = `imagens/${nicho}/${categoria}/`;
  const quer = new Set([...tags, ...tagsDoNicho(nicho)].map((t) => t.toLowerCase()));
  try {
    const itens = await listarPrefixo(prefix, 40);
    let melhor: { key: string; url: string; score: number } | null = null;
    for (const item of itens) {
      if (!item.key.startsWith(prefix)) continue;
      let tagsObj: string[] = [];
      try {
        const head = await metadadosObjeto(item.key);
        tagsObj = (head.metadata.tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      } catch {
        /* sem metadado */
      }
      const score = tagsObj.filter((t) => quer.has(t)).length;
      const nomeOk = item.key.toLowerCase().includes(nicho);
      if (score === 0 && !nomeOk) continue;
      if (!melhor || score > melhor.score) melhor = { key: item.key, url: item.url || urlPublica(item.key), score };
    }
    return melhor;
  } catch {
    return null;
  }
}

async function melhorUnsplash(nicho: Nicho, categoria: CategoriaImagem) {
  const cfg = BUSCA_FOTO[nicho] || BUSCA_FOTO.generico;
  const query = cfg.query[categoria] || cfg.query.hero;
  try {
    const fotos = await buscarUnsplash(query, 10);
    const ok = fotos.find((f) => !textoBloqueado(`${f.descricao} ${f.fotografo}`, cfg.bloquear));
    const foto = ok || fotos[0];
    if (!foto) return null;
    return {
      src: foto.url_regular,
      credito: montarCredito(foto),
    };
  } catch {
    return null;
  }
}

/** Biblioteca do nicho com tags; se vazio ou foto errada, Unsplash com query do ofício. */
export async function escolherImagensDoNicho(opts: {
  nicho: Nicho;
  sugestoes: Array<{ categoria: CategoriaImagem; tags: string[]; motivo: string }>;
}): Promise<ImagemResolvida[]> {
  const cats = opts.sugestoes;
  return Promise.all(
    cats.map(async (s) => {
      const r2 = await melhorDoR2(opts.nicho, s.categoria, s.tags);
      if (r2) {
        return {
          categoria: s.categoria,
          tags: s.tags,
          motivo: s.motivo,
          src: r2.url,
          r2_key: r2.key,
          origem: "biblioteca" as const,
        };
      }
      const un = await melhorUnsplash(opts.nicho, s.categoria);
      if (un) {
        return {
          categoria: s.categoria,
          tags: s.tags,
          motivo: s.motivo,
          src: un.src,
          origem: "unsplash" as const,
          credito: un.credito as CreditoUnsplash,
        };
      }
      return {
        categoria: s.categoria,
        tags: s.tags,
        motivo: s.motivo,
        origem: "pendente" as const,
      };
    }),
  );
}
