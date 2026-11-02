import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { gerarTextosSite } from "@/lib/media/openai";
import type { GeracaoSiteJson } from "@/lib/media/tipos";
import { escolherImagensDoNicho } from "@/lib/media/escolher-imagens";
import type { CategoriaImagem } from "@/lib/media/tipos";
import { sanitizarClienteId } from "@/lib/media/isolamento";
import { aplicarDadosCliente } from "./aplicar-cliente";
import { aplicarConteudoGerado } from "./aplicar-conteudo";
import { carregarExemplo } from "./carregar-exemplo";
import { limparIdentidadeExemplo, polirTextosSite } from "./limpar-exemplo";
import type { EntradaAutomacao, ResultadoAutomacao } from "./tipos";
import { validarSiteJson } from "./validar-site";

function raizRepo() {
  return path.resolve(process.cwd(), process.cwd().endsWith(`${path.sep}site`) ? ".." : ".");
}

/**
 * Gera site.json 1.0.0 a partir do exemplo do nicho + dados do cliente + OpenAI + biblioteca.
 * Uploads do cliente (imagensCliente) têm prioridade e nunca misturam com outros projetos.
 */
export async function gerarSiteCliente(
  entrada: EntradaAutomacao,
  opts?: { gravarPacote?: boolean },
): Promise<ResultadoAutomacao> {
  const clienteId = sanitizarClienteId(entrada.clienteId);
  if (!entrada.nome?.trim()) throw new Error("nome obrigatório");

  let site = await carregarExemplo(entrada.nicho);
  site = limparIdentidadeExemplo(site, { ...entrada, clienteId });
  site = aplicarDadosCliente(site, { ...entrada, clienteId });

  const textos =
    entrada.iaEscreve === false
      ? {
          hero: { titulo: entrada.nome, subtitulo: entrada.slogan || "" },
          sobre: { titulo: "Sobre", paragrafos: [] as string[] },
          servicos: { titulo: "Serviços", subtitulo: "", itens: [] },
          imagens_sugeridas: [] as GeracaoSiteJson["imagens_sugeridas"],
        } satisfies Partial<GeracaoSiteJson> as GeracaoSiteJson
      : await gerarTextosSite({
          nicho: entrada.nicho,
          nome: entrada.nome,
          cidade: entrada.cidade,
          slogan: entrada.slogan,
          servicos: entrada.servicos,
          servicosDetalhe: entrada.servicosDetalhe,
          profissionaisDetalhe: entrada.profissionaisDetalhe,
          tom: entrada.tom,
          estilo: entrada.estilo,
          destaque: entrada.destaque,
        });

  const sugestoes = (textos.imagens_sugeridas || []).map((s) => ({
    categoria: s.categoria as CategoriaImagem,
    tags: s.tags || [],
    motivo: s.motivo || "",
  }));

  for (const cat of ["hero", "sobre"] as CategoriaImagem[]) {
    if (!sugestoes.some((s) => s.categoria === cat)) {
      sugestoes.push({ categoria: cat, tags: [], motivo: "bloco principal" });
    }
  }
  const nServ = Math.max(3, entrada.servicosDetalhe?.length || entrada.servicos?.length || 3);
  while (sugestoes.filter((s) => s.categoria === "servico").length < nServ) {
    sugestoes.push({ categoria: "servico", tags: [], motivo: `serviço ${sugestoes.length}` });
  }
  while (sugestoes.filter((s) => s.categoria === "galeria").length < 6) {
    sugestoes.push({ categoria: "galeria", tags: [], motivo: `espaço ${sugestoes.length}` });
  }

  const resolvidas = await escolherImagensDoNicho({
    nicho: entrada.nicho,
    sugestoes,
  });

  const aplicado = aplicarConteudoGerado(site, textos, resolvidas, { ...entrada, clienteId });
  site = polirTextosSite(aplicado.site);
  const avisos = [...aplicado.avisos];
  if (entrada.iaEscreve !== false) avisos.push("textos escritos pela IA");
  if (resolvidas.some((r) => r.origem === "unsplash")) avisos.push("fotos do ofício via Unsplash (nicho filtrado)");
  if (resolvidas.every((r) => r.origem === "pendente")) avisos.push("sem foto nova — mantidas as do modelo do nicho");

  const validacao = await validarSiteJson(site);
  if (!validacao.ok) {
    throw new Error(`site.json inválido: ${validacao.erros.slice(0, 8).join("; ")}`);
  }

  if (opts?.gravarPacote && !process.env.VERCEL) {
    const dir = path.join(raizRepo(), "clientes", clienteId);
    await mkdir(path.join(dir, "config"), { recursive: true });
    await mkdir(path.join(dir, "assets"), { recursive: true });
    await writeFile(path.join(dir, "config", "site.json"), JSON.stringify(site, null, 2), "utf8");
    avisos.push(`pacote gravado em clientes/${clienteId}/`);
  }

  return {
    clienteId,
    site,
    avisos,
    imagens: resolvidas.map((r) => ({
      categoria: r.categoria,
      src: r.src,
      origem: r.origem,
      r2_key: r.r2_key,
    })),
  };
}
