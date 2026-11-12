import { aplicarPedido, type PatchPedido, type ResultadoPedido } from "@/lib/estudio/aplicar-pedido";
import { resolverMidia } from "@/lib/estudio/resolver-midia";
import { revisarConteudoFinal } from "@/lib/media/openai";
import type { Nicho } from "@/lib/media/tipos";
import { visualPadrao, type VisualConfig } from "@/lib/estudio/visual";

type Registro = Record<string, unknown>;
type CorrecaoTexto = { caminho: string; valor: string; motivo: string };
type AchadoImagem = { caminho: string; acao: string; motivo: string; confianca: string };

function registro(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Registro) : {};
}

function lista(valor: unknown) {
  return Array.isArray(valor) ? valor.map(registro) : [];
}

function texto(valor: unknown, limite = 400) {
  return String(valor ?? "").replace(/\s+/g, " ").trim().slice(0, limite);
}

function mapaVisivel(site: Registro) {
  const empresa = registro(site.empresa);
  const endereco = registro(empresa.endereco);
  const imagem = (valor: unknown) => {
    const item = registro(valor);
    const foto = registro(item.imagem || item.foto);
    return { alt: texto(foto.alt, 140), legenda: texto(item.legenda, 120), origem: texto(foto.origem, 24) };
  };
  return {
    nicho: texto(registro(site.meta).nicho, 40),
    empresa: {
      nome: texto(empresa.nome, 100),
      slogan: texto(empresa.slogan, 180),
      telefone: texto(empresa.telefone_label || empresa.telefone, 32),
      whatsapp: texto(empresa.whatsapp_label || empresa.whatsapp, 32),
      email: texto(empresa.email, 100),
      endereco: {
        logradouro: texto(endereco.logradouro, 120),
        numero: texto(endereco.numero, 24),
        bairro: texto(endereco.bairro, 80),
        cidade: texto(endereco.cidade, 80),
        estado: texto(endereco.estado, 24),
        cep: texto(endereco.cep, 24),
        completo: texto(endereco.completo, 220),
      },
      horario: texto(empresa.horario_resumo, 160),
      expediente: empresa.expediente || [],
      redes: empresa.redes || [],
    },
    header: site.header || {},
    hero: { ...registro(site.hero), imagem: imagem(site.hero) },
    sobre: { ...registro(site.sobre), imagem: imagem(site.sobre) },
    servicos: {
      ...registro(site.servicos),
      itens: lista(registro(site.servicos).itens).map((item) => ({
        nome: texto(item.nome, 100),
        descricao: texto(item.descricao, 400),
        preco: texto(item.preco_label || item.preco, 60),
        duracao: texto(item.duracao_label || item.duracao_minutos, 40),
        imagem: imagem(item),
      })),
    },
    profissionais: {
      ...registro(site.profissionais),
      itens: lista(registro(site.profissionais).itens).map((item) => ({
        nome: texto(item.nome, 100),
        cargo: texto(item.cargo, 80),
        descricao: texto(item.descricao, 300),
        foto: imagem(item),
      })),
    },
    eventos: {
      ...registro(site.eventos),
      itens: lista(registro(site.eventos).itens).map((item) => ({
        titulo: texto(item.titulo, 100),
        descricao: texto(item.descricao, 400),
        data: texto(item.data_label || item.data, 80),
        horario: texto(item.horario, 24),
        imagem: imagem(item),
      })),
    },
    promocoes: {
      ...registro(site.promocoes),
      itens: lista(registro(site.promocoes).itens).map((item) => ({
        titulo: texto(item.titulo, 100),
        descricao: texto(item.descricao, 400),
        validade: texto(item.validade_label || item.validade, 80),
      })),
    },
    faq: {
      ...registro(site.faq),
      itens: lista(registro(site.faq).itens).map((item) => ({
        pergunta: texto(item.pergunta, 180),
        resposta: texto(item.resposta, 400),
      })),
    },
    diferenciais: {
      ...registro(site.diferenciais),
      itens: lista(registro(site.diferenciais).itens).map((item) => ({
        titulo: texto(item.titulo, 100),
        descricao: texto(item.descricao, 300),
      })),
    },
    galeria: {
      ...registro(site.galeria),
      itens: lista(registro(site.galeria).itens).map((item) => ({ ...item, imagem: imagem(item) })),
    },
    contato: site.contato || {},
    rodape: site.rodape || {},
    seo: site.seo || {},
    avisos: site.avisos || {},
    privacidade: site.privacidade || {},
    obrigado: site.obrigado || {},
    agendamento: site.agendamento || {},
  };
}

function coletarImagens(site: Registro) {
  const imagens: { local: string; url: string; alt: string; contexto: string }[] = [];
  const naoAuditaveis: string[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "";
  const registrar = (caminho: string, item: Registro, imagem: Registro) => {
    const src = texto(imagem.src, 2000);
    if (!src) {
      naoAuditaveis.push(caminho);
      return;
    }
    let url: URL;
    try {
      url = new URL(src, baseUrl || undefined);
    } catch {
      naoAuditaveis.push(caminho);
      return;
    }
    if (url.protocol !== "https:" || url.username || url.password || imagens.length >= 40) {
      naoAuditaveis.push(caminho);
      return;
    }
    imagens.push({
      local: caminho,
      url: url.toString(),
      alt: texto(imagem.alt, 140),
      contexto: [
        item.nome,
        item.cargo,
        item.titulo,
        item.legenda,
        item.descricao,
        `origem: ${texto(imagem.origem, 24) || "não informada"}`,
      ].map((value) => texto(value, 180)).filter(Boolean).join(" | ").slice(0, 400),
    });
  };
  const um = (caminho: string, raw: unknown) => {
    const item = registro(raw);
    const propriedade = item.foto ? "foto" : "imagem";
    const imagemRaw = item.imagem || item.foto;
    const imagem = registro(imagemRaw);
    if (imagemRaw && Object.keys(imagem).length) registrar(`${caminho}.${propriedade}`, item, imagem);
  };

  const empresa = registro(site.empresa);
  if (empresa.logo) registrar("empresa.logo", empresa, registro(empresa.logo));
  um("hero", site.hero);
  um("sobre", site.sobre);
  for (const [chave, bloco] of [
    ["servicos", site.servicos],
    ["profissionais", site.profissionais],
    ["eventos", site.eventos],
    ["promocoes", site.promocoes],
    ["galeria", site.galeria],
  ] as const) {
    lista(registro(bloco).itens).forEach((item, indice) => um(`${chave}.itens[${indice}]`, item));
  }
  const seo = registro(site.seo);
  if (seo.og_image) registrar("seo.og_image", {}, registro(seo.og_image));
  return { imagens, naoAuditaveis };
}

function valorNoCaminho(site: Registro, caminho: string): string {
  let atual: unknown = site;
  for (const parte of caminho.replace(/\[(\d+)\]/g, ".$1").split(".")) {
    atual = /^\d+$/.test(parte) ? (Array.isArray(atual) ? atual[Number(parte)] : undefined) : registro(atual)[parte];
  }
  return texto(atual, 600);
}

function corrigirTexto(site: Registro, patch: PatchPedido, correcao: CorrecaoTexto) {
  const caminho = texto(correcao.caminho, 120);
  const valor = texto(correcao.valor, 400);
  if (!valor || valor === valorNoCaminho(site, caminho)) return false;
  let m: RegExpMatchArray | null;

  if ((m = caminho.match(/^hero\.(titulo|subtitulo|botao_principal|botao_secundario)$/))) {
    patch.hero ||= {};
    patch.hero[m[1] as "titulo" | "subtitulo" | "botao_principal" | "botao_secundario"] = valor;
    return true;
  }
  if (caminho === "sobre.titulo") {
    patch.sobre ||= {};
    patch.sobre.titulo = valor;
    return true;
  }
  if ((m = caminho.match(/^sobre\.paragrafos\[(\d+)\]$/))) {
    const indice = Number(m[1]);
    const paragrafos = Array.isArray(registro(site.sobre).paragrafos) ? [...(registro(site.sobre).paragrafos as string[])] : [];
    if (!Number.isInteger(indice) || indice < 0 || indice >= paragrafos.length) return false;
    paragrafos[indice] = valor;
    patch.sobre = { ...(patch.sobre || {}), paragrafos };
    return true;
  }
  if ((m = caminho.match(/^contato\.(titulo|subtitulo)$/))) {
    patch.contato ||= {};
    patch.contato[m[1] as "titulo" | "subtitulo"] = valor;
    return true;
  }
  if ((m = caminho.match(/^servicos\.(titulo|subtitulo)$/))) {
    patch.servicos ||= {};
    patch.servicos[m[1] as "titulo" | "subtitulo"] = valor;
    return true;
  }
  if ((m = caminho.match(/^servicos\.itens\[(\d+)\]\.descricao$/))) {
    const item = lista(registro(site.servicos).itens)[Number(m[1])];
    if (!item?.nome) return false;
    patch.servicos ||= {};
    patch.servicos.atualizar ||= [];
    patch.servicos.atualizar.push({ nome: texto(item.nome, 60), descricao: valor });
    return true;
  }
  if (caminho === "faq.titulo") {
    patch.faq ||= {};
    patch.faq.titulo = valor;
    return true;
  }
  if ((m = caminho.match(/^faq\.itens\[(\d+)\]\.(pergunta|resposta)$/))) {
    const item = lista(registro(site.faq).itens)[Number(m[1])];
    if (!item?.pergunta) return false;
    patch.faq ||= {};
    patch.faq.itens ||= [];
    const anterior = texto(item.pergunta, 180);
    let atualizacao = patch.faq.itens.find((linha) => linha.de === anterior);
    if (!atualizacao) {
      atualizacao = { de: anterior };
      patch.faq.itens.push(atualizacao);
    }
    atualizacao[m[2] as "pergunta" | "resposta"] = valor;
    if (m[2] === "pergunta") atualizacao.de = anterior;
    return true;
  }
  if (caminho === "galeria.titulo") {
    patch.galeria ||= {};
    patch.galeria.titulo = valor;
    return true;
  }
  if ((m = caminho.match(/^galeria\.itens\[(\d+)\]\.legenda$/))) {
    patch.galeria ||= {};
    patch.galeria.atualizar ||= [];
    patch.galeria.atualizar.push({ indice: Number(m[1]), legenda: valor });
    return true;
  }
  if ((m = caminho.match(/^diferenciais\.itens\[(\d+)\]\.(titulo|descricao)$/))) {
    const item = lista(registro(site.diferenciais).itens)[Number(m[1])];
    if (!item?.titulo) return false;
    patch.diferenciais ||= {};
    patch.diferenciais.atualizar ||= [];
    let atualizacao = patch.diferenciais.atualizar.find((linha) => linha.de === texto(item.titulo, 60));
    if (!atualizacao) {
      atualizacao = { de: texto(item.titulo, 60) };
      patch.diferenciais.atualizar.push(atualizacao);
    }
    atualizacao[m[2] as "titulo" | "descricao"] = valor;
    return true;
  }
  if ((m = caminho.match(/^profissionais\.(titulo|subtitulo)$/))) {
    patch.profissionais ||= {};
    patch.profissionais[m[1] as "titulo" | "subtitulo"] = valor;
    return true;
  }
  if ((m = caminho.match(/^profissionais\.itens\[(\d+)\]\.descricao$/))) {
    const item = lista(registro(site.profissionais).itens)[Number(m[1])];
    if (!item?.nome) return false;
    patch.profissionais ||= {};
    patch.profissionais.atualizar ||= [];
    patch.profissionais.atualizar.push({ nome: texto(item.nome, 60), descricao: valor });
    return true;
  }
  if (caminho === "rodape.texto") {
    patch.rodape ||= {};
    patch.rodape.texto = valor;
    return true;
  }
  if ((m = caminho.match(/^seo\.(title|description)$/))) {
    patch.seo ||= {};
    patch.seo[m[1] as "title" | "description"] = valor;
    return true;
  }
  if (caminho === "header.botao_agendar") {
    patch.header ||= {};
    patch.header.botao_agendar = valor;
    return true;
  }
  if ((m = caminho.match(/^header\.menu\[(\d+)\]\.label$/))) {
    const item = lista(registro(site.header).menu)[Number(m[1])];
    if (!item?.id) return false;
    patch.header ||= {};
    patch.header.renomear ||= [];
    patch.header.renomear.push({ id: texto(item.id, 20), label: valor });
    return true;
  }
  if (caminho === "eventos.titulo") {
    patch.eventos ||= {};
    patch.eventos.titulo = valor;
    return true;
  }
  if ((m = caminho.match(/^eventos\.itens\[(\d+)\]\.(titulo|descricao)$/))) {
    const item = lista(registro(site.eventos).itens)[Number(m[1])];
    if (!item?.titulo) return false;
    patch.eventos ||= {};
    patch.eventos.atualizar ||= [];
    let atualizacao = patch.eventos.atualizar.find((linha) => linha.de === texto(item.titulo, 80));
    if (!atualizacao) {
      atualizacao = { de: texto(item.titulo, 80) };
      patch.eventos.atualizar.push(atualizacao);
    }
    atualizacao[m[2] as "titulo" | "descricao"] = valor;
    return true;
  }
  if (caminho === "promocoes.titulo") {
    patch.promocoes ||= {};
    patch.promocoes.titulo = valor;
    return true;
  }
  if ((m = caminho.match(/^promocoes\.itens\[(\d+)\]\.(titulo|descricao)$/))) {
    const item = lista(registro(site.promocoes).itens)[Number(m[1])];
    if (!item?.titulo) return false;
    patch.promocoes ||= {};
    patch.promocoes.atualizar ||= [];
    let atualizacao = patch.promocoes.atualizar.find((linha) => linha.de === texto(item.titulo, 80));
    if (!atualizacao) {
      atualizacao = { de: texto(item.titulo, 80) };
      patch.promocoes.atualizar.push(atualizacao);
    }
    atualizacao[m[2] as "titulo" | "descricao"] = valor;
    return true;
  }
  return false;
}

function indiceImagem(caminho: string) {
  const m = caminho.match(/^(hero|sobre|servicos|profissionais|eventos|promocoes|galeria)(?:\.itens\[(\d+)\])?\.(imagem|foto)$/);
  if (!m) return null;
  const tipo = m[1];
  const indice = Number(m[2] || 0);
  const slot =
    tipo === "servicos" ? "servico" :
    tipo === "profissionais" ? "profissional" :
    tipo === "galeria" ? "galeria" :
    tipo === "eventos" ? "evento" :
    tipo === "promocoes" ? "evento" :
    tipo;
  return { slot, indice };
}

function coletarPendencias(raw: unknown) {
  const itens = Array.isArray(raw) ? raw : [];
  return itens
    .map((item) => {
      const dado = registro(item);
      return `${texto(dado.caminho, 100) || "conteúdo"}: ${texto(dado.motivo, 220) || "confira este dado antes de publicar."}`;
    })
    .filter((item) => item !== "conteúdo: confira este dado antes de publicar.")
    .slice(0, 8);
}

function patchTemAlteracao(patch: PatchPedido) {
  return Object.entries(patch).some(([key, value]) => key !== "resumo" && key !== "aviso_estrutura" && value != null);
}

export async function revisarSiteFinal(entrada: {
  site: Registro;
  nicho: Nicho;
  pedido: string;
  fatosConfirmados: unknown;
  visual?: VisualConfig;
}) {
  const siteOriginal = structuredClone(entrada.site);
  const visual =
    entrada.visual && Object.keys(entrada.visual).length > 0
      ? entrada.visual
      : visualPadrao(entrada.nicho);
  const imagensOriginais = coletarImagens(siteOriginal);
  const patch: PatchPedido = {};
  const avisos: string[] = [];
  if (imagensOriginais.naoAuditaveis.length) {
    avisos.push(
      `${imagensOriginais.naoAuditaveis.length} imagem(ns) não puderam ser inspecionadas visualmente; confira esses espaços antes de publicar.`,
    );
  }

  try {
    const primeira = await revisarConteudoFinal({
      nicho: entrada.nicho,
      pedido: entrada.pedido,
      fatosConfirmados: entrada.fatosConfirmados,
      site: mapaVisivel(siteOriginal),
      imagens: imagensOriginais.imagens,
      timeoutMs: 18000,
    });
    let corrigidas = 0;
    const correcoes = Array.isArray(primeira.correcoes) ? primeira.correcoes : [];
    for (const item of correcoes) {
      if (corrigirTexto(siteOriginal, patch, registro(item) as CorrecaoTexto)) corrigidas += 1;
      else {
        const caminho = texto(registro(item).caminho, 100);
        if (caminho) avisos.push(`Revisão sinalizou ${caminho}, mas não apliquei uma correção automática segura.`);
      }
    }

    const imagensRuins = Array.isArray(primeira.imagens_problematicas) ? primeira.imagens_problematicas : [];
    const substituicoes: { slot: string; indice: number; busca: string }[] = [];
    for (const item of imagensRuins) {
      const achado = registro(item) as AchadoImagem;
      const posicao = indiceImagem(texto(achado.caminho, 120));
      if (!posicao || achado.confianca !== "alta") {
        if (achado.caminho) avisos.push(`Imagem a confirmar: ${texto(achado.caminho, 100)}.`);
        continue;
      }
      if (posicao.slot === "profissional") {
        patch.midia ||= {};
        patch.midia.fotos ||= [];
        patch.midia.fotos.push({ slot: "profissional", indice: posicao.indice, limpar: true });
        avisos.push("Removi um retrato de banco de imagens associado a uma pessoa; envie a foto correta da equipe.");
        continue;
      }
      if (substituicoes.length >= 8) {
        avisos.push(`Imagem em ${texto(achado.caminho, 100)} precisa de revisão manual; limite de substituições automáticas atingido.`);
        continue;
      }
      substituicoes.push({ ...posicao, busca: "revisão final de contexto" });
    }

    if (substituicoes.length) {
      const imagensResolvidas = await resolverMidia({
        midia: { fotos: substituicoes },
      }, entrada.nicho);
      patch.midia = {
        ...(patch.midia || {}),
        ...(imagensResolvidas.midia || {}),
      };
      if (imagensResolvidas.aviso_estrutura) avisos.push(texto(imagensResolvidas.aviso_estrutura, 280));
    }

    const resultadoInicial = aplicarPedido(structuredClone(siteOriginal), visual, patch, entrada.nicho);
    let siteFinal = resultadoInicial.site;
    if (patchTemAlteracao(patch)) {
      try {
        const imagensFinais = coletarImagens(siteFinal);
        if (imagensFinais.naoAuditaveis.length) {
          avisos.push(
            `${imagensFinais.naoAuditaveis.length} imagem(ns) após as correções continuam sem inspeção visual.`,
          );
        }
        const verificacao = await revisarConteudoFinal({
          nicho: entrada.nicho,
          pedido: entrada.pedido,
          fatosConfirmados: entrada.fatosConfirmados,
          site: mapaVisivel(siteFinal),
          imagens: imagensFinais.imagens,
          timeoutMs: 12000,
        });
        const pendencias = coletarPendencias(verificacao.pendencias);
        if (pendencias.length) avisos.push(...pendencias);
        if (
          (Array.isArray(verificacao.correcoes) && verificacao.correcoes.length) ||
          (Array.isArray(verificacao.imagens_problematicas) && verificacao.imagens_problematicas.length)
        ) {
          avisos.push("A revisão encontrou pontos que ainda precisam de confirmação humana antes da publicação.");
        }
        return {
          site: siteFinal,
          visual: resultadoInicial.visual,
          patch,
          aviso: Array.from(new Set(avisos)).slice(0, 8).join(" "),
          revisado: imagensOriginais.naoAuditaveis.length === 0,
          resumo: texto(verificacao.resumo || primeira.resumo, 220),
        };
      } catch {
        avisos.push("A edição foi aplicada, mas a confirmação da revisão final não terminou. Confira o conteúdo antes de publicar.");
        return { site: siteFinal, visual: resultadoInicial.visual, patch, aviso: avisos.join(" "), revisado: false, resumo: "" };
      }
    }

    avisos.push(...coletarPendencias(primeira.pendencias));
    return {
      site: siteFinal,
      visual: resultadoInicial.visual,
      patch,
      aviso: Array.from(new Set(avisos)).slice(0, 8).join(" "),
      revisado: imagensOriginais.naoAuditaveis.length === 0,
      resumo: texto(primeira.resumo, 220),
    };
  } catch {
    return {
      site: siteOriginal,
      visual,
      patch: {},
      aviso: "Não consegui concluir a revisão final da IA. O conteúdo não foi certificado; confira os dados antes de publicar.",
      revisado: false,
      resumo: "",
    };
  }
}
