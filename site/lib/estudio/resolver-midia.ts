import { readFile } from "fs/promises";
import path from "path";
import type { PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { BUSCA_FOTO } from "@/lib/media/catalogo";
import type { Nicho } from "@/lib/media/tipos";
import { enquadrarFoto } from "@/lib/media/tratar-url";
import { buscarUnsplash, escolherFotoAleatoria, montarCredito, paginaAleatoriaUnsplash } from "@/lib/media/unsplash";

const NICHOS = new Set([
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "dentista",
  "clinica",
  "psicologia",
  "nutricionista",
]);

/** Troca o pedido de busca por um arquivo real da biblioteca ou do Unsplash. */
export async function resolverMidia(patch: PatchPedido, nicho: string): Promise<PatchPedido> {
  const midia = patch.midia;
  if (!midia) return patch;
  const saida: PatchPedido = { ...patch, midia: { ...midia } };
  const nichoSeguro = (NICHOS.has(nicho) ? nicho : "generico") as Nicho;
  const buscasDoNicho = BUSCA_FOTO[nichoSeguro]?.query || BUSCA_FOTO.generico.query;

  function consultaDoSlot(slot?: string) {
    if (slot === "hero" || slot === "sobre" || slot === "servico" || slot === "galeria") {
      return buscasDoNicho[slot] || BUSCA_FOTO.generico.query[slot];
    }
    if (slot === "evento") return buscasDoNicho.galeria || BUSCA_FOTO.generico.query.galeria;
    return BUSCA_FOTO.generico.query.hero;
  }

  const logo = midia.logo as { src?: string; arquivo?: string; buscar?: boolean } | undefined;
  if (logo && !logo.src && (logo.arquivo || logo.buscar)) {
    const src = await logoDaBiblioteca(nicho, String(logo.arquivo || ""));
    if (src) saida.midia = { ...saida.midia, logo: { src } };
  }

  async function resolverUma(foto: { slot?: string; indice?: number; busca?: string; src?: string }) {
    if (!foto?.busca || foto.src) return foto;
    if (foto.slot === "profissional") return foto;
    try {
      const pagina = paginaAleatoriaUnsplash();
      const achadas = await buscarUnsplash(consultaDoSlot(foto.slot), 12, AbortSignal.timeout(5000), pagina);
      const candidatas = achadas.length ? achadas : await buscarUnsplash(consultaDoSlot(foto.slot), 12, AbortSignal.timeout(5000), 1);
      const escolhida = escolherFotoAleatoria(candidatas);
      if (!escolhida) return foto;
      return {
        slot: foto.slot,
        indice: foto.indice,
        src: enquadrarFoto(escolhida.url_regular, 1200, 800) || escolhida.url_regular,
        credito: montarCredito(escolhida),
      };
    } catch {
      return foto;
    }
  }

  const foto = midia.foto as { slot?: string; indice?: number; busca?: string; src?: string } | undefined;
  if (foto?.busca && !foto.src && !(Array.isArray(midia.fotos) && midia.fotos.length)) {
    saida.midia = { ...saida.midia, foto: await resolverUma(foto) };
    if (foto.slot === "profissional") {
      saida.aviso_estrutura = [
        saida.aviso_estrutura,
        "Retratos da equipe não são escolhidos automaticamente; envie a foto correta para evitar associar uma imagem à pessoa errada.",
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  const fotos = Array.isArray(midia.fotos) ? (midia.fotos as { slot?: string; indice?: number; busca?: string; src?: string }[]) : [];
  if (fotos.length) {
    const solicitadas = fotos.slice(0, 40);
    const resultados = new Array<{
      foto: (typeof solicitadas)[number];
      candidatas: Awaited<ReturnType<typeof buscarUnsplash>>;
    }>(solicitadas.length);
    let proxima = 0;
    const worker = async () => {
      while (proxima < solicitadas.length) {
        const indice = proxima++;
        const item = solicitadas[indice];
        if (!item?.busca || item.src || item.slot === "profissional") {
          resultados[indice] = { foto: item, candidatas: [] };
          continue;
        }
        try {
          const candidatas = await buscarUnsplash(
            consultaDoSlot(item.slot),
            12,
            AbortSignal.timeout(5000),
            paginaAleatoriaUnsplash(),
          );
          resultados[indice] = { foto: item, candidatas };
        } catch {
          resultados[indice] = { foto: item, candidatas: [] };
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(8, solicitadas.length) }, () => worker()));

    const usadas = new Set<string>();
    const resolvidas = resultados.map(({ foto, candidatas }) => {
      const escolhida = escolherFotoAleatoria(candidatas, usadas);
      if (!escolhida) return foto;
      usadas.add(escolhida.id);
      return {
        slot: foto.slot,
        indice: foto.indice,
        src: enquadrarFoto(escolhida.url_regular, 1200, 800) || escolhida.url_regular,
        credito: montarCredito(escolhida),
      };
    });
    const semResultado = resultados
      .map((resultado, indice) => ({ resultado, indice }))
      .filter(
        ({ resultado, indice }) =>
          resultado.foto?.busca &&
          resultado.foto.slot !== "profissional" &&
          !resultado.foto.src &&
          !resolvidas[indice]?.src,
      );
    let proximaPagina = 0;
    const workerPaginaSeguinte = async () => {
      while (proximaPagina < semResultado.length) {
        const posicao = proximaPagina++;
        const { resultado } = semResultado[posicao];
        if (!resultado.foto.busca) continue;
        try {
          resultado.candidatas = await buscarUnsplash(
            consultaDoSlot(resultado.foto.slot),
            12,
            AbortSignal.timeout(5000),
            paginaAleatoriaUnsplash(),
          );
        } catch {
          resultado.candidatas = [];
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(8, semResultado.length) }, () => workerPaginaSeguinte()));
    let substituidas = resolvidas.filter((item, indice) => item.src && item.src !== solicitadas[indice].src).length;
    for (const { resultado, indice } of semResultado) {
      if (resolvidas[indice]?.src || !resultado.candidatas.length) continue;
      const escolhida = escolherFotoAleatoria(resultado.candidatas, usadas);
      if (!escolhida) continue;
      usadas.add(escolhida.id);
      resolvidas[indice] = {
        slot: resultado.foto.slot,
        indice: resultado.foto.indice,
        src: enquadrarFoto(escolhida.url_regular, 1200, 800) || escolhida.url_regular,
        credito: montarCredito(escolhida),
      };
      substituidas += 1;
    }

    const solicitadasComBusca = solicitadas.filter((item) => item?.busca && !item.src).length;
    const naoEncontradas = Math.max(0, solicitadasComBusca - substituidas);
    if (naoEncontradas) {
      const retratosNaoTrocados = solicitadas.some((item) => item.slot === "profissional" && item.busca && !item.src);
      const aviso = [
        `Imagens: ${substituidas} de ${solicitadasComBusca} espaços foram atualizados; ${naoEncontradas} não tiveram resultados distintos e mantêm a imagem anterior.`,
        retratosNaoTrocados
          ? "Retratos da equipe não são escolhidos automaticamente; envie a foto correta para evitar associar uma imagem à pessoa errada."
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      saida.aviso_estrutura = [saida.aviso_estrutura, aviso].filter(Boolean).join(" ");
      saida.resumo = `Atualizei ${substituidas} de ${solicitadasComBusca} espaços de imagem.`;
    } else if (solicitadas.some((item) => item.slot === "profissional" && item.busca && !item.src)) {
      saida.aviso_estrutura = [
        saida.aviso_estrutura,
        "Retratos da equipe não são escolhidos automaticamente; envie a foto correta para evitar associar uma imagem à pessoa errada.",
      ]
        .filter(Boolean)
        .join(" ");
    } else if (solicitadasComBusca) {
      saida.resumo = `Atualizei as imagens dos ${substituidas} espaços solicitados com resultados distintos.`;
    }

    saida.midia = { ...saida.midia, fotos: resolvidas };
    if (!saida.midia?.foto?.src && resolvidas[0]?.src) {
      saida.midia = { ...saida.midia, foto: resolvidas[0] };
    }
  }
  return saida;
}

async function logoDaBiblioteca(nicho: string, arquivo: string) {
  const pasta = NICHOS.has(nicho) ? nicho : "generico";
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
