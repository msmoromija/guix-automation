import { NextRequest, NextResponse } from "next/server";
import { normalizarCopia } from "@/lib/estudio/copia-viva";
import { tituloVenha } from "@/lib/estudio/aplicar";
import { patchRapido, type PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { AVISO_ESTRUTURA, soEstrutura } from "@/lib/estudio/pedido-fechado";
import { resolverMidia } from "@/lib/estudio/resolver-midia";
import { escreverCopiaSimulacao, executarPedido } from "@/lib/media/openai";
import { carregarExemplo } from "@/lib/automacao/carregar-exemplo";
import { TIPOGRAFIAS, visualPadrao, type VisualConfig } from "@/lib/estudio/visual";
import { revisarSiteFinal } from "@/lib/estudio/revisao-final";
import type { Nicho } from "@/lib/media/tipos";
import {
  checklistDoNicho,
  detectarNichoSolicitado,
  pedidoApenasTrocaNicho,
  prepararModeloParaTransicao,
  type DadosFornecidos,
} from "@/lib/estudio/troca-nicho";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  "generico",
]);
const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string, bucket: string) {
  const agora = Date.now();
  const chave = `${ip}:${bucket}`;
  const cur = hits.get(chave);
  if (!cur || cur.reset < agora) {
    hits.set(chave, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 40) return false;
  cur.n += 1;
  return true;
}

function listaServicos(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const item = s as { nome?: string; preco?: string; duracao?: string; descricao?: string };
      return {
        nome: String(item.nome || "").trim(),
        preco: String(item.preco || "").trim(),
        duracao: String(item.duracao || "").trim(),
        descricao: String(item.descricao || "").trim(),
      };
    })
    .filter((s) => s.nome && s.nome !== "Novo serviço")
    .slice(0, 12);
}

function patchTemConteudo(patch: PatchPedido | null | undefined) {
  if (!patch || typeof patch !== "object") return false;
  return Boolean(
    patch.resumo ||
      patch.nicho ||
      patch.hero ||
      patch.sobre ||
      patch.galeria ||
      patch.seo ||
      patch.contato ||
      patch.servicos ||
      patch.faq ||
      patch.eventos ||
      patch.promocoes ||
      patch.avisos ||
      patch.redes ||
      patch.visual ||
      patch.marca ||
      patch.empresa ||
      patch.diferenciais ||
      patch.header ||
      patch.rodape ||
      patch.profissionais ||
      patch.midia?.foto?.src ||
      patch.midia?.foto?.busca ||
      (Array.isArray(patch.midia?.fotos) && patch.midia.fotos.some((f) => f?.src || (f as { busca?: string }).busca || f?.limpar)) ||
      patch.midia?.logo?.src,
  );
}

function semAcento(valor: unknown) {
  return String(valor || "").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function registro(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
}

function listaDeRegistros(valor: unknown) {
  return Array.isArray(valor) ? valor.map(registro) : [];
}

type FotoPatch = NonNullable<NonNullable<PatchPedido["midia"]>["fotos"]>[number];

function pedidoTrocaTodasAsFotos(pedido: string) {
  const texto = semAcento(pedido);
  return (
    /\b(foto|fotos|imagem|imagens|fotografia|fotografias|midia)\b/.test(texto) &&
    /\b(todas?|todos|tudo|cada|inteiro|inteira|geral)\b|site inteiro|site todo|em todo o site/.test(texto)
  );
}

function slotsDeTodasAsFotos(
  contexto: unknown,
  nicho: string,
  fotosIA: FotoPatch[] | undefined,
  modeloNovo?: Record<string, unknown>,
) {
  const atual = registro(contexto);
  const motor = registro(atual.motor);
  const disponiveis = registro(motor.fotos_disponiveis);
  const fonte = modeloNovo || atual;
  const meta = registro(fonte.meta);
  const nichoFoto = semAcento(meta.nicho || (modeloNovo ? nicho : motor.nicho_atual || nicho));
  const termosNicho: Record<string, string> = {
    barbearia: "barbershop haircut",
    salao: "hair salon styling",
    estetica: "beauty skincare spa",
    petshop: "pet grooming",
    academia: "fitness training",
    contabilidade: "accounting office",
    advocacia: "law office",
    dentista: "dental clinic",
    clinica: "medical clinic",
    psicologia: "therapy counseling",
    nutricionista: "nutrition healthy food",
    generico: "small business",
  };
  const termoBase = termosNicho[nichoFoto] || "small business";
  const contagem = (valor: unknown, fallback: number) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.max(0, Math.min(40, Math.floor(numero))) : fallback;
  };
  const imagemSrc = (bloco: unknown) => Boolean(registro(registro(bloco).imagem).src);
  const fotosExistentes = modeloNovo
    ? {}
    : disponiveis;
  const hero = registro(fonte.hero);
  const sobre = registro(fonte.sobre);
  const galeria = listaDeRegistros(registro(fonte.galeria).itens);
  const servicos = listaDeRegistros(registro(fonte.servicos).itens);
  const profissionais: (Record<string, unknown> & { indiceNoSite: number })[] = listaDeRegistros(registro(fonte.profissionais).itens)
    .map((item, indice) =>
      Object.assign(item, {
        indiceNoSite: modeloNovo
          ? indice
          : Number.isInteger(Number(item.indice))
            ? Number(item.indice)
            : indice,
      }),
    )
    .filter((item) => String(item.nome || "").trim() && semAcento(item.nome) !== "sem preferencia" && semAcento(item.nome) !== "novo nome");
  const eventos = listaDeRegistros(registro(fonte.eventos).itens).slice(0, 4);
  const total = (tipo: string, lista: Record<string, unknown>[], fallback = 0) =>
    modeloNovo || lista.length ? lista.length : contagem(fotosExistentes[tipo], fallback);

  const porSlot = new Map<string, FotoPatch>();
  for (const foto of fotosIA || []) {
    if (foto?.slot) porSlot.set(`${foto.slot}:${Number(foto.indice) || 0}`, foto);
  }
  const unico = (slot: string, indice: number, termo: string) => {
    const pedidoIA = porSlot.get(`${slot}:${indice}`);
    return {
      slot,
      indice,
      busca: String(pedidoIA?.busca || termo).trim().slice(0, 80),
    };
  };

  const saida: FotoPatch[] = [];
  if ((modeloNovo && imagemSrc(hero)) || (!modeloNovo && Boolean(fotosExistentes.hero))) {
    saida.push(unico("hero", 0, `${termoBase} website hero editorial photo`));
  }
  if ((modeloNovo && imagemSrc(sobre)) || (!modeloNovo && Boolean(fotosExistentes.sobre))) {
    saida.push(unico("sobre", 0, `${termoBase} professional workspace photo`));
  }
  const quantidadeGaleria = total("galeria", galeria, 0);
  for (let indice = 0; indice < quantidadeGaleria; indice += 1) {
    saida.push(unico("galeria", indice, `${termoBase} gallery scene ${indice + 1}`));
  }
  const quantidadeServicos = total("servicos", servicos, 0);
  for (let indice = 0; indice < quantidadeServicos; indice += 1) {
    const nome = String(servicos[indice]?.nome || "").trim();
    saida.push(unico("servico", indice, `${nome} ${termoBase} service photo ${indice + 1}`));
  }
  const quantidadeProfissionais = total("profissionais", profissionais, 0);
  for (let indice = 0; indice < quantidadeProfissionais; indice += 1) {
    const profissional = profissionais[indice] || {};
    const descricao = String(profissional.cargo || "professional");
    const indiceNoSite = Number(profissional.indiceNoSite);
    saida.push(unico("profissional", Number.isInteger(indiceNoSite) ? indiceNoSite : indice, `${descricao} ${termoBase} workplace portrait`));
  }
  const quantidadeEventos = total("eventos", eventos, 0);
  for (let indice = 0; indice < quantidadeEventos; indice += 1) {
    const titulo = String(eventos[indice]?.titulo || "").trim();
    saida.push(unico("evento", indice, `${titulo} ${termoBase} event photo ${indice + 1}`));
  }
  return saida.slice(0, 40);
}

async function completarTodasAsFotos(patch: PatchPedido, pedido: string, contexto: unknown, nichoAtual: Nicho) {
  if (!pedidoTrocaTodasAsFotos(pedido)) return patch;
  let modeloNovo: Record<string, unknown> | undefined;
  const nichoPedido = String(patch.nicho || "").trim() as Nicho;
  if (nichoPedido && nichoPedido !== nichoAtual && NICHOS.has(nichoPedido)) {
    try {
      modeloNovo = prepararModeloParaTransicao(await carregarExemplo(nichoPedido), nichoPedido);
    } catch {
      // Keep the transition context; never expand photo slots from the previous niche.
    }
  }
  const fotos = slotsDeTodasAsFotos(contexto, nichoPedido || nichoAtual, patch.midia?.fotos, modeloNovo);
  if (!fotos.length) {
    return {
      ...patch,
      resumo: "Não encontrei espaços de imagem disponíveis para substituir.",
      aviso_estrutura: [patch.aviso_estrutura, "Nenhuma imagem existente foi encontrada no modelo atual."].filter(Boolean).join(" "),
      midia: { ...(patch.midia || {}), fotos: [] },
    };
  }
  return {
    ...patch,
    resumo: patch.resumo || `Vou substituir as imagens dos ${fotos.length} espaços do site.`,
    midia: { ...(patch.midia || {}), foto: undefined, fotos },
  };
}

function contextoParaPedido(contexto: unknown, pedido: string) {
  if (!contexto || typeof contexto !== "object") return contexto;
  const atual = structuredClone(contexto) as Record<string, unknown>;
  const motor = (atual.motor || {}) as Record<string, unknown>;
  const pedeMarca = /\b(logo|marca|icone|emblema|wordmark)\b/i.test(semAcento(pedido));
  if (!pedeMarca) {
    delete atual.marca;
    for (const chave of [
      "layouts_marca",
      "fontes_marca",
      "cores_marca",
      "icones_marca",
      "icones_recomendados_marca",
      "emblemas_marca",
      "arquivos_marca",
      "marca_pode_gerar_modelos",
    ]) {
      delete motor[chave];
    }
  }
  if (!/\b(foto|fotos|imagem|imagens|galeria|midia|capa|banner)\b/i.test(semAcento(pedido))) {
    delete motor.fotos_disponiveis;
  }
  atual.motor = motor;
  return atual;
}

function dadosFornecidos(raw: unknown): DadosFornecidos {
  const dados = registro(raw);
  const texto = (chave: string, limite: number) => String(dados[chave] || "").trim().slice(0, limite);
  const redesRaw = registro(dados.redes);
  const redes = Object.fromEntries(
    Object.entries(redesRaw)
      .filter(([id, url]) => /^[a-z0-9_-]{2,24}$/i.test(id) && typeof url === "string" && url.trim())
      .slice(0, 8)
      .map(([id, url]) => [id, String(url).trim().slice(0, 240)]),
  );
  const expediente = Array.isArray(dados.expediente)
    ? dados.expediente
        .slice(0, 7)
        .map((item) => registro(item))
        .filter((item) => typeof item.dia === "string" && typeof item.label === "string" && Array.isArray(item.intervalos))
        .map((item) => ({
          dia: String(item.dia).slice(0, 3),
          label: String(item.label).slice(0, 20),
          intervalos: (item.intervalos as unknown[]).filter((hora) => typeof hora === "string" && /^\d{2}:\d{2}$/.test(hora)).slice(0, 24) as string[],
        }))
    : [];
  return {
    nome: texto("nome", 80),
    slogan: texto("slogan", 120),
    whatsapp: texto("whatsapp", 30),
    email: texto("email", 100),
    cidade: texto("cidade", 80),
    estado: texto("estado", 3),
    logradouro: texto("logradouro", 100),
    numero: texto("numero", 20),
    bairro: texto("bairro", 80),
    cep: texto("cep", 12),
    redes,
    horario: texto("horario", 160),
    expediente,
    enderecoCompleto: texto("enderecoCompleto", 200),
  };
}

function contextoDoModeloDestino(
  modelo: Record<string, unknown>,
  contextoAtual: unknown,
  nicho: Nicho,
  dados: DadosFornecidos,
) {
  const atual = registro(contextoAtual);
  const motorAtual = registro(atual.motor);
  const empresa = registro(modelo.empresa);
  const hero = registro(modelo.hero);
  const sobre = registro(modelo.sobre);
  const servicos = registro(modelo.servicos);
  const faq = registro(modelo.faq);
  const motor = registro(structuredClone(motorAtual));
  motor.nicho_atual = nicho;
  motor.transicao_nicho = true;
  motor.checklist_nicho = checklistDoNicho(nicho);
  motor.fotos_disponiveis = {
    hero: Boolean(registro(hero.imagem).src),
    sobre: Boolean(registro(sobre.imagem).src),
    galeria: listaDeRegistros(registro(modelo.galeria).itens).length,
    servicos: listaDeRegistros(servicos.itens).length,
    profissionais: 0,
    eventos: 0,
  };
  return {
    nome: dados.nome || "",
    slogan: dados.slogan || "",
    whatsapp: dados.whatsapp || "",
    email: dados.email || "",
    horario: dados.horario || "",
    endereco: [dados.logradouro, dados.numero, dados.bairro, dados.cidade, dados.estado].filter(Boolean).join(", "),
    hero: { titulo: String(hero.titulo || ""), subtitulo: String(hero.subtitulo || "") },
    sobre: {
      titulo: String(sobre.titulo || ""),
      paragrafos: Array.isArray(sobre.paragrafos) ? sobre.paragrafos : [],
    },
    servicos: listaDeRegistros(servicos.itens).map((item) => ({
      nome: String(item.nome || ""),
      descricao: String(item.descricao || ""),
      preco: "Consulte valores",
      duracao: "A confirmar",
    })),
    faq: listaDeRegistros(faq.itens).map((item) => ({
      pergunta: String(item.pergunta || ""),
      resposta: String(item.resposta || ""),
    })),
    eventos: [],
    profissionais: [],
    diferenciais: listaDeRegistros(registro(modelo.diferenciais).itens).map((item) => ({
      titulo: String(item.titulo || ""),
      descricao: String(item.descricao || ""),
    })),
    motor,
    visual: visualPadrao(nicho),
    campos_vazios: [],
    dados_fornecidos: {
      nome: dados.nome || "",
      whatsapp: dados.whatsapp || "",
      email: dados.email || "",
      endereco: registro(empresa.endereco).completo || "",
    },
  };
}

function reforcarControlesVisuais(pedido: string, patch: PatchPedido): PatchPedido {
  const texto = semAcento(pedido);
  const visual = { ...(patch.visual || {}) };

  if (/\b(fonte|fontes|tipografia|tipografias|letra|letras)\b/.test(texto)) {
    const escolha = TIPOGRAFIAS.find((tipo) =>
      [tipo.id, tipo.nome, tipo.font_heading, tipo.font_body].some((valor) => texto.includes(semAcento(valor))),
    );
    if (escolha) visual.tipografiaId = escolha.id;
  }

  if (/\b(cabecalho|header)\b/.test(texto)) {
    if (/menu.{0,20}(abaixo|embaixo)|abaixo.{0,20}menu/.test(texto)) visual.cabecalho = "menu-abaixo";
    else if (/direita|direito/.test(texto)) visual.cabecalho = "logo-direita";
    else if (/esquerda|esquerdo/.test(texto)) visual.cabecalho = "logo-esquerda";
    else if (/compact/.test(texto)) visual.cabecalho = "compacto";
    else if (/centraliz|no centro/.test(texto)) visual.cabecalho = "centralizado";
    else if (/slogan|frase/.test(texto)) visual.cabecalho = "logo-slogan";
  }

  if (/\b(rodape|footer)\b/.test(texto)) {
    if (/divid|duas colunas|lado a lado/.test(texto)) visual.rodapeLayout = "dividido";
    else if (/empilhad|vertical/.test(texto)) visual.rodapeLayout = "empilhado";
    else if (/minim|compact/.test(texto)) visual.rodapeLayout = "minimo";
    else if (/centraliz|no centro/.test(texto)) visual.rodapeLayout = "centralizado";
  }

  const cores: Array<[RegExp, string]> = [
    [/\b(vermelh[oa]s?|red)\b/, "#DC2626"],
    [/\b(azul|blue)\b/, "#2563EB"],
    [/\b(verde|green)\b/, "#16A34A"],
    [/\b(preto|preta|black)\b/, "#111111"],
    [/\b(branco|branca|white)\b/, "#FFFFFF"],
    [/\b(dourad[oa]|gold)\b/, "#C6A15B"],
    [/\b(rosa|pink)\b/, "#DB2777"],
    [/\b(roxo|roxa|purple)\b/, "#7C3AED"],
  ];
  const cor = texto.match(/#[0-9a-f]{6}\b/i)?.[0] || cores.find(([expressao]) => expressao.test(texto))?.[1];
  if (cor) {
    if (/\b(titulo|titulos|heading)\b/.test(texto)) visual.cor_titulos = cor;
    else if (/\b(secundari[oa]s?|suave|discret[oa]s?)\b/.test(texto)) visual.cor_texto_suave = cor;
    else if (/\b(texto|textos|letra|letras|fonte|fontes)\b/.test(texto)) visual.cor_texto = cor;
  }

  return JSON.stringify(visual) === JSON.stringify(patch.visual || {}) ? patch : { ...patch, visual };
}

function atualizacaoServicoIncompleta(pedido: string, patch: PatchPedido, contexto: unknown) {
  const ctx = (contexto || {}) as { servicos?: { nome?: string }[] };
  const itens = Array.isArray(ctx.servicos) ? ctx.servicos : [];
  const normalizar = (valor: unknown) =>
    String(valor || "")
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const pedidoNormalizado = normalizar(pedido);
  const alvo = itens.find((item) => {
    const nome = normalizar(item.nome);
    return nome.length >= 3 && pedidoNormalizado.includes(nome);
  });
  if (!alvo) return false;

  const campo = /\b(dura[cç][aã]o|tempo|minutos?|horas?)\b/i.test(pedido)
    ? "duracao_label"
    : /\b(pre[cç]o|valor|custa)\b/i.test(pedido)
      ? "preco_label"
      : /\b(descri[cç][aã]o|detalh|explique)\b/i.test(pedido)
        ? "descricao"
        : /\b(renome|novo nome|nome para)\b/i.test(pedido)
          ? "novo_nome"
          : "";
  const atualizacao = (patch.servicos?.atualizar || []).find(
    (item) => normalizar(item.nome) === normalizar(alvo.nome),
  );
  const camposEditaveis = ["novo_nome", "descricao", "preco_label", "duracao_label"] as const;
  const trouxeCampo = atualizacao && camposEditaveis.some((chave) => String(atualizacao[chave] || "").trim());
  return !trouxeCampo || Boolean(campo && !String(atualizacao?.[campo] || "").trim());
}

/** Garante efeito real quando o cliente pede alinhamento do logo (a IA às vezes só muda o resumo). */
function reforcarAlinhamentoLogo(pedido: string, patch: PatchPedido): PatchPedido {
  if (!/\balinh/i.test(pedido)) return patch;
  if (!/\b(logo|marca|slogan|cabe[cç]alho|texto)\b/i.test(pedido)) return patch;
  return {
    ...patch,
    visual: {
      ...(patch.visual || {}),
      logoAlinhamento: "centro",
      cabecalho: patch.visual?.cabecalho || "logo-slogan",
    },
    resumo: patch.resumo?.trim() || "Alinhei o texto do logo ao centro com a marca.",
  };
}

async function montarPatch(
  nichoAtual: Nicho,
  pedido: string,
  contexto: unknown,
  dados: DadosFornecidos,
) {
  const nichoDestino = detectarNichoSolicitado(pedido);
  const apenasTroca = nichoDestino ? pedidoApenasTrocaNicho(pedido, nichoDestino) : false;
  let nichoExecucao = nichoAtual;
  let modeloNicho: Record<string, unknown> | undefined;
  let contextoBase = contexto;

  if (nichoDestino && nichoDestino !== nichoAtual) {
    const carregado = await carregarExemplo(nichoDestino);
    modeloNicho = prepararModeloParaTransicao(carregado, nichoDestino, dados);
    contextoBase = contextoDoModeloDestino(modeloNicho, contexto, nichoDestino, dados);
    nichoExecucao = nichoDestino;
    if (apenasTroca) {
      const patch: PatchPedido = {
        nicho: nichoDestino,
        resumo: `Modelo alterado para ${nichoDestino}. Mantive os dados informados e deixei valores comerciais para confirmação.`,
      };
      return {
        patch,
        modeloNicho,
        contextoIA: contextoBase,
        via: "motor" as const,
      };
    }
  }

  const contextoIA = contextoParaPedido(contextoBase, pedido);
  const pedidoIA = modeloNicho
    ? `TRANSIÇÃO DE NICHO OBRIGATÓRIA: use somente o modelo de destino e o checklist em atual.motor.checklist_nicho. Não reutilize serviços, equipe, preços, horários, contatos, eventos ou conteúdo demonstrativo do nicho anterior. Preserve somente dados_fornecidos. Não crie nomes de profissionais, preços, duração, endereço ou horários ausentes. Sugestões de serviços são possibilidades e devem permanecer sem valores confirmados.\n\nPedido do cliente: ${pedido}`
    : pedido;
  const resposta = (await executarPedido({
    nicho: nichoExecucao,
    pedido: pedidoIA,
    contexto: contextoIA,
    timeoutMs: 30000,
  })) as PatchPedido;
  const alinhado = reforcarAlinhamentoLogo(pedido, resposta);
  const controles = reforcarControlesVisuais(pedido, alinhado);
  const patchTransicao = modeloNicho ? { ...controles, nicho: nichoExecucao } : controles;
  const completo = await completarTodasAsFotos(patchTransicao, pedido, contextoIA, nichoExecucao);
  return {
    patch: await resolverMidia(completo, String(nichoExecucao)),
    modeloNicho,
    contextoIA,
    via: "openai" as const,
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  try {
    const body = await req.json();
    const modo = String(body.modo || "");
    if (!rateLimit(ip, modo === "revisar-final" ? "revisao" : "pedido")) {
      return NextResponse.json({ erro: "Muitos pedidos de texto nesta hora. Edite direto no quadro por enquanto." }, { status: 429 });
    }
    const nome = String(body.nome || "").trim();
    const nicho = String(body.nicho || "") as Nicho;
    if (!NICHOS.has(nicho)) {
      return NextResponse.json({ erro: "Nicho inválido." }, { status: 400 });
    }

    if (modo === "revisar-final") {
      const site = registro(body.site);
      if (!Object.keys(site).length) {
        return NextResponse.json({ erro: "Site final ausente para revisão." }, { status: 400 });
      }
      try {
        const revisao = await revisarSiteFinal({
          site,
          nicho,
          pedido: String(body.pedido || "").slice(0, 900),
          fatosConfirmados: body.fatosConfirmados || {},
          visual: registro(body.visual) as unknown as VisualConfig,
        });
        return NextResponse.json({
          patch: revisao.patch,
          aviso: revisao.aviso,
          resumo: revisao.resumo,
          revisado: revisao.revisado,
          via: "openai-revisao",
        });
      } catch {
        return NextResponse.json({
          patch: {},
          aviso: "Não consegui concluir a revisão final da IA. Confira os dados e as imagens antes de publicar.",
          revisado: false,
          via: "nenhum",
        });
      }
    }

    const cidade = String(body.cidade || "").trim();
    const bairro = String(body.bairro || "").trim();
    const servicos = listaServicos(body.servicos);
    if (body.modo === "executar") {
      const pedido = String(body.pedido || "").trim().slice(0, 900);
      if (pedido.length < 3) return NextResponse.json({ aviso: "Escreva o que quer mudar.", patch: null, via: "nenhum" });
      if (soEstrutura(pedido)) return NextResponse.json({ aviso: AVISO_ESTRUTURA, patch: null, via: "nenhum" });
      const dados = dadosFornecidos(body.dadosFornecidos);

      // OpenAI primeiro — atalho só se a IA falhar de verdade.
      try {
        const geracao = await montarPatch(nicho, pedido, body.contexto, dados);
        let patch = geracao.patch;
        if (!patchTemConteudo(patch)) {
          return NextResponse.json({
            patch: null,
            aviso: "A IA não retornou campos editáveis. Reformule o pedido em uma frase objetiva.",
            via: "nenhum",
          });
        }
        if (atualizacaoServicoIncompleta(pedido, patch, geracao.contextoIA)) {
          const corrigido = await executarPedido({
            nicho: (patch.nicho as Nicho) || nicho,
            pedido: `${pedido}\n\nCORREÇÃO: sua resposta anterior não aplicou o pedido. O serviço existente foi identificado pelo nome no contexto. Retorne servicos.atualizar com nome exatamente igual ao serviço atual e preencha o campo solicitado (${(/\b(dura[cç][aã]o|tempo|minutos?|horas?)\b/i.test(pedido) ? "duracao_label" : /\b(pre[cç]o|valor|custa)\b/i.test(pedido) ? "preco_label" : /\b(descri[cç][aã]o|detalh|explique)\b/i.test(pedido) ? "descricao" : "campo editável")}); não declare sucesso no resumo se o campo não estiver preenchido.`,
            contexto: geracao.contextoIA,
            timeoutMs: 30000,
          }) as PatchPedido;
          patch = {
            ...patch,
            servicos: corrigido.servicos,
            resumo: corrigido.resumo || patch.resumo,
          };
        }
        if (patchTemConteudo(patch)) {
          return NextResponse.json({
            patch,
            ...(geracao.modeloNicho ? { modelo_nicho: geracao.modeloNicho } : {}),
            resumo: String(patch.resumo || "").slice(0, 220),
            aviso: String(patch.aviso_estrutura || "").replace(/\s+/g, " ").trim().slice(0, 280),
            via: geracao.via,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const nichoDestino = detectarNichoSolicitado(pedido);
        if (nichoDestino && nichoDestino !== nicho) {
          try {
            const modeloNicho = prepararModeloParaTransicao(await carregarExemplo(nichoDestino), nichoDestino, dados);
            const patch: PatchPedido = {
              nicho: nichoDestino,
              resumo: `Modelo alterado para ${nichoDestino}.`,
            };
            return NextResponse.json({
              patch,
              modelo_nicho: modeloNicho,
              resumo: patch.resumo,
              aviso: "A IA não respondeu; alterei o modelo. As demais alterações do pedido não foram aplicadas.",
              via: "motor",
            });
          } catch {
            // Report the original generation error if the destination template is unavailable.
          }
        }
        const rapido = patchRapido(pedido);
        if (rapido) {
          return NextResponse.json({
            patch: rapido,
            aviso: "OpenAI falhou neste instante; apliquei o atalho local do que deu.",
            resumo: rapido.resumo || "",
            via: "atalho",
          });
        }
        const aviso = /abort/i.test(msg)
          ? "A OpenAI demorou demais. Peça de novo em uma frase."
          : /OPENAI_API_KEY/i.test(msg)
            ? "OPENAI_API_KEY ausente neste ambiente."
            : "Não consegui falar com a OpenAI agora. Tente de novo.";
        return NextResponse.json({ patch: null, aviso, via: "nenhum" });
      }

      const rapido = patchRapido(pedido);
      if (rapido) {
        return NextResponse.json({
          patch: rapido,
          aviso: "A IA não montou o patch; apliquei só o atalho local.",
          resumo: rapido.resumo || "",
          via: "atalho",
        });
      }
      return NextResponse.json({
        patch: null,
        aviso: "A OpenAI respondeu vazia. Peça de novo, bem objetivo.",
        via: "nenhum",
      });
    }

    if (nome.length < 2) return NextResponse.json({ erro: "Informe o nome do negócio." }, { status: 400 });

    const gerado = await escreverCopiaSimulacao({
      nicho,
      nome,
      cidade,
      bairro,
      slogan: String(body.slogan || "").trim(),
      tom: String(body.tom || "").trim(),
      destaque: String(body.destaque || "").trim(),
      horario: String(body.horario || "").trim(),
      servicos,
      profissionais: Array.isArray(body.profissionais) ? body.profissionais : [],
    });

    const copia = normalizarCopia(gerado.copia);
    if ((bairro || cidade) && copia.contato && !copia.contato.titulo) {
      copia.contato.titulo = tituloVenha(bairro, cidade) || "";
    }
    const aviso = String(gerado.aviso || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);
    return NextResponse.json({ copia, aviso, via: "openai" });
  } catch {
    return NextResponse.json(
      { erro: "Não deu para escrever agora. O quadro continua editável.", copia: null, aviso: "", via: "nenhum" },
      { status: 200 },
    );
  }
}
