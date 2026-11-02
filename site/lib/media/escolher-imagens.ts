import { BUSCA_FOTO, tagsDoNicho } from "./catalogo";
import { listarPrefixo, metadadosObjeto, urlPublica } from "./r2";
import { enquadrarFoto } from "./tratar-url";
import type { CategoriaImagem, CreditoUnsplash, Nicho } from "./tipos";
import { buscarUnsplash, montarCredito } from "./unsplash";
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
};

async function melhorDoR2(nicho: Nicho, categoria: CategoriaImagem, tags: string[], usadas: Set<string>) {
  const prefix = `imagens/${nicho}/${categoria}/`;
  const quer = new Set([...tags, ...tagsDoNicho(nicho)].map((t) => t.toLowerCase()));
  try {
    const itens = await listarPrefixo(prefix, 40);
    let melhor: { key: string; url: string; score: number } | null = null;
    for (const item of itens) {
      if (!item.key.startsWith(prefix) || usadas.has(item.key)) continue;
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

const poolUnsplash = new Map<string, Awaited<ReturnType<typeof buscarUnsplash>>>();

async function proximaUnsplash(nicho: Nicho, categoria: CategoriaImagem, usadas: Set<string>) {
  const cfg = BUSCA_FOTO[nicho] || BUSCA_FOTO.generico;
  const query = cfg.query[categoria] || cfg.query.hero;
  const chave = `${nicho}:${categoria}:${query}`;
  if (!poolUnsplash.has(chave)) {
    try {
      poolUnsplash.set(chave, await buscarUnsplash(query, 12));
    } catch {
      poolUnsplash.set(chave, []);
    }
  }
  const fotos = poolUnsplash.get(chave) || [];
  const foto = fotos.find((f) => !usadas.has(f.id) && !textoBloqueado(`${f.descricao} ${f.fotografo}`, cfg.bloquear));
  if (!foto) return null;
  usadas.add(foto.id);
  const box = recorte[categoria] || recorte.hero;
  return {
    src: enquadrarFoto(foto.url_regular, box.w, box.h, box.faces) || foto.url_regular,
    credito: montarCredito(foto),
  };
}

/** Biblioteca do nicho com tags; senão Unsplash, uma foto diferente por bloco. */
export async function escolherImagensDoNicho(opts: {
  nicho: Nicho;
  sugestoes: Array<{ categoria: CategoriaImagem; tags: string[]; motivo: string }>;
}): Promise<ImagemResolvida[]> {
  const usadas = new Set<string>();
  const out: ImagemResolvida[] = [];
  for (const s of opts.sugestoes) {
    const r2 = await melhorDoR2(opts.nicho, s.categoria, s.tags, usadas);
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
    out.push({
      categoria: s.categoria,
      tags: s.tags,
      motivo: s.motivo,
      origem: "pendente",
    });
  }
  return out;
}
