import { randomInt, randomUUID } from "crypto";
import type { CategoriaImagem, CreditoUnsplash, Nicho, UnsplashFoto } from "./tipos";
import { chaveBiblioteca, chaveClienteInbox, enviarBuffer } from "./r2";
import { enquadrarParaSlot } from "./processar-imagem";
import { avaliarParaSlot } from "./validar-imagem";
import { sanitizarClienteId } from "./isolamento";

function accessKey() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY não definida");
  return key;
}

export function montarCredito(foto: UnsplashFoto): CreditoUnsplash {
  return {
    fotografo: foto.fotografo,
    perfil_url: foto.perfil_url,
    unsplash_url: foto.unsplash_url,
    texto: `Photo by ${foto.fotografo} on Unsplash`,
  };
}

/** Varia a página para não servir sempre o topo dos mesmos resultados a cada cliente. */
export function paginaAleatoriaUnsplash() {
  return randomInt(1, 9);
}

export function escolherFotoAleatoria<T extends { id: string }>(fotos: T[], usadas = new Set<string>()) {
  const candidatas = fotos.filter((foto) => !usadas.has(foto.id));
  if (!candidatas.length) return undefined;
  return candidatas[randomInt(0, candidatas.length)];
}

export async function buscarUnsplash(
  termo: string,
  porPagina = 12,
  signal?: AbortSignal,
  pagina = 1,
): Promise<UnsplashFoto[]> {
  const params = new URLSearchParams({
    query: termo,
    per_page: String(porPagina),
    orientation: "landscape",
    page: String(Math.max(1, pagina)),
  });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    signal,
    headers: {
      Authorization: `Client-ID ${accessKey()}`,
      "Accept-Version": "v1",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Unsplash busca falhou: ${res.status}`);
  }
  const data = (await res.json()) as {
    results: Array<{
      id: string;
      description: string | null;
      alt_description: string | null;
      urls: { thumb: string; regular: string; full: string };
      links: { html: string; download_location: string };
      user: { name: string; links: { html: string } };
    }>;
  };

  return data.results.map((p) => ({
    id: p.id,
    descricao: p.alt_description || p.description || termo,
    url_thumb: p.urls.thumb,
    url_regular: p.urls.regular,
    url_download: p.links.download_location,
    fotografo: p.user.name,
    perfil_url: p.user.links.html,
    unsplash_url: p.links.html,
  }));
}

/** Dispara o endpoint de download do Unsplash (obrigatório pela API) e baixa o arquivo. */
export async function baixarFotoUnsplash(foto: UnsplashFoto) {
  const track = await fetch(foto.url_download, {
    headers: { Authorization: `Client-ID ${accessKey()}` },
  });
  if (!track.ok) throw new Error(`Unsplash download_location: ${track.status}`);
  const { url } = (await track.json()) as { url: string };

  const img = await fetch(url);
  if (!img.ok) throw new Error(`Unsplash arquivo: ${img.status}`);
  const buf = Buffer.from(await img.arrayBuffer());
  const contentType = img.headers.get("content-type") || "image/jpeg";
  return { buf, contentType };
}

/**
 * Espelha Unsplash no R2.
 * Com clienteId → inbox isolado do cliente + enquadramento do slot.
 * Sem clienteId → biblioteca compartilhada (uso admin / seed).
 */
export async function espelharUnsplashNoR2(opts: {
  foto: UnsplashFoto;
  nicho: Nicho;
  categoria: CategoriaImagem;
  clienteId?: string;
}) {
  const { buf, contentType } = await baixarFotoUnsplash(opts.foto);
  const credito = montarCredito(opts.foto);

  if (opts.clienteId) {
    const clienteId = sanitizarClienteId(opts.clienteId);
    const avaliacao = await avaliarParaSlot(buf, opts.categoria);
    const nome = `unsplash_${opts.foto.id}_${randomUUID().slice(0, 8)}.webp`;
    const key = chaveClienteInbox(clienteId, opts.categoria, nome);

    if (!avaliacao.ok) {
      await enviarBuffer({
        key,
        body: buf,
        contentType,
        origem: "unsplash",
        credito,
        alt: opts.foto.descricao,
        tags: ["unsplash", "negada", opts.nicho, opts.categoria],
        status: "negada",
        clienteId,
        categoria: opts.categoria,
        motivo: avaliacao.motivo,
        width: avaliacao.width,
        height: avaliacao.height,
      });
      return {
        key,
        url: "",
        credito,
        alt: opts.foto.descricao,
        origem: "unsplash" as const,
        status: "negada" as const,
        motivo: avaliacao.motivo,
      };
    }

    const processada = await enquadrarParaSlot(buf, avaliacao.slot);
    const enviado = await enviarBuffer({
      key,
      body: processada.buffer,
      contentType: processada.contentType,
      origem: "unsplash",
      credito,
      alt: opts.foto.descricao,
      tags: ["unsplash", "aprovada", opts.nicho, opts.categoria],
      status: "aprovada",
      clienteId,
      categoria: opts.categoria,
      width: processada.width,
      height: processada.height,
    });

    return {
      ...enviado,
      credito,
      alt: opts.foto.descricao,
      origem: "unsplash" as const,
      status: "aprovada" as const,
    };
  }

  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const nome = `unsplash_${opts.foto.id}.${ext}`;
  const key = chaveBiblioteca(opts.nicho, opts.categoria, nome);

  const enviado = await enviarBuffer({
    key,
    body: buf,
    contentType,
    origem: "unsplash",
    credito,
    alt: opts.foto.descricao,
    tags: ["unsplash", opts.nicho, opts.categoria],
    status: "aprovada",
  });

  return {
    ...enviado,
    credito,
    alt: opts.foto.descricao,
    origem: "unsplash" as const,
    status: "aprovada" as const,
  };
}
