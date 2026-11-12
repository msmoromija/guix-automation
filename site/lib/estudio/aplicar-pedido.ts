import { aplicarSrcNoSlot, minutosDeRotulo, precoDeRotulo, sanitizarFotoSrc, sanitizarLogoSrc, tituloVenha, type LinhaServico } from "@/lib/estudio/aplicar";
import { horarioDireto, telefoneDireto } from "@/lib/estudio/pedido-fechado";
import type { CopiaViva } from "@/lib/estudio/copia-viva";
import { arquivosDoNicho } from "@/lib/estudio/biblioteca-arquivos";
import { emblemasDoNicho } from "@/lib/estudio/emblemas";
import { nichos } from "@/lib/nichos";
import { DIAS_SEMANA, normalizarDiaExpediente, type DiaExpediente } from "@/lib/estudio/expediente";
import { iconePorId, iconesDoNicho, idsIconesPermitidos } from "@/lib/estudio/icones-marca";
import { CORES_LOGO, FONTES_LOGO, LAYOUTS_LOGO, uriMarcaViva, type LayoutLogo } from "@/lib/estudio/logo-spec";
import {
  PALETAS,
  TIPOGRAFIAS,
  aplicarVisualNoTema,
  type CabecalhoLayout,
  type OrigemMarca,
  type VisualConfig,
} from "@/lib/estudio/visual";

const MENU_IDS = ["inicio", "sobre", "servicos", "profissionais", "promocoes", "faq", "contato"] as const;
const ROTULO_MENU: Record<(typeof MENU_IDS)[number], string> = {
  inicio: "Início",
  sobre: "Sobre",
  servicos: "Serviços",
  profissionais: "Equipe",
  promocoes: "Promoções",
  faq: "Dúvidas",
  contato: "Contato",
};

const UF: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

export type AbrirPedido = "" | "logo" | "hero" | "sobre" | "galeria";

export type PatchPedido = {
  aviso_estrutura?: string;
  resumo?: string;
  abrir?: AbrirPedido;
  /** Troca o modelo/nicho base do site (ex.: "é uma nutricionista, altere o modelo"). */
  nicho?: string;
  empresa?: {
    nome?: string;
    whatsapp?: string;
    email?: string;
    slogan?: string;
    horario_resumo?: string;
    cnpj?: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    };
    /** Expediente por dia da semana (Grade do cliente). */
    expediente?: {
      dia?: string;
      aberto?: boolean;
      inicio?: string;
      fim?: string;
      pausa?: boolean;
      pausaInicio?: string;
      pausaFim?: string;
    }[];
  };
  hero?: { titulo?: string; subtitulo?: string; botao_principal?: string; botao_secundario?: string };
  sobre?: { titulo?: string; paragrafos?: string[] };
  galeria?: {
    titulo?: string;
    atualizar?: { indice?: number; legenda?: string }[];
  };
  seo?: { title?: string; description?: string };
  contato?: { titulo?: string; subtitulo?: string };
  faq?: {
    titulo?: string;
    limpar?: boolean;
    remover?: string[];
    acrescentar?: { pergunta?: string; resposta?: string }[];
    itens?: { de?: string; pergunta?: string; resposta?: string }[];
  };
  eventos?: {
    titulo?: string;
    limpar?: boolean;
    atualizar?: { de?: string; titulo?: string; descricao?: string }[];
    acrescentar?: { titulo?: string; descricao?: string; data_label?: string; horario?: string }[];
    itens?: { titulo?: string; descricao?: string; data_label?: string; horario?: string }[];
  };
  promocoes?: {
    titulo?: string;
    limpar?: boolean;
    atualizar?: { de?: string; titulo?: string; descricao?: string; validade_label?: string }[];
  };
  diferenciais?: {
    titulo?: string;
    atualizar?: { de?: string; titulo?: string; descricao?: string }[];
    remover?: string[];
    acrescentar?: { titulo?: string; descricao?: string }[];
  };
  servicos?: {
    titulo?: string;
    subtitulo?: string;
    sem_preco?: boolean;
    remover?: string[];
    acrescentar?: { nome?: string; descricao?: string; preco_label?: string; duracao_label?: string }[];
    atualizar?: { nome?: string; novo_nome?: string; descricao?: string; preco_label?: string; duracao_label?: string }[];
  };
  profissionais?: {
    titulo?: string;
    subtitulo?: string;
    ocultar?: boolean;
    limpar?: boolean;
    remover?: string[];
    acrescentar?: { nome?: string; cargo?: string; descricao?: string; whatsapp?: string; email?: string }[];
    atualizar?: { nome?: string; novo_nome?: string; cargo?: string; descricao?: string; whatsapp?: string; email?: string }[];
  };
  avisos?: {
    limpar?: boolean;
    itens?: { titulo?: string; descricao?: string; data_label?: string }[];
  };
  redes?: Record<string, string>;
  visual?: {
    paletaId?: string;
    tipografiaId?: string;
    cabecalho?: string;
    aparencia?: string;
    cor_accent?: string;
    cor_fundo?: string;
    cor_titulos?: string;
    cor_texto?: string;
    cor_texto_suave?: string;
    rodapeLayout?: string;
    logoTamanho?: string;
    logoAlinhamento?: string;
    banner?: string;
    botao?: string;
    animacao?: string;
    agendamento?: boolean;
    /** Confirmação da agenda: manual, automatico ou whatsapp. */
    modoConfirmacaoAgenda?: string;
    /** Intervalo das vagas da agenda em minutos (15,20,30,45,60,90,120). */
    duracaoSlotMinutos?: number;
    estilo?: string;
    instagram?: boolean;
    facebook?: boolean;
    linkedin?: boolean;
    tiktok?: boolean;
    youtube?: boolean;
    whatsappFlutuante?: boolean;
  };
  header?: {
    botao_agendar?: string;
    ocultar?: string[];
    mostrar?: string[];
    renomear?: { id?: string; label?: string }[];
  };
  rodape?: {
    texto?: string;
    remover?: string[];
    acrescentar?: { label?: string; href?: string }[];
    instagram?: boolean;
    facebook?: boolean;
    linkedin?: boolean;
    tiktok?: boolean;
    youtube?: boolean;
  };
  midia?: {
    foto?: { slot?: string; indice?: number; busca?: string; src?: string; limpar?: boolean; credito?: { fotografo?: string; perfil_url?: string; texto?: string; unsplash_url?: string } };
    fotos?: Array<{ slot?: string; indice?: number; busca?: string; src?: string; limpar?: boolean; credito?: { fotografo?: string; perfil_url?: string; texto?: string; unsplash_url?: string } }>;
    logo?: { src?: string };
  };
  /** Ícone/marca do estúdio: troca o ícone Lucide, cores e layout do lockup. */
  marca?: {
    tipo?: "icone" | "emblema" | "arquivo" | "texto";
    icone?: string;
    emblema?: string;
    arquivo?: string;
    layout?: string;
    fonteId?: string;
    corIcone?: string;
    corNome?: string;
    corAcento?: string;
    gerarOpcoes?: boolean;
  };
};

/** Recorte validado da marca (aplicado no estúdio, não no schema do site). */
export type MarcaPatch = {
  tipo?: "icone" | "emblema" | "arquivo" | "texto";
  icone?: string;
  emblema?: string;
  arquivo?: string;
  layout?: LayoutLogo;
  fonteId?: string;
  corIcone?: string;
  corNome?: string;
  corAcento?: string;
  gerarOpcoes?: boolean;
};

export const LIMITE_FAQ = 10;

/** Nichos válidos para troca de modelo pela IA (inclui o genérico). */
const NICHOS_VALIDOS = new Set<string>([...nichos.map((n) => n.slug), "generico"]);

export type TocouPedido = {
  contato: boolean;
  textos: boolean;
  servicos: boolean;
  visual: boolean;
  marca: boolean;
  menu: boolean;
  rodape: boolean;
  diferenciais: boolean;
  midia: boolean;
  faq: boolean;
  eventos: boolean;
  profissionais: boolean;
  avisos: boolean;
  redes: boolean;
};

export type ResultadoPedido = {
  site: Record<string, unknown>;
  visual: VisualConfig;
  resumo: string;
  aviso: string;
  abrir: AbrirPedido;
  tocou: TocouPedido;
  /** Novo nicho/modelo pedido (quando a IA troca a base do site). */
  nicho?: string;
  /** Expediente por dia a aplicar na Grade do cliente. */
  expediente?: DiaExpediente[];
  /** Ícone/marca a aplicar no estúdio (fora do schema congelado). */
  marca?: MarcaPatch;
  /** Avisos/recessos para o formulário (não vão no schema congelado como bloco próprio). */
  avisos?: { titulo: string; descricao: string; dataLabel: string }[];
  redes?: Record<string, string>;
};

function corta(v: unknown, max: number) {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function semAcento(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function obj(v: unknown) {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function chaveProfissional(item: Record<string, unknown>) {
  const nome = semAcento(corta(item.nome, 60)).replace(/[^a-z0-9]+/g, " ").trim();
  const cargo = semAcento(corta(item.cargo, 40)).replace(/[^a-z0-9]+/g, " ").trim();
  return nome && nome !== "sem preferencia" ? `${nome}|${cargo}` : "";
}

function deduplicarProfissionais(itens: Record<string, unknown>[]) {
  const unicos: Record<string, unknown>[] = [];
  const indices = new Map<string, number>();
  for (const item of itens) {
    const chave = chaveProfissional(item);
    if (!chave || !indices.has(chave)) {
      if (chave) indices.set(chave, unicos.length);
      unicos.push(item);
      continue;
    }
    const indice = indices.get(chave)!;
    const original = unicos[indice];
    const fotoOriginal = obj(original.foto);
    const fotoDuplicada = obj(item.foto);
    unicos[indice] = {
      ...item,
      ...original,
      foto: fotoOriginal.src ? fotoOriginal : fotoDuplicada.src ? fotoDuplicada : fotoOriginal,
    };
  }
  return unicos;
}

export function whatsappDe(raw: unknown) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length > 13) d = d.slice(-13);
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return "";
}

export function rotuloTelefone(wa: string) {
  const n = wa.replace(/^55/, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return wa;
}

function ufDe(raw: unknown) {
  const s = corta(raw, 32);
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return UF[semAcento(s)] || "";
}

function textoPreenchido(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(textoPreenchido);
  if (v && typeof v === "object") return Object.values(v as object).some(textoPreenchido);
  return false;
}

function gravarCredito(
  site: Record<string, unknown>,
  slot: string,
  indice: number,
  credito: { fotografo: string; perfil_url: string; texto: string; unsplash_url: string },
) {
  const marcar = (imagem: Record<string, unknown>) => {
    imagem.origem = "unsplash";
    imagem.credito = credito.unsplash_url ? credito : { fotografo: credito.fotografo, perfil_url: credito.perfil_url, texto: credito.texto };
  };
  if (slot === "hero" || slot === "sobre") {
    const bloco = { ...obj(site[slot]) };
    const imagem = { ...obj(bloco.imagem) };
    marcar(imagem);
    bloco.imagem = imagem;
    site[slot] = bloco;
    return;
  }
  const chave = slot === "galeria" ? "galeria" : "servicos";
  const bloco = { ...obj(site[chave]) };
  const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
  if (!itens[indice]) return;
  const imagem = { ...obj(itens[indice].imagem) };
  marcar(imagem);
  itens[indice] = { ...itens[indice], imagem };
  bloco.itens = itens;
  site[chave] = bloco;
}

function umDe<T extends string>(raw: string | undefined, lista: readonly T[]): T | "" {
  const s = semAcento(raw || "");
  if (!s) return "";
  return lista.find((item) => item === raw || semAcento(item) === s) || "";
}

function cabecalhoDe(raw?: string): CabecalhoLayout | "" {
  const s = semAcento(raw || "").replace(/\s+/g, "-");
  if (s === "direita" || s === "logo-a-direita") return "logo-direita";
  if (s === "abaixo" || s === "menu-abaixo") return "menu-abaixo";
  if (s === "centro" || s === "central") return "centralizado";
  return umDe(s, ["logo-esquerda", "centralizado", "logo-slogan", "logo-direita", "menu-abaixo", "compacto"] as const);
}

function hexDe(raw: unknown) {
  const s = corta(raw, 7);
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : "";
}

function hrefSeguro(raw: unknown) {
  const s = corta(raw, 240);
  if (/^#[a-z0-9-]+$/i.test(s)) return s;
  if (/^https:\/\/[^\s]+$/i.test(s)) return s;
  return "";
}

function completoDe(e: Record<string, unknown>) {
  const rua = [corta(e.logradouro, 80), corta(e.numero, 12)].filter(Boolean).join(", ");
  const cidade = [corta(e.bairro, 60), corta(e.cidade, 60)].filter(Boolean).join(", ");
  const uf = corta(e.estado, 2);
  const lugar = [cidade, uf && uf !== "NA" ? uf : ""].filter(Boolean).join(" - ");
  return [rua, lugar].filter(Boolean).join(" — ") || "Endereço a confirmar";
}

function idFaq(itens: Record<string, unknown>[]) {
  const ids = new Set(itens.map((item) => String(item.id || "")));
  let n = itens.length + 1;
  while (ids.has(`faq_extra_${n}`)) n += 1;
  return `faq_extra_${n}`;
}

function acharNome(itens: Record<string, unknown>[], nome: string) {
  const n = semAcento(nome);
  if (!n) return -1;
  const exato = itens.findIndex((it) => semAcento(String(it.nome || it.titulo || "")) === n);
  if (exato >= 0) return exato;
  return itens.findIndex((it) => semAcento(String(it.nome || it.titulo || "")).includes(n));
}

export function patchRapido(texto: string): PatchPedido | null {
  const horario = horarioDireto(texto);
  if (horario) return { resumo: "Horário atualizado.", empresa: { horario_resumo: horario } };
  const tel = telefoneDireto(texto);
  if (tel) return { resumo: "Telefone atualizado.", empresa: { whatsapp: tel } };
  return null;
}

export function contextoEditavel(
  site: Record<string, unknown>,
  visual?: Partial<VisualConfig>,
  marca?: {
    tipo?: OrigemMarca;
    icone?: string;
    emblema?: string;
    arquivo?: string;
    layout?: string;
    fonteId?: string;
    corIcone?: string;
    corNome?: string;
    corAcento?: string;
  },
  nicho?: string,
) {
  const empresa = obj(site.empresa);
  const nichoMarca = corta(nicho || obj(site.meta).nicho, 40) || "generico";
  const logoSrcExistente = corta(obj(empresa.logo).src, 500);
  const arquivoMarcaExistente =
    visual?.logoArquivo || (arquivosDoNicho(nichoMarca).includes(logoSrcExistente) ? logoSrcExistente : "");
  const logoPersonalizado = Boolean(
    !marca &&
      logoSrcExistente &&
      !logoSrcExistente.startsWith("/marcas/") &&
      !visual?.logoIcone &&
      !visual?.logoEmblema &&
      !visual?.logoArquivo,
  );
  const tipoMarcaAtual = marca
    ? marca.tipo ||
      (marca.layout === "wordmark" ? "texto" : marca.arquivo ? "arquivo" : marca.emblema ? "emblema" : marca.icone ? "icone" : "")
    : visual?.logoOrigem ||
      (arquivoMarcaExistente ? "arquivo" : visual?.logoEmblema ? "emblema" : visual?.logoIcone ? "icone" : "");
  const end = obj(empresa.endereco);
  const hero = obj(site.hero);
  const sobre = obj(site.sobre);
  const servicos = obj(site.servicos);
  const faq = obj(site.faq);
  const difs = obj(site.diferenciais);
  const header = obj(site.header);
  const rodape = obj(site.rodape);
  const itens = Array.isArray(servicos.itens) ? (servicos.itens as Record<string, unknown>[]) : [];
  const itensProfissionais = Array.isArray(obj(site.profissionais).itens)
    ? (obj(site.profissionais).itens as Record<string, unknown>[])
    : [];
  const menu = Array.isArray(header.menu) ? (header.menu as Record<string, unknown>[]) : [];
  return {
    nome: corta(empresa.nome, 80),
    slogan: corta(empresa.slogan, 80),
    whatsapp: /79999990000|99999-0000/.test(String(empresa.whatsapp_label || empresa.whatsapp || ""))
      ? ""
      : corta(empresa.whatsapp_label || empresa.whatsapp, 20),
    email: /nao-informado@guix\.invalid/i.test(String(empresa.email || "")) ? "" : corta(empresa.email, 80),
    horario: /horário a combinar/i.test(String(empresa.horario_resumo || "")) ? "" : corta(empresa.horario_resumo, 160),
    endereco: /endereço a confirmar/i.test(String(end.completo || "")) ? "" : corta(end.completo, 160),
    hero: { titulo: corta(hero.titulo, 90), subtitulo: corta(hero.subtitulo, 160) },
    sobre: {
      titulo: corta(sobre.titulo, 80),
      paragrafos: (Array.isArray(sobre.paragrafos) ? sobre.paragrafos : []).slice(0, 2).map((p) => corta(p, 180)),
    },
    servicos: itens.slice(0, 12).map((s) => ({
      nome: corta(s.nome, 60),
      descricao: corta(s.descricao, 140),
      preco: corta(s.preco_label, 24),
      duracao: corta(s.duracao_label, 24),
    })),
    faq: (Array.isArray(faq.itens) ? (faq.itens as Record<string, unknown>[]) : []).slice(0, LIMITE_FAQ).map((f) => ({
      pergunta: corta(f.pergunta, 100),
      resposta: corta(f.resposta, 140),
    })),
    eventos: (Array.isArray(obj(site.eventos).itens) ? (obj(site.eventos).itens as Record<string, unknown>[]) : []).slice(0, 4).map((e) => ({
      titulo: corta(e.titulo, 80),
      descricao: corta(e.descricao, 180),
      data_label: corta(e.data_label, 60),
      horario: corta(e.horario, 8),
    })),
    diferenciais: (Array.isArray(difs.itens) ? (difs.itens as Record<string, unknown>[]) : []).slice(0, 6).map((d) => ({
      titulo: corta(d.titulo, 60),
      descricao: corta(d.descricao, 120),
    })),
    menu: menu.slice(0, 7).map((m) => ({ id: corta(m.id, 20), label: corta(m.label, 24) })),
    rodape: corta(rodape.texto, 120),
    profissionais: itensProfissionais
      .filter((p) => corta(p.nome, 2) && corta(p.nome, 40) !== "Sem preferência")
      .slice(0, 8)
      .map((p) => ({
        indice: itensProfissionais.indexOf(p),
        nome: corta(p.nome, 60),
        cargo: corta(p.cargo, 40),
        descricao: corta(p.descricao, 140),
      })),
    motor: {
      pode: [
        "nicho",
        "empresa",
        "hero",
        "sobre",
        "contato",
        "faq",
        "eventos",
        "avisos",
        "servicos",
        "profissionais",
        "diferenciais",
        "visual",
        "marca",
        "header",
        "rodape",
        "redes",
        "midia",
      ],
      nicho_atual: nichoMarca,
      nichos: nichos.map((n) => ({ slug: n.slug, nome: n.nome, negocio: n.negocio })),
      paletas: PALETAS.map((p) => ({ id: p.id, nome: p.nome })),
      fontes: TIPOGRAFIAS.map((t) => ({ id: t.id, nome: t.nome, fonte_titulo: t.font_heading, fonte_texto: t.font_body })),
      cabecalhos: ["logo-esquerda", "centralizado", "logo-slogan", "logo-direita", "menu-abaixo", "compacto"],
      rodapes: ["centralizado", "dividido", "empilhado", "minimo"],
      aparencias: ["claro", "escuro", "automatico"],
      estilos: ["moderno", "luxo", "urbano", "classico", "suave"],
      logoTamanhos: ["pequeno", "medio", "grande"],
      botoes: ["arredondado", "quadrado", "pílula", "sem-contorno"],
      animacoes: ["suave", "media", "intensa"],
      modos_confirmacao: ["manual", "automatico", "whatsapp"],
      duracao_slot_minutos: [15, 20, 30, 45, 60, 90, 120],
      layouts_marca: LAYOUTS_LOGO.map((l) => ({ id: l.id, nome: l.nome })),
      fontes_marca: FONTES_LOGO.map((f) => ({ id: f.id, nome: f.nome })),
      cores_marca: CORES_LOGO.map((c) => ({ hex: c.hex, nome: c.nome })),
      icones_marca: idsIconesPermitidos(),
      icones_recomendados_marca: iconesDoNicho(nichoMarca).map((i) => ({ id: i.id, nome: i.nome })),
      emblemas_marca: emblemasDoNicho(nichoMarca).map((e) => ({ id: e.id, nome: e.nome })),
      arquivos_marca: arquivosDoNicho(nichoMarca),
      marca_pode_gerar_modelos: true,
      fotos_disponiveis: {
        hero: Boolean(obj(obj(site.hero).imagem).src),
        sobre: Boolean(obj(obj(site.sobre).imagem).src),
        galeria: Array.isArray(obj(site.galeria).itens) ? (obj(site.galeria).itens as unknown[]).length : 0,
        servicos: itens.length,
        profissionais: Array.isArray(obj(site.profissionais).itens)
          ? (obj(site.profissionais).itens as Record<string, unknown>[]).filter((p) => corta(p.nome, 2) && p.nome !== "Sem preferência").length
          : 0,
        eventos: Array.isArray(obj(site.eventos).itens) ? (obj(site.eventos).itens as unknown[]).length : 0,
      },
    },
    campos_vazios: [
      !(Array.isArray(faq.itens) && faq.itens.length) ? "faq" : "",
      !(Array.isArray(obj(site.eventos).itens) && (obj(site.eventos).itens as unknown[]).length) ? "eventos" : "",
      !corta(hero.titulo, 2) ? "hero.titulo" : "",
      !corta(hero.subtitulo, 2) ? "hero.subtitulo" : "",
      !(Array.isArray(sobre.paragrafos) && sobre.paragrafos.length) ? "sobre" : "",
      !itens.length ? "servicos" : "",
    ].filter(Boolean),
    visual: {
      paletaId: visual?.paletaId || "",
      tipografiaId: visual?.tipografiaId || "",
      cabecalho: visual?.cabecalho || "",
      rodapeLayout: visual?.rodapeLayout || "",
      logoTamanho: visual?.logoTamanho || "",
      logoAlinhamento: visual?.logoAlinhamento || "centro",
      banner: visual?.banner || "",
      botao: visual?.botao || "",
      aparencia: visual?.aparencia || "",
      animacao: visual?.animacao || "",
      estilo: visual?.estilo || "",
      cor_accent: visual?.corAccent || "",
      cor_fundo: visual?.corFundo || "",
      cor_titulos: visual?.corTitulos || String(obj(site.tema).color_heading || ""),
      cor_texto: visual?.corTexto || String(obj(site.tema).color_text || ""),
      cor_texto_suave: visual?.corTextoSuave || String(obj(site.tema).color_text_muted || ""),
      color_text_atual: String(obj(site.tema).color_text || ""),
      color_text_muted_atual: String(obj(site.tema).color_text_muted || ""),
      agendamento: visual?.agendamento !== false,
      modoConfirmacaoAgenda: visual?.modoConfirmacaoAgenda || "automatico",
      duracaoSlotMinutos: visual?.duracaoSlotMinutos || 30,
      whatsappFlutuante: visual?.whatsappFlutuante !== false,
    },
    marca: {
      tipo: tipoMarcaAtual,
      icone: corta(marca ? marca.icone : visual?.logoIcone, 40),
      emblema: corta(marca ? marca.emblema : visual?.logoEmblema, 48),
      arquivo: corta(marca ? marca.arquivo : arquivoMarcaExistente, 100),
      logoPersonalizado,
      layout: corta(marca ? marca.layout : visual?.logoLayout, 20),
      fonteId: corta(marca ? marca.fonteId : visual?.logoFonteId, 20),
      corIcone: corta(marca ? marca.corIcone : visual?.logoCorIcone, 7),
      corNome: corta(marca ? marca.corNome : visual?.logoCorNome, 7),
      corAcento: corta(marca ? marca.corAcento : visual?.logoCorAcento, 7),
    },
  };
}

export function profissionaisDoSite(site: Record<string, unknown>) {
  const itens = Array.isArray(obj(site.profissionais).itens) ? (obj(site.profissionais).itens as Record<string, unknown>[]) : [];
  return itens
    .map((p) => ({
      nome: corta(p.nome, 60),
      cargo: corta(p.cargo, 40),
      descricao: corta(p.descricao, 320),
      whatsapp: corta(p.whatsapp || p.telefone, 20),
      email: corta(p.email, 80),
      fotoSrc: sanitizarFotoSrc(obj(p.foto).src) || "",
    }))
    .filter((p) => p.nome && p.nome !== "Sem preferência" && p.nome !== "Novo nome");
}

export function eventosDoSite(site: Record<string, unknown>) {
  const bloco = obj(site.eventos);
  const itens = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
  return itens.slice(0, 4).map((e) => {
    const img = (e.imagem || {}) as { src?: string };
    return {
      titulo: corta(e.titulo, 80) || "Evento",
      descricao: corta(e.descricao, 320),
      dataLabel: corta(e.data_label, 80),
      horario: /^\d{2}:\d{2}$/.test(String(e.horario || "")) ? String(e.horario) : "19:00",
      imagemSrc: String(img.src || ""),
    };
  });
}

const LIMITE_EVENTOS = 4;

function eventoPlaceholder(e: Record<string, unknown>) {
  const titulo = semAcento(String(e.titulo || ""));
  const descricao = semAcento(String(e.descricao || ""));
  return !titulo || titulo === "novo evento" || titulo === "evento" || !descricao || /conte o que acontece/.test(descricao);
}

function aplicarEventos(site: Record<string, unknown>, patch: NonNullable<PatchPedido["eventos"]>, avisos: string[]) {
  const bloco = { ...obj(site.eventos) };
  if (patch.titulo) bloco.titulo = corta(patch.titulo, 80) || "Agenda";
  let itens = patch.limpar === true ? [] : Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]).map((e) => ({ ...e })) : [];
  for (const atualizacao of patch.atualizar || []) {
    const indice = acharNome(itens, corta(atualizacao.de, 80));
    if (indice < 0) continue;
    if (atualizacao.titulo) itens[indice].titulo = corta(atualizacao.titulo, 80);
    if (atualizacao.descricao) itens[indice].descricao = corta(atualizacao.descricao, 320);
  }

  const listaNova = [
    ...(Array.isArray(patch.itens) ? patch.itens : []),
    ...(Array.isArray(patch.acrescentar) ? patch.acrescentar : []),
  ];

  const soVazios = itens.length > 0 && itens.every((e) => eventoPlaceholder(e));
  if (patch.limpar === true || itens.length === 0 || (soVazios && listaNova.length)) {
    itens = [];
  }

  for (const item of listaNova) {
    if (itens.length >= LIMITE_EVENTOS) {
      avisos.push("A agenda fica com no máximo 4 eventos.");
      break;
    }
    const titulo = corta(item.titulo, 80);
    const descricao = corta(item.descricao, 320);
    if (!titulo || !descricao) continue;
    const dataLabel = corta(item.data_label, 80) || "A definir";
    const horario = /^\d{2}:\d{2}$/.test(String(item.horario || "")) ? String(item.horario) : "19:00";
    itens.push({
      id: `evt_cliente_${itens.length + 1}`,
      titulo,
      descricao,
      data: "2026-12-01",
      data_label: dataLabel,
      horario,
      imagem: { id: `img_evt_cliente_${itens.length + 1}`, src: "", alt: titulo, categoria: "evento" },
    });
  }

  if (!bloco.titulo) bloco.titulo = itens.length ? "Agenda" : "Agenda";
  bloco.itens = itens.slice(0, LIMITE_EVENTOS);
  site.eventos = bloco;
}

function aplicarPromocoes(site: Record<string, unknown>, patch: NonNullable<PatchPedido["promocoes"]>) {
  const bloco = { ...obj(site.promocoes) };
  if (patch.titulo) bloco.titulo = corta(patch.titulo, 80);
  const itens = patch.limpar === true
    ? []
    : Array.isArray(bloco.itens)
      ? (bloco.itens as Record<string, unknown>[]).map((item) => ({ ...item }))
      : [];
  for (const atualizacao of patch.atualizar || []) {
    const indice = acharNome(itens, corta(atualizacao.de, 80));
    if (indice < 0) continue;
    if (atualizacao.titulo) itens[indice].titulo = corta(atualizacao.titulo, 80);
    if (atualizacao.descricao) itens[indice].descricao = corta(atualizacao.descricao, 240);
    if (atualizacao.validade_label) itens[indice].validade_label = corta(atualizacao.validade_label, 40);
  }
  bloco.itens = itens.slice(0, 4);
  site.promocoes = bloco;
}

export function servicosDoSite(site: Record<string, unknown>): LinhaServico[] {
  const itens = Array.isArray(obj(site.servicos).itens) ? (obj(site.servicos).itens as Record<string, unknown>[]) : [];
  return itens.map((s) => ({
    nome: corta(s.nome, 60),
    descricao: corta(s.descricao, 320),
    preco: corta(s.preco_label, 32) || "Sob consulta",
    duracao: corta(s.duracao_label, 32) || "30 min",
    imagemSrc: sanitizarFotoSrc(obj(s.imagem).src) || "",
  }));
}

export function copiaDoSite(site: Record<string, unknown>): CopiaViva {
  const hero = obj(site.hero);
  const sobre = obj(site.sobre);
  const contato = obj(site.contato);
  const faq = obj(site.faq);
  const servicos = obj(site.servicos);
  const galeria = obj(site.galeria);
  const profissionais = obj(site.profissionais);
  return {
    hero: { titulo: corta(hero.titulo, 90), subtitulo: corta(hero.subtitulo, 180) },
    sobre: {
      titulo: corta(sobre.titulo, 80),
      paragrafos: (Array.isArray(sobre.paragrafos) ? sobre.paragrafos : []).map((p) => corta(p, 420)).filter(Boolean).slice(0, 3),
    },
    contato: { titulo: corta(contato.titulo, 80), subtitulo: corta(contato.subtitulo, 180) },
    servicos: {
      titulo: corta(servicos.titulo, 60),
      subtitulo: corta(servicos.subtitulo, 140),
      itens: (Array.isArray(servicos.itens) ? (servicos.itens as Record<string, unknown>[]) : []).map((s) => ({
        descricao: corta(s.descricao, 320),
      })),
    },
    faq: {
      titulo: corta(faq.titulo, 60),
      itens: (Array.isArray(faq.itens) ? (faq.itens as Record<string, unknown>[]) : []).map((f) => ({
        pergunta: corta(f.pergunta, 140),
        resposta: corta(f.resposta, 320),
      })),
    },
    galeria: {
      titulo: corta(galeria.titulo, 80),
      itens: (Array.isArray(galeria.itens) ? (galeria.itens as Record<string, unknown>[]) : []).map((item) => ({
        legenda: corta(item.legenda, 100),
      })),
    },
    profissionais: {
      titulo: corta(profissionais.titulo, 60),
      subtitulo: corta(profissionais.subtitulo, 180),
    },
  };
}

function aplicarServicos(site: Record<string, unknown>, patch: NonNullable<PatchPedido["servicos"]>, avisos: string[]) {
  const bloco = { ...obj(site.servicos) };
  const antes = JSON.stringify(bloco);
  let itens = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]).map((s) => ({ ...s })) : [];
  if (patch.titulo) bloco.titulo = corta(patch.titulo, 60);
  if (patch.subtitulo) bloco.subtitulo = corta(patch.subtitulo, 160);
  for (const nome of patch.remover || []) {
    if (itens.length <= 1) {
      avisos.push("O site precisa de pelo menos um serviço.");
      break;
    }
    const i = acharNome(itens, corta(nome, 60));
    if (i >= 0) itens.splice(i, 1);
  }
  for (const item of patch.atualizar || []) {
    const i = acharNome(itens, corta(item.nome, 60));
    const temCampoEditavel = Boolean(item.novo_nome || item.descricao || item.preco_label || item.duracao_label);
    if (!temCampoEditavel) {
      avisos.push(`A atualização de "${corta(item.nome, 60) || "serviço"}" não trouxe nenhum campo para alterar.`);
      continue;
    }
    if (i < 0) {
      avisos.push(`Não encontrei o serviço "${corta(item.nome, 60)}" para atualizar.`);
      continue;
    }
    const base = { ...itens[i] };
    if (item.novo_nome) base.nome = corta(item.novo_nome, 60);
    if (item.descricao) base.descricao = corta(item.descricao, 320);
    if (item.preco_label) {
      const label = corta(item.preco_label, 32);
      const n = precoDeRotulo(label);
      base.preco_label = label;
      base.preco = n == null ? 0 : n;
    }
    if (item.duracao_label) {
      const label = corta(item.duracao_label, 32);
      const mins = minutosDeRotulo(label);
      base.duracao_label = label;
      base.duracao_minutos = mins >= 1 ? mins : Number(base.duracao_minutos) || 30;
    }
    itens[i] = base;
  }
  for (const item of patch.acrescentar || []) {
    const nome = corta(item.nome, 60);
    if (!nome || itens.length >= 12) continue;
    const molde = { ...(itens[itens.length - 1] || {}) };
    const imagem: Record<string, unknown> = {
      ...obj(molde.imagem),
      id: `img_srv_extra_${itens.length + 1}`,
      alt: nome,
      categoria: "servico",
    };
    if (typeof imagem.src !== "string") imagem.src = "";
    delete imagem.credito;
    const label = corta(item.preco_label, 32) || "Sob consulta";
    const n = precoDeRotulo(label);
    const dur = corta(item.duracao_label, 32) || "30 min";
    const mins = minutosDeRotulo(dur);
    itens.push({
      id: `srv_extra_${itens.length + 1}`,
      nome,
      descricao: corta(item.descricao, 320),
      preco: n == null ? 0 : n,
      preco_label: label,
      duracao_minutos: mins >= 1 ? mins : 30,
      duracao_label: dur,
      imagem,
    });
  }
  if (patch.sem_preco) {
    itens = itens.map((s) => ({ ...s, preco: 0, preco_label: "Sob consulta" }));
  }
  if (!itens.length) return false;
  bloco.itens = itens;
  site.servicos = bloco;
  return JSON.stringify(bloco) !== antes;
}

function aplicarMenu(site: Record<string, unknown>, patch: NonNullable<PatchPedido["header"]>, avisos: string[]) {
  const header = { ...obj(site.header) };
  let menu = (Array.isArray(header.menu) ? (header.menu as Record<string, unknown>[]) : [])
    .map((m) => ({
      id: String(m.id || ""),
      label: corta(m.label, 24) || ROTULO_MENU[m.id as (typeof MENU_IDS)[number]] || "Item",
      href: `#${String(m.id || "inicio")}`,
    }))
    .filter((m) => (MENU_IDS as readonly string[]).includes(m.id));
  const ocultar = new Set((patch.ocultar || []).map((id) => semAcento(id)));
  const pedido = menu.filter((m) => !ocultar.has(m.id) && !ocultar.has(semAcento(m.label)));
  if (pedido.length >= 5) menu = pedido;
  else if ((patch.ocultar || []).length) avisos.push("O menu desta página fica com no mínimo 5 itens. Outra tela é cotada com o atendimento.");
  for (const id of patch.mostrar || []) {
    const limpo = semAcento(id).replace(/\s+/g, "");
    const real = MENU_IDS.find((item) => item === limpo || semAcento(ROTULO_MENU[item]) === semAcento(id));
    if (!real || menu.some((m) => m.id === real) || menu.length >= 7) continue;
    menu.push({ id: real, label: ROTULO_MENU[real], href: `#${real}` });
  }
  for (const item of patch.renomear || []) {
    const id = String(item.id || "");
    const label = corta(item.label, 24);
    const alvo = menu.find((m) => m.id === id || semAcento(m.label) === semAcento(id));
    if (alvo && label) alvo.label = label;
  }
  if (patch.botao_agendar) header.botao_agendar = corta(patch.botao_agendar, 28);
  header.menu = menu.slice(0, 7);
  site.header = header;
}

function aplicarRodape(site: Record<string, unknown>, patch: NonNullable<PatchPedido["rodape"]>) {
  const rodape = { ...obj(site.rodape) };
  if (patch.texto) rodape.texto = corta(patch.texto, 160);
  let links = Array.isArray(rodape.links) ? (rodape.links as Record<string, unknown>[]).map((l) => ({ ...l })) : [];
  const tirar = (patch.remover || []).map((nome) => semAcento(nome));
  if (tirar.length) links = links.filter((l) => !tirar.includes(semAcento(String(l.label || l.id || ""))));
  for (const item of patch.acrescentar || []) {
    const label = corta(item.label, 28);
    const href = hrefSeguro(item.href);
    if (!label || !href || links.length >= 8) continue;
    const id = semAcento(label).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) || "link";
    links.push({ id, label, href });
  }
  rodape.links = links;
  site.rodape = rodape;
}

function aplicarDiferenciais(site: Record<string, unknown>, patch: NonNullable<PatchPedido["diferenciais"]>, avisos: string[]) {
  const bloco = { ...obj(site.diferenciais) };
  let itens = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]).map((d) => ({ ...d })) : [];
  if (patch.titulo) bloco.titulo = corta(patch.titulo, 60);
  for (const nome of patch.remover || []) {
    if (itens.length <= 3) {
      avisos.push("Os destaques ficam com no mínimo 3 itens.");
      break;
    }
    const i = acharNome(itens, corta(nome, 60));
    if (i >= 0) itens.splice(i, 1);
  }
  for (const item of patch.atualizar || []) {
    const i = acharNome(itens, corta(item.de, 60));
    if (i < 0 || !itens[i]) continue;
    if (item.titulo) itens[i].titulo = corta(item.titulo, 60);
    if (item.descricao) itens[i].descricao = corta(item.descricao, 220);
  }
  for (const item of patch.acrescentar || []) {
    if (itens.length >= 6) break;
    const titulo = corta(item.titulo, 60);
    if (!titulo) continue;
    const molde = itens[0] || {};
    itens.push({
      id: `dif_extra_${itens.length + 1}`,
      titulo,
      descricao: corta(item.descricao, 220),
      icone: molde.icone || "check",
    });
  }
  if (itens.length >= 3) {
    bloco.itens = itens;
    site.diferenciais = bloco;
  }
}

export function aplicarPedido(
  siteIn: Record<string, unknown>,
  visualIn: VisualConfig,
  patch: PatchPedido,
  nichoAtualIn?: string,
): ResultadoPedido {
  const site = siteIn;
  const estadoInicial = JSON.stringify({ site: siteIn, visual: visualIn });
  const visual: VisualConfig = { ...visualIn };
  const avisos: string[] = [];
  const tocou: TocouPedido = {
    contato: false,
    textos: false,
    servicos: false,
    visual: false,
    marca: false,
    menu: false,
    rodape: false,
    diferenciais: false,
    midia: false,
    faq: false,
    eventos: false,
    profissionais: false,
    avisos: false,
    redes: false,
  };
  let avisosExtra: { titulo: string; descricao: string; dataLabel: string }[] | undefined;
  let redesExtra: Record<string, string> | undefined;
  let marcaPatch: MarcaPatch | undefined;
  const empresa = { ...obj(site.empresa) };
  const nichoAtual = corta(nichoAtualIn || obj(site.meta).nicho, 40).toLowerCase();
  const nichoPedido = patch.nicho ? String(patch.nicho).trim().toLowerCase() : "";
  const nichoNovo =
    nichoPedido && NICHOS_VALIDOS.has(nichoPedido) && nichoPedido !== nichoAtual ? nichoPedido : "";
  let expedienteNovo: DiaExpediente[] | undefined;

  if (nichoNovo) {
    const meta = { ...obj(site.meta) };
    meta.nicho = nichoNovo;
    site.meta = meta;
    tocou.visual = true;
  }

  if (patch.empresa) {
    const nome = corta(patch.empresa.nome, 80);
    if (nome) {
      empresa.nome = nome;
      tocou.contato = true;
    }
    const wa = whatsappDe(patch.empresa.whatsapp);
    if (wa) {
      empresa.whatsapp = wa;
      empresa.telefone = wa.replace(/^55/, "");
      const rotulo = rotuloTelefone(wa);
      empresa.telefone_label = rotulo;
      empresa.whatsapp_label = rotulo;
      tocou.contato = true;
    }
    const email = corta(patch.empresa.email, 80);
    if (email.includes("@") && !email.includes(" ")) {
      empresa.email = email;
      tocou.contato = true;
    }
    const horario = corta(patch.empresa.horario_resumo, 160);
    if (horario) {
      empresa.horario_resumo = horario;
      tocou.contato = true;
    }
    const slogan = corta(patch.empresa.slogan, 80);
    if (slogan) {
      empresa.slogan = slogan;
      tocou.contato = true;
    }
    const cnpj = String(patch.empresa.cnpj || "").replace(/\D/g, "");
    if (cnpj.length === 14) {
      empresa.cnpj = cnpj;
      tocou.contato = true;
    }
    if (patch.empresa.endereco && textoPreenchido(patch.empresa.endereco)) {
      const end = { ...obj(empresa.endereco) };
      const p = patch.empresa.endereco;
      if (p.logradouro) end.logradouro = corta(p.logradouro, 80);
      if (p.numero) end.numero = corta(p.numero, 12);
      if (p.complemento) end.complemento = corta(p.complemento, 40);
      if (p.bairro) end.bairro = corta(p.bairro, 60);
      if (p.cidade) end.cidade = corta(p.cidade, 60);
      const uf = ufDe(p.estado);
      if (uf) end.estado = uf;
      const cep = String(p.cep || "").replace(/\D/g, "").slice(0, 8);
      if (cep) end.cep = cep;
      end.completo = completoDe(end);
      empresa.endereco = end;
      tocou.contato = true;
      const contato = { ...obj(site.contato) };
      const titulo = tituloVenha(corta(end.bairro, 60), corta(end.cidade, 60));
      if (titulo && !patch.contato?.titulo) contato.titulo = titulo;
      site.contato = contato;
    }
    if (Array.isArray(patch.empresa.expediente) && patch.empresa.expediente.length) {
      const mapa = new Map<string, DiaExpediente>();
      for (const d of patch.empresa.expediente) {
        const dia = String(d?.dia || "").toLowerCase().slice(0, 3);
        const valido = DIAS_SEMANA.find((x) => x.dia === dia);
        if (!valido) continue;
        mapa.set(valido.dia, normalizarDiaExpediente({ ...d, dia: valido.dia }));
      }
      if (mapa.size) {
        expedienteNovo = DIAS_SEMANA.map((d) => mapa.get(d.dia)).filter((d): d is DiaExpediente => Boolean(d));
        tocou.contato = true;
      }
    }
    site.empresa = empresa;
  }

  if (patch.hero?.titulo || patch.hero?.subtitulo || patch.hero?.botao_principal || patch.hero?.botao_secundario) {
    const hero = { ...obj(site.hero) };
    if (patch.hero.titulo) hero.titulo = corta(patch.hero.titulo, 90);
    if (patch.hero.subtitulo) hero.subtitulo = corta(patch.hero.subtitulo, 180);
    if (patch.hero.botao_principal) hero.botao_principal = corta(patch.hero.botao_principal, 48);
    if (patch.hero.botao_secundario) hero.botao_secundario = corta(patch.hero.botao_secundario, 48);
    site.hero = hero;
    tocou.textos = true;
  }
  if (patch.sobre && (patch.sobre.titulo || textoPreenchido(patch.sobre.paragrafos))) {
    const sobre = { ...obj(site.sobre) };
    if (patch.sobre.titulo) sobre.titulo = corta(patch.sobre.titulo, 80);
    const paragrafos = (patch.sobre.paragrafos || []).map((p) => corta(p, 420)).filter(Boolean).slice(0, 3);
    if (paragrafos.length) sobre.paragrafos = paragrafos;
    site.sobre = sobre;
    tocou.textos = true;
  }
  if (patch.galeria && (patch.galeria.titulo || textoPreenchido(patch.galeria.atualizar))) {
    const galeria = { ...obj(site.galeria) };
    const itens = Array.isArray(galeria.itens) ? (galeria.itens as Record<string, unknown>[]).map((item) => ({ ...item })) : [];
    if (patch.galeria.titulo) galeria.titulo = corta(patch.galeria.titulo, 80);
    for (const item of patch.galeria.atualizar || []) {
      const indice = Number(item.indice);
      const legenda = corta(item.legenda, 100);
      if (!Number.isInteger(indice) || indice < 0 || !itens[indice] || !legenda) continue;
      itens[indice] = { ...itens[indice], legenda };
    }
    galeria.itens = itens;
    site.galeria = galeria;
    tocou.textos = true;
  }
  if (patch.seo?.title || patch.seo?.description) {
    const seo = { ...obj(site.seo) };
    if (patch.seo.title) seo.title = corta(patch.seo.title, 80);
    if (patch.seo.description) seo.description = corta(patch.seo.description, 180);
    site.seo = seo;
    tocou.textos = true;
  }
  if (patch.contato?.titulo || patch.contato?.subtitulo) {
    const contato = { ...obj(site.contato) };
    if (patch.contato.titulo) contato.titulo = corta(patch.contato.titulo, 80);
    if (patch.contato.subtitulo) contato.subtitulo = corta(patch.contato.subtitulo, 180);
    site.contato = contato;
    tocou.textos = true;
  }
  if (
    patch.faq &&
    (patch.faq.limpar === true ||
      textoPreenchido(patch.faq.titulo) ||
      textoPreenchido(patch.faq.remover) ||
      textoPreenchido(patch.faq.acrescentar) ||
      textoPreenchido(patch.faq.itens))
  ) {
    const faq = { ...obj(site.faq) };
    if (patch.faq.titulo) faq.titulo = corta(patch.faq.titulo, 80);
    let itens = patch.faq.limpar === true ? [] : Array.isArray(faq.itens) ? (faq.itens as Record<string, unknown>[]).map((f) => ({ ...f })) : [];
    for (const nome of patch.faq.remover || []) {
      const n = semAcento(corta(nome, 140));
      if (!n) continue;
      const i = itens.findIndex((f) => semAcento(String(f.pergunta || "")).includes(n));
      if (i >= 0) itens.splice(i, 1);
    }
    const itensPatch = patch.faq.itens || [];
    const soCriacao =
      itensPatch.length > 0 &&
      itensPatch.every((item) => !corta(item.de, 1) && corta(item.pergunta, 1) && corta(item.resposta, 1));

    // FAQ vazia ou lista sem "de": trata como criação/substituição (a IA costuma mandar assim).
    if (soCriacao && (itens.length === 0 || patch.faq.limpar === true || itensPatch.length >= 2)) {
      itens = itensPatch
        .map((item) => ({
          id: idFaq([]),
          pergunta: corta(item.pergunta, 180),
          resposta: corta(item.resposta, 400),
        }))
        .filter((item) => item.pergunta && item.resposta)
        .map((item, i) => ({ ...item, id: `faq_${String(i + 1).padStart(2, "0")}` }));
    } else {
      for (const item of itensPatch) {
        if (!item.pergunta && !item.resposta) continue;
        const pergunta = corta(item.pergunta, 180);
        const resposta = corta(item.resposta, 400);
        const alvo = semAcento(item.de || "");
        const i = alvo ? itens.findIndex((f) => semAcento(String(f.pergunta || "")).includes(alvo)) : -1;
        if (i >= 0 && itens[i]) {
          if (pergunta) itens[i].pergunta = pergunta;
          if (resposta) itens[i].resposta = resposta;
          continue;
        }
        // Sem alvo: acrescenta em vez de ignorar
        if (pergunta && resposta) {
          if (itens.length >= LIMITE_FAQ) {
            avisos.push("A FAQ fica com no máximo 10 perguntas.");
            break;
          }
          itens.push({ id: idFaq(itens), pergunta, resposta });
        }
      }
    }
    for (const item of patch.faq.acrescentar || []) {
      if (itens.length >= LIMITE_FAQ) {
        avisos.push("A FAQ fica com no máximo 10 perguntas.");
        break;
      }
      const pergunta = corta(item.pergunta, 180);
      const resposta = corta(item.resposta, 400);
      if (!pergunta || !resposta) continue;
      itens.push({ id: idFaq(itens), pergunta, resposta });
    }
    faq.itens = itens.slice(0, LIMITE_FAQ);
    site.faq = faq;
    tocou.faq = true;
    tocou.textos = true;
  }

  if (
    patch.eventos &&
    (patch.eventos.limpar === true ||
      textoPreenchido(patch.eventos.atualizar) ||
      textoPreenchido(patch.eventos.titulo) ||
      textoPreenchido(patch.eventos.acrescentar) ||
      textoPreenchido(patch.eventos.itens))
  ) {
    aplicarEventos(site, patch.eventos, avisos);
    tocou.eventos = true;
    tocou.textos = true;
  }
  if (patch.promocoes && (patch.promocoes.limpar === true || textoPreenchido(patch.promocoes.titulo) || textoPreenchido(patch.promocoes.atualizar))) {
    aplicarPromocoes(site, patch.promocoes);
    tocou.textos = true;
  }

  if (patch.servicos && (patch.servicos.sem_preco === true || textoPreenchido(patch.servicos))) {
    tocou.servicos = aplicarServicos(site, patch.servicos, avisos);
  }
  if (
    patch.profissionais &&
    (textoPreenchido(patch.profissionais.titulo) ||
      textoPreenchido(patch.profissionais.subtitulo) ||
      patch.profissionais.ocultar === true ||
      patch.profissionais.limpar === true ||
      textoPreenchido(patch.profissionais.atualizar) ||
      textoPreenchido(patch.profissionais.acrescentar) ||
      textoPreenchido(patch.profissionais.remover))
  ) {
    const bloco = { ...obj(site.profissionais) };
    if (patch.profissionais.titulo) bloco.titulo = corta(patch.profissionais.titulo, 60);
    if (patch.profissionais.subtitulo) bloco.subtitulo = corta(patch.profissionais.subtitulo, 180);
    let itens =
      patch.profissionais.limpar === true
        ? []
        : Array.isArray(bloco.itens)
          ? (bloco.itens as Record<string, unknown>[]).map((p) => ({ ...p }))
          : [];
    if (patch.profissionais.ocultar) {
      for (const item of itens) item.nome = "Sem preferência";
    }
    for (const nome of patch.profissionais.remover || []) {
      const i = acharNome(itens, corta(nome, 60));
      if (i >= 0) itens.splice(i, 1);
    }
    for (const item of patch.profissionais.atualizar || []) {
      const i = acharNome(itens, corta(item.nome, 60));
      if (i < 0) continue;
      if (item.novo_nome) itens[i].nome = corta(item.novo_nome, 60);
      if (item.cargo) itens[i].cargo = corta(item.cargo, 40);
      if (item.descricao) itens[i].descricao = corta(item.descricao, 240);
      if (item.whatsapp) itens[i].whatsapp = corta(item.whatsapp, 20);
      if (item.email) itens[i].email = corta(item.email, 80);
    }
    for (const item of patch.profissionais.acrescentar || []) {
      const nome = corta(item.nome, 60);
      if (!nome || nome === "Novo nome") continue;
      const cargo = corta(item.cargo, 40);
      const chave = chaveProfissional({ nome, cargo });
      if (itens.some((existente) => chaveProfissional(existente) === chave)) continue;
      if (itens.length >= 8) {
        avisos.push("A equipe fica com no máximo 8 profissionais.");
        break;
      }
      itens.push({
        id: `pro_extra_${itens.length + 1}`,
        nome,
        cargo,
        descricao: corta(item.descricao, 240),
        whatsapp: corta(item.whatsapp, 20),
        email: corta(item.email, 80),
      });
    }
    bloco.itens = deduplicarProfissionais(itens);
    site.profissionais = bloco;
    tocou.profissionais = true;
    tocou.textos = true;
  }

  if (patch.avisos && (patch.avisos.limpar === true || textoPreenchido(patch.avisos.itens))) {
    avisosExtra =
      patch.avisos.limpar === true
        ? []
        : (patch.avisos.itens || [])
            .map((a) => ({
              titulo: corta(a.titulo, 80),
              descricao: corta(a.descricao, 240),
              dataLabel: corta(a.data_label, 60),
            }))
            .filter((a) => a.titulo && a.descricao)
            .slice(0, 4);
    tocou.avisos = true;
  }

  if (patch.redes && typeof patch.redes === "object") {
    const limpas: Record<string, string> = {};
    for (const [k, v] of Object.entries(patch.redes)) {
      const id = semAcento(k).replace(/\s+/g, "");
      const url = corta(v, 160);
      if (!id || !url) continue;
      limpas[id] = url;
    }
    if (Object.keys(limpas).length) {
      redesExtra = limpas;
      tocou.redes = true;
      if (limpas.instagram) visual.instagram = true;
      if (limpas.facebook) visual.facebook = true;
      if (limpas.tiktok) visual.tiktok = true;
      if (limpas.youtube) visual.youtube = true;
      if (limpas.linkedin) visual.linkedin = true;
      tocou.visual = true;
    }
  }
  if (patch.diferenciais && textoPreenchido(patch.diferenciais)) {
    aplicarDiferenciais(site, patch.diferenciais, avisos);
    tocou.diferenciais = true;
  }
  if (patch.header && (textoPreenchido(patch.header.botao_agendar) || textoPreenchido(patch.header.ocultar) || textoPreenchido(patch.header.mostrar) || textoPreenchido(patch.header.renomear))) {
    aplicarMenu(site, patch.header, avisos);
    tocou.menu = true;
  }
  if (patch.rodape && (textoPreenchido(patch.rodape.texto) || textoPreenchido(patch.rodape.remover) || textoPreenchido(patch.rodape.acrescentar) || typeof patch.rodape.instagram === "boolean" || typeof patch.rodape.facebook === "boolean" || typeof patch.rodape.linkedin === "boolean" || typeof patch.rodape.tiktok === "boolean" || typeof patch.rodape.youtube === "boolean")) {
    aplicarRodape(site, patch.rodape);
    tocou.rodape = true;
    const redes = patch.rodape;
    if (typeof redes.instagram === "boolean") visual.instagram = redes.instagram;
    if (typeof redes.facebook === "boolean") visual.facebook = redes.facebook;
    if (typeof redes.linkedin === "boolean") visual.linkedin = redes.linkedin;
    if (typeof redes.tiktok === "boolean") visual.tiktok = redes.tiktok;
    if (typeof redes.youtube === "boolean") visual.youtube = redes.youtube;
    if (typeof redes.instagram === "boolean" || typeof redes.facebook === "boolean") tocou.visual = true;
  }

  if (patch.visual) {
    const paleta = PALETAS.find((p) => p.id === patch.visual?.paletaId);
    const tipo = TIPOGRAFIAS.find((t) => t.id === patch.visual?.tipografiaId);
    const cab = cabecalhoDe(patch.visual.cabecalho);
    const rodapeLayout = umDe(patch.visual.rodapeLayout, ["centralizado", "dividido", "empilhado", "minimo"] as const);
    const logoTamanho = umDe(patch.visual.logoTamanho, ["pequeno", "medio", "grande"] as const);
    const logoAlinhamento = umDe(patch.visual.logoAlinhamento, ["centro", "topo", "base"] as const);
    const banner = umDe(patch.visual.banner, ["automatico", "solido", "degrade"] as const);
    const animacao = umDe(patch.visual.animacao, ["suave", "media", "intensa"] as const);
    const estilo = umDe(patch.visual.estilo, ["moderno", "luxo", "urbano", "classico", "suave"] as const);
    const botaoBruto = semAcento(patch.visual.botao || "") === "pilula" ? "pílula" : patch.visual.botao;
    const botao = umDe(botaoBruto, ["arredondado", "quadrado", "pílula", "sem-contorno"] as const);
    const aparenciaPedida = patch.visual.aparencia === "claro" || patch.visual.aparencia === "escuro" || patch.visual.aparencia === "automatico";
    const accent = hexDe(patch.visual.cor_accent);
    const fundo = hexDe(patch.visual.cor_fundo);
    const corTitulos = hexDe(patch.visual.cor_titulos);
    const corTexto = hexDe(patch.visual.cor_texto);
    const corTextoSuave = hexDe(patch.visual.cor_texto_suave);
    const redePedida = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "whatsappFlutuante"].some(
      (chave) => typeof patch.visual?.[chave as "instagram"] === "boolean",
    );
    const agendamentoPedida = typeof patch.visual.agendamento === "boolean";
    const modoAgenda = umDe(patch.visual.modoConfirmacaoAgenda, ["manual", "automatico", "whatsapp"] as const);
    const duracaoSlot = [15, 20, 30, 45, 60, 90, 120].includes(Number(patch.visual.duracaoSlotMinutos))
      ? Number(patch.visual.duracaoSlotMinutos)
      : 0;
    if (paleta || tipo || cab || rodapeLayout || logoTamanho || logoAlinhamento || banner || animacao || estilo || botao || aparenciaPedida || accent || fundo || corTitulos || corTexto || corTextoSuave || redePedida || agendamentoPedida || modoAgenda || duracaoSlot) {
      if (paleta) visual.paletaId = paleta.id;
      if (tipo) visual.tipografiaId = tipo.id;
      if (cab) visual.cabecalho = cab;
      if (rodapeLayout) visual.rodapeLayout = rodapeLayout;
      if (logoTamanho) visual.logoTamanho = logoTamanho;
      if (logoAlinhamento) visual.logoAlinhamento = logoAlinhamento;
      if (banner) visual.banner = banner;
      if (animacao) visual.animacao = animacao;
      if (estilo) visual.estilo = estilo;
      if (botao) visual.botao = botao;
      if (agendamentoPedida) visual.agendamento = patch.visual.agendamento as boolean;
      if (modoAgenda) visual.modoConfirmacaoAgenda = modoAgenda;
      if (duracaoSlot) visual.duracaoSlotMinutos = duracaoSlot;
      if (aparenciaPedida) visual.aparencia = patch.visual.aparencia as VisualConfig["aparencia"];
      if (aparenciaPedida && !paleta && visual.aparencia === "claro" && (visual.paletaId === "latao-escuro" || visual.paletaId === "limão-escuro")) {
        visual.paletaId = "papel-quente";
      }
      if (aparenciaPedida && !paleta && visual.aparencia === "escuro" && (visual.paletaId === "papel-quente" || visual.paletaId === "spa" || visual.paletaId === "marinho")) {
        visual.paletaId = "latao-escuro";
      }
      if (typeof patch.visual.instagram === "boolean") visual.instagram = patch.visual.instagram;
      if (typeof patch.visual.facebook === "boolean") visual.facebook = patch.visual.facebook;
      if (typeof patch.visual.linkedin === "boolean") visual.linkedin = patch.visual.linkedin;
      if (typeof patch.visual.tiktok === "boolean") visual.tiktok = patch.visual.tiktok;
      if (typeof patch.visual.youtube === "boolean") visual.youtube = patch.visual.youtube;
      if (typeof patch.visual.whatsappFlutuante === "boolean") visual.whatsappFlutuante = patch.visual.whatsappFlutuante;
      if (accent) visual.corAccent = accent;
      else if (paleta || aparenciaPedida) visual.corAccent = undefined;
      if (fundo) visual.corFundo = fundo;
      else if (paleta || aparenciaPedida) visual.corFundo = undefined;
      if (corTitulos) visual.corTitulos = corTitulos;
      else if (paleta || aparenciaPedida) visual.corTitulos = undefined;
      if (corTexto) visual.corTexto = corTexto;
      else if (paleta || aparenciaPedida) visual.corTexto = undefined;
      if (corTextoSuave) visual.corTextoSuave = corTextoSuave;
      else if (paleta || aparenciaPedida) visual.corTextoSuave = undefined;
      aplicarVisualNoTema(site, visual);
      tocou.visual = true;
    }
  }

  if (patch.marca) {
    const m = patch.marca;
    const nichoMarca = corta(obj(site.meta).nicho, 40) || "generico";
    const tipoPedido = umDe(m.tipo, ["icone", "emblema", "arquivo", "texto"] as const);
    const iconeId = m.icone ? iconePorId(m.icone)?.id || "" : "";
    const emblemaTexto = corta(m.emblema, 48);
    const emblemaId = emblemaTexto
      ? emblemasDoNicho(nichoMarca).find((e) => e.id === emblemaTexto || semAcento(e.nome) === semAcento(emblemaTexto))?.id || ""
      : "";
    const arquivoId = m.arquivo && arquivosDoNicho(nichoMarca).includes(m.arquivo) ? m.arquivo : "";
    let tipo: "icone" | "emblema" | "arquivo" | "texto" | "" =
      tipoPedido ||
      (arquivoId ? "arquivo" : emblemaId ? "emblema" : iconeId ? "icone" : "");
    const layoutPedido = umDe(m.layout, LAYOUTS_LOGO.map((l) => l.id) as readonly LayoutLogo[]);
    if (layoutPedido === "wordmark") tipo = "texto";
    const layout = tipo === "texto" ? "wordmark" : layoutPedido || (tipo && visual.logoOrigem !== tipo ? "lado" : "");
    const fonteId = FONTES_LOGO.find((f) => f.id === m.fonteId)?.id || "";
    const corMarca = (raw: unknown) => {
      if (raw === undefined) return undefined;
      const valor = corta(raw, 12).toLowerCase();
      if (["auto", "site", "herdar"].includes(valor)) return "";
      return hexDe(raw) || undefined;
    };
    const corIcone = corMarca(m.corIcone);
    const corNome = corMarca(m.corNome);
    const corAcento = corMarca(m.corAcento);
    const simboloValido =
      (tipo === "icone" && Boolean(iconeId)) ||
      (tipo === "emblema" && Boolean(emblemaId)) ||
      (tipo === "arquivo" && Boolean(arquivoId)) ||
      tipo === "texto";
    if (simboloValido || layout || fonteId || corIcone !== undefined || corNome !== undefined || corAcento !== undefined) {
      marcaPatch = {
        ...(simboloValido && tipo ? { tipo } : {}),
        ...(tipo === "icone" && iconeId ? { icone: iconeId } : {}),
        ...(tipo === "emblema" && emblemaId ? { emblema: emblemaId } : {}),
        ...(tipo === "arquivo" && arquivoId ? { arquivo: arquivoId } : {}),
        ...(layout ? { layout } : {}),
        ...(fonteId ? { fonteId } : {}),
        ...(corIcone !== undefined ? { corIcone } : {}),
        ...(corNome !== undefined ? { corNome } : {}),
        ...(corAcento !== undefined ? { corAcento } : {}),
        ...(m.gerarOpcoes ? { gerarOpcoes: true } : {}),
      };
      if (simboloValido) {
        visual.logoOrigem = tipo as VisualConfig["logoOrigem"];
        visual.logoIcone = tipo === "icone" ? iconeId : undefined;
        visual.logoEmblema = tipo === "emblema" ? emblemaId : undefined;
        visual.logoArquivo = tipo === "arquivo" ? arquivoId : undefined;
      }
      if (layout) visual.logoLayout = layout;
      if (fonteId) visual.logoFonteId = fonteId;
      if (corIcone !== undefined) visual.logoCorIcone = corIcone || undefined;
      if (corNome !== undefined) visual.logoCorNome = corNome || undefined;
      if (corAcento !== undefined) visual.logoCorAcento = corAcento || undefined;
      if (simboloValido) {
        const logo = { ...obj(empresa.logo) };
        logo.src =
          tipo === "arquivo"
            ? arquivoId
            : uriMarcaViva(
                {
                  id: "marca-ia",
                  origem: "manual",
                  icone: visual.logoIcone || "",
                  emblema: visual.logoEmblema,
                  layout: visual.logoLayout || "lado",
                  fonteId: visual.logoFonteId || "system",
                  corIcone: visual.logoCorIcone,
                  corNome: visual.logoCorNome,
                  corAcento: visual.logoCorAcento,
                },
                {
                  nome: corta(empresa.nome, 80) || "Seu negócio",
                  slogan: corta(empresa.slogan, 80),
                  acento: visual.logoCorAcento || String(obj(site.tema).color_accent || "#D4B483"),
                },
              );
        logo.alt = corta(empresa.nome, 80) || "Logo";
        delete logo.credito;
        empresa.logo = logo;
        site.empresa = empresa;
      }
      tocou.marca = true;
    }
  }

  const logoSrc = sanitizarLogoSrc(patch.midia?.logo?.src);
  const fotosPedido = [
    ...(Array.isArray(patch.midia?.fotos) ? patch.midia!.fotos! : []),
    ...(patch.midia?.foto ? [patch.midia.foto] : []),
  ];
  if (logoSrc) {
    const empresaLogo = { ...obj(site.empresa) };
    const logo = { ...obj(empresaLogo.logo) };
    logo.src = logoSrc;
    logo.alt = corta(empresaLogo.nome, 80) || "Logo";
    delete logo.credito;
    if (!logo.id) logo.id = "logo_cliente";
    if (!logo.categoria) logo.categoria = "logo";
    empresaLogo.logo = logo;
    site.empresa = empresaLogo;
    visual.logoOrigem = undefined;
    visual.logoIcone = undefined;
    visual.logoEmblema = undefined;
    visual.logoArquivo = undefined;
    visual.logoLayout = undefined;
    visual.logoFonteId = undefined;
    visual.logoCorIcone = undefined;
    visual.logoCorNome = undefined;
    visual.logoCorAcento = undefined;
    tocou.midia = true;
  }
  const SLOTS_FOTO = new Set(["hero", "sobre", "galeria", "servico", "profissional", "evento"]);
  const slotsVistos = new Set<string>();
  for (const item of fotosPedido) {
    const slot = item?.slot;
    if (item?.limpar && slot === "profissional") {
      const bloco = { ...obj(site.profissionais) };
      const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
      const indice = Number.isFinite(Number(item.indice)) ? Math.max(0, Number(item.indice)) : 0;
      if (itens[indice]) {
        const pessoa = { ...itens[indice] };
        const foto: Record<string, unknown> = { ...obj(pessoa.foto), src: "", alt: "Foto da equipe a confirmar" };
        delete foto.credito;
        pessoa.foto = foto;
        itens[indice] = pessoa;
        bloco.itens = itens;
        site.profissionais = bloco;
        tocou.midia = true;
      }
      continue;
    }
    const src = sanitizarFotoSrc(item?.src);
    if (!src || !slot || !SLOTS_FOTO.has(slot)) continue;
    const chave = `${slot}:${item.indice ?? 0}`;
    if (slotsVistos.has(chave)) continue;
    slotsVistos.add(chave);
    const indice = Number(item.indice);
    const i = Number.isFinite(indice) ? indice : 0;
    const tipoSlot = slot as "hero" | "sobre" | "galeria" | "servico" | "profissional" | "evento";
    aplicarSrcNoSlot(site, { tipo: tipoSlot, indice: i }, src, item.credito as Record<string, unknown> | undefined);
    const credito = item.credito;
    if ((slot === "hero" || slot === "sobre" || slot === "galeria" || slot === "servico") && credito?.fotografo && credito.perfil_url && credito.texto) {
      gravarCredito(site, slot, i, {
        fotografo: corta(credito.fotografo, 80),
        perfil_url: corta(credito.perfil_url, 240),
        texto: corta(credito.texto, 160),
        unsplash_url: corta(credito.unsplash_url, 240),
      });
    }
    tocou.midia = true;
  }

  const abrir = patch.abrir === "logo" || patch.abrir === "hero" || patch.abrir === "sobre" || patch.abrir === "galeria" ? patch.abrir : "";
  const avisoModelo = corta(patch.aviso_estrutura, 220);
  const dadosMudaram =
    JSON.stringify({ site, visual }) !== estadoInicial ||
    Boolean(avisosExtra?.length || (redesExtra && Object.keys(redesExtra).length));
  const mudou = abrir !== "" || dadosMudaram;
  if (!dadosMudaram) {
    for (const chave of Object.keys(tocou) as (keyof TocouPedido)[]) tocou[chave] = false;
    if (!abrir) avisos.push("Não houve uma alteração efetiva. Confira o pedido e tente novamente.");
  }
  const aviso = [avisoModelo, ...avisos].filter(Boolean).join(" ");
  const resumo = dadosMudaram ? corta(patch.resumo, 220) || "Atualizei o que cabia neste site." : "";
  return {
    site,
    visual,
    resumo,
    aviso,
    abrir,
    tocou,
    nicho: nichoNovo || undefined,
    expediente: expedienteNovo,
    marca: marcaPatch,
    avisos: avisosExtra,
    redes: redesExtra,
  };
}
