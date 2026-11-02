import { readFile } from "fs/promises";
import path from "path";
import type { PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { enquadrarFoto } from "@/lib/media/tratar-url";
import { buscarUnsplash, montarCredito } from "@/lib/media/unsplash";

const NICHOS = new Set(["barbearia", "salao", "estetica", "petshop", "academia", "contabilidade", "advocacia"]);

/** Troca o pedido de busca por um arquivo real da biblioteca ou do Unsplash. */
export async function resolverMidia(patch: PatchPedido, nicho: string): Promise<PatchPedido> {
  const midia = patch.midia;
  if (!midia) return patch;
  const saida: PatchPedido = { ...patch, midia: { ...midia } };

  const logo = midia.logo as { src?: string; arquivo?: string; buscar?: boolean } | undefined;
  if (logo && !logo.src && (logo.arquivo || logo.buscar)) {
    const src = await logoDaBiblioteca(nicho, String(logo.arquivo || ""));
    if (src) saida.midia = { ...saida.midia, logo: { src } };
  }

  async function resolverUma(foto: { slot?: string; indice?: number; busca?: string; src?: string }) {
    if (!foto?.busca || foto.src) return foto;
    try {
      const achadas = await buscarUnsplash(String(foto.busca).slice(0, 80), 1);
      const primeira = achadas[0];
      if (!primeira) return foto;
      return {
        slot: foto.slot,
        indice: foto.indice,
        src: enquadrarFoto(primeira.url_regular, 1200, 800) || primeira.url_regular,
        credito: montarCredito(primeira),
      };
    } catch {
      return foto;
    }
  }

  const foto = midia.foto as { slot?: string; indice?: number; busca?: string; src?: string } | undefined;
  if (foto?.busca && !foto.src) {
    saida.midia = { ...saida.midia, foto: await resolverUma(foto) };
  }

  const fotos = Array.isArray(midia.fotos) ? (midia.fotos as { slot?: string; indice?: number; busca?: string; src?: string }[]) : [];
  if (fotos.length) {
    const resolvidas = [];
    for (const item of fotos.slice(0, 4)) resolvidas.push(await resolverUma(item));
    saida.midia = { ...saida.midia, fotos: resolvidas };
    if (!saida.midia?.foto?.src && resolvidas[0]?.src) {
      saida.midia = { ...saida.midia, foto: resolvidas[0] };
    }
  }
  return saida;
}

async function logoDaBiblioteca(nicho: string, arquivo: string) {
  const pasta = NICHOS.has(nicho) ? nicho : "barbearia";
  try {
    const bruto = await readFile(path.join(process.cwd(), "public", "marcas", pasta, "index.json"), "utf8");
    const lista = JSON.parse(bruto) as string[];
    const num = arquivo.replace(/\D/g, "").padStart(2, "0");
    const marcado = num ? lista.find((item) => item.endsWith(`/${num}.png`)) : "";
    return marcado || lista[Math.floor(Math.random() * lista.length)] || "";
  } catch {
    return "";
  }
}
