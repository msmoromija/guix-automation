import type { CategoriaImagem, Nicho } from "./tipos";
import { listarPrefixo, metadadosObjeto, urlPublica } from "./r2";

export interface ImagemResolvida {
  categoria: CategoriaImagem;
  tags: string[];
  motivo: string;
  src?: string;
  r2_key?: string;
  origem: "biblioteca" | "pendente";
}

/** Cruza sugestões da IA com arquivos da biblioteca compartilhada (tags no metadado). */
export async function resolverSugestoesBiblioteca(opts: {
  nicho: Nicho;
  sugestoes: Array<{ categoria: CategoriaImagem; tags: string[]; motivo: string }>;
}): Promise<ImagemResolvida[]> {
  const out: ImagemResolvida[] = [];

  for (const s of opts.sugestoes) {
    const prefix = `imagens/${opts.nicho}/${s.categoria}/`;
    let match: { key: string; url: string } | null = null;

    try {
      const itens = await listarPrefixo(prefix, 50);
      for (const item of itens) {
        try {
          const head = await metadadosObjeto(item.key);
          const tagsObj = (head.metadata.tags || "")
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          const hit = s.tags.some((t) => tagsObj.includes(t.toLowerCase()));
          if (hit || itens.length === 1) {
            match = { key: item.key, url: urlPublica(item.key) };
            break;
          }
        } catch {
          /* next */
        }
      }
      // Sem tags no metadado: primeira foto da pasta como fallback de estoque
      if (!match && itens[0]) {
        match = { key: itens[0].key, url: itens[0].url };
      }
    } catch {
      /* biblioteca vazia */
    }

    out.push({
      categoria: s.categoria,
      tags: s.tags,
      motivo: s.motivo,
      src: match?.url,
      r2_key: match?.key,
      origem: match ? "biblioteca" : "pendente",
    });
  }

  return out;
}
