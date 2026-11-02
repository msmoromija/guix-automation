import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { gerarTextosSite } from "@/lib/media/openai";
import { resolverSugestoesBiblioteca } from "@/lib/media/resolver-imagens";
import type { CategoriaImagem } from "@/lib/media/tipos";
import { sanitizarClienteId } from "@/lib/media/isolamento";
import { aplicarDadosCliente } from "./aplicar-cliente";
import { aplicarConteudoGerado } from "./aplicar-conteudo";
import { carregarExemplo } from "./carregar-exemplo";
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
  site = aplicarDadosCliente(site, { ...entrada, clienteId });

  const textos = await gerarTextosSite({
    nicho: entrada.nicho,
    nome: entrada.nome,
    cidade: entrada.cidade,
    servicos: entrada.servicos,
    tom: entrada.tom,
  });

  const sugestoes = (textos.imagens_sugeridas || []).map((s) => ({
    categoria: s.categoria as CategoriaImagem,
    tags: s.tags || [],
    motivo: s.motivo || "",
  }));

  // Garante pelo menos hero/sobre/servico na resolução
  for (const cat of ["hero", "sobre", "servico", "galeria", "profissional"] as CategoriaImagem[]) {
    if (!sugestoes.some((s) => s.categoria === cat)) {
      sugestoes.push({ categoria: cat, tags: [], motivo: "fallback automação" });
    }
  }

  const resolvidas = await resolverSugestoesBiblioteca({
    nicho: entrada.nicho,
    sugestoes,
  });

  const aplicado = aplicarConteudoGerado(site, textos, resolvidas, { ...entrada, clienteId });
  site = aplicado.site;
  const avisos = [...aplicado.avisos];

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
