import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { gerarTextosSite } from "@/lib/media/openai";
import type { GeracaoSiteJson } from "@/lib/media/tipos";
import { escolherImagensDoNicho, reservaDoModelo } from "@/lib/media/escolher-imagens";
import type { CategoriaImagem } from "@/lib/media/tipos";
import { sanitizarClienteId } from "@/lib/media/isolamento";
import { personalizarCopia } from "@/lib/estudio/aplicar";
import { aplicarDadosCliente } from "./aplicar-cliente";
import { aplicarConteudoGerado } from "./aplicar-conteudo";
import { carregarExemplo } from "./carregar-exemplo";
import { limparIdentidadeExemplo, polirTextosSite, repararParaSchema } from "./limpar-exemplo";
import type { EntradaAutomacao, ResultadoAutomacao } from "./tipos";
import { validarSiteJson } from "./validar-site";
import { revisarSiteFinal } from "@/lib/estudio/revisao-final";

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
  // Acervo real do modelo do nicho — usado como reserva se o Unsplash não responder.
  const reserva = reservaDoModelo(site);
  const endModelo = { ...(((site.empresa as Record<string, unknown> | undefined)?.endereco as Record<string, unknown>) || {}) };
  const bairroModelo = String(endModelo.bairro || "");
  const cidadeModelo = String(endModelo.cidade || "");
  site = limparIdentidadeExemplo(site, { ...entrada, clienteId });
  site = aplicarDadosCliente(site, { ...entrada, clienteId });

  const textos = entrada.textosProntos?.hero?.titulo
    ? { ...entrada.textosProntos, imagens_sugeridas: entrada.textosProntos.imagens_sugeridas || [] }
    : entrada.iaEscreve === false
      ? {
          hero: { titulo: "", subtitulo: "" },
          sobre: { titulo: "Sobre", paragrafos: [] as string[] },
          servicos: { titulo: "Serviços", subtitulo: "", itens: [] },
          imagens_sugeridas: [] as GeracaoSiteJson["imagens_sugeridas"],
        } satisfies Partial<GeracaoSiteJson> as GeracaoSiteJson
      : await gerarTextosSite({
          nicho: entrada.nicho,
          nome: entrada.nome,
          cidade: entrada.cidade,
          bairro: entrada.bairro,
          slogan: entrada.slogan,
          horario: entrada.horario,
          servicos: entrada.servicos,
          servicosDetalhe: entrada.servicosDetalhe,
          profissionaisDetalhe: entrada.profissionaisDetalhe,
          tom: entrada.tom,
          estilo: entrada.estilo,
          destaque: entrada.destaque,
        });

  const temFotoCliente = (cat: string) =>
    Boolean(entrada.imagensCliente?.some((i) => i.categoria === cat && i.src));

  const sugestoes = (textos.imagens_sugeridas || [])
    .filter((s) => s.categoria !== "profissional" && !temFotoCliente(s.categoria))
    .map((s) => ({
      categoria: s.categoria as CategoriaImagem,
      tags: s.tags || [],
      motivo: s.motivo || "",
    }));

  for (const cat of ["hero", "sobre"] as CategoriaImagem[]) {
    if (temFotoCliente(cat)) continue;
    if (!sugestoes.some((s) => s.categoria === cat)) {
      sugestoes.push({ categoria: cat, tags: [], motivo: "bloco principal" });
    }
  }
  const nServ = Math.max(3, entrada.servicosDetalhe?.length || entrada.servicos?.length || 3);
  while (!temFotoCliente("servico") && sugestoes.filter((s) => s.categoria === "servico").length < nServ) {
    sugestoes.push({ categoria: "servico", tags: [], motivo: `serviço ${sugestoes.length}` });
  }
  const nGal = entrada.imagensCliente?.filter((i) => i.categoria === "galeria").length || 0;
  while (sugestoes.filter((s) => s.categoria === "galeria").length + nGal < 6) {
    sugestoes.push({ categoria: "galeria", tags: [], motivo: `espaço ${sugestoes.length}` });
  }
  // Eventos e promoções também rotacionam a cada cliente (não herdam a foto fixa do modelo).
  const itensEvento = (((site.eventos as Record<string, unknown> | undefined)?.itens as unknown[]) || []).length;
  for (let i = 0; i < itensEvento; i++) {
    if (!temFotoCliente("evento")) sugestoes.push({ categoria: "evento", tags: [], motivo: `evento ${i + 1}` });
  }
  const itensPromocao = (((site.promocoes as Record<string, unknown> | undefined)?.itens as unknown[]) || []).length;
  for (let i = 0; i < itensPromocao; i++) {
    if (!temFotoCliente("promocao")) sugestoes.push({ categoria: "promocao", tags: [], motivo: `promoção ${i + 1}` });
  }
  // Retratos da equipe também rotacionam a cada cliente (não herdam o retrato fixo do modelo).
  const nProfissional = entrada.profissionaisDetalhe?.length || 0;
  for (let i = 0; i < nProfissional; i++) {
    if (!temFotoCliente("profissional")) sugestoes.push({ categoria: "profissional", tags: [], motivo: `profissional ${i + 1}` });
  }

  const resolvidas = sugestoes.length
    ? await escolherImagensDoNicho({
        nicho: entrada.nicho,
        sugestoes,
        reserva,
      })
    : [];

  const aplicado = aplicarConteudoGerado(site, textos, resolvidas, { ...entrada, clienteId });
  site = polirTextosSite(aplicado.site);
  personalizarCopia(site, {
    nicho: entrada.nicho,
    nome: entrada.nome,
    bairro: entrada.bairro,
    cidade: entrada.cidade,
    bairroModelo,
    cidadeModelo,
  });
  site = repararParaSchema(site, { ...entrada, clienteId });
  const avisos = [...aplicado.avisos];
  if (entrada.textosProntos?.hero?.titulo) avisos.push("textos da simulação");
  else if (entrada.iaEscreve !== false) avisos.push("textos escritos pela IA");
  if (resolvidas.some((r) => r.origem === "unsplash")) avisos.push("fotos do ofício via Unsplash (nicho filtrado)");
  if (resolvidas.every((r) => r.origem === "pendente")) avisos.push("sem foto nova — mantidas as do modelo do nicho");

  const revisao = await revisarSiteFinal({
    site,
    nicho: entrada.nicho,
    pedido: `Criação do site de ${entrada.nome} no segmento ${entrada.nicho}. Revise todo o conteúdo final e as imagens.`,
    fatosConfirmados: {
      nome: entrada.nome,
      slogan: entrada.slogan || "",
      cidade: entrada.cidade || "",
      estado: entrada.estado || "",
      bairro: entrada.bairro || "",
      logradouro: entrada.logradouro || "",
      numero: entrada.numero || "",
      cep: entrada.cep || "",
      telefone: entrada.telefone || "",
      whatsapp: entrada.whatsapp || "",
      email: entrada.email || "",
      cnpj: entrada.cnpj || "",
      horario: entrada.horario || "",
      servicos: entrada.servicosDetalhe?.length ? entrada.servicosDetalhe : entrada.servicos || [],
      profissionais: entrada.profissionaisDetalhe || [],
      redes: {
        instagram: entrada.instagram || "",
        facebook: entrada.facebook || "",
        tiktok: entrada.tiktok || "",
        youtube: entrada.youtube || "",
        linkedin: entrada.linkedin || "",
      },
    },
  });
  site = repararParaSchema(revisao.site, { ...entrada, clienteId });
  if (revisao.aviso) avisos.push(revisao.aviso);
  if (!revisao.revisado && !revisao.aviso) {
    avisos.push("A revisão final não pôde confirmar o conteúdo; confira os dados antes de publicar.");
  }

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
    modelo: { bairro: bairroModelo, cidade: cidadeModelo },
    imagens: resolvidas.map((r) => ({
      categoria: r.categoria,
      src: r.src,
      origem: r.origem,
      r2_key: r.r2_key,
    })),
  };
}
