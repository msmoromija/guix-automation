import { aplicarSrcNoSlot, minutosDeRotulo, precoDeRotulo, sanitizarFotoSrc, sanitizarLogoSrc, tituloVenha, type LinhaServico } from "@/lib/estudio/aplicar";
import { horarioDireto, telefoneDireto } from "@/lib/estudio/pedido-fechado";
import type { CopiaViva } from "@/lib/estudio/copia-viva";
import {
  PALETAS,
  TIPOGRAFIAS,
  aplicarVisualNoTema,
  type CabecalhoLayout,
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
  empresa?: {
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
  };
  hero?: { titulo?: string; subtitulo?: string };
  sobre?: { titulo?: string; paragrafos?: string[] };
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
    acrescentar?: { titulo?: string; descricao?: string; data_label?: string; horario?: string }[];
    itens?: { titulo?: string; descricao?: string; data_label?: string; horario?: string }[];
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
    rodapeLayout?: string;
    logoTamanho?: string;
    logoAlinhamento?: string;
    banner?: string;
    botao?: string;
    animacao?: string;
    agendamento?: boolean;
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
    foto?: { slot?: string; indice?: number; src?: string; credito?: { fotografo?: string; perfil_url?: string; texto?: string; unsplash_url?: string } };
    fotos?: Array<{ slot?: string; indice?: number; src?: string; credito?: { fotografo?: string; perfil_url?: string; texto?: string; unsplash_url?: string } }>;
    logo?: { src?: string };
  };
};

export const LIMITE_FAQ = 10;

export type TocouPedido = {
  contato: boolean;
  textos: boolean;
  servicos: boolean;
  visual: boolean;
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

export function contextoEditavel(site: Record<string, unknown>, visual?: Partial<VisualConfig>) {
  const empresa = obj(site.empresa);
  const end = obj(empresa.endereco);
  const hero = obj(site.hero);
  const sobre = obj(site.sobre);
  const servicos = obj(site.servicos);
  const faq = obj(site.faq);
  const difs = obj(site.diferenciais);
  const header = obj(site.header);
  const rodape = obj(site.rodape);
  const itens = Array.isArray(servicos.itens) ? (servicos.itens as Record<string, unknown>[]) : [];
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
    profissionais: (Array.isArray(obj(site.profissionais).itens) ? (obj(site.profissionais).itens as Record<string, unknown>[]) : [])
      .filter((p) => corta(p.nome, 2) && corta(p.nome, 40) !== "Sem preferência")
      .slice(0, 8)
      .map((p) => ({
        nome: corta(p.nome, 60),
        cargo: corta(p.cargo, 40),
        descricao: corta(p.descricao, 140),
      })),
    motor: {
      pode: [
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
        "header",
        "rodape",
        "redes",
        "midia",
      ],
      paletas: ["latao-escuro", "papel-quente", "spa", "limão-escuro", "marinho", "bordô"],
      fontes: ["editorial", "luxo", "limpo", "urbano", "suave"],
      cabecalhos: ["logo-esquerda", "logo-slogan", "centralizado", "menu-abaixo"],
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
      agendamento: visual?.agendamento !== false,
      estilo: visual?.estilo || "",
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

export function servicosDoSite(site: Record<string, unknown>): LinhaServico[] {
  const itens = Array.isArray(obj(site.servicos).itens) ? (obj(site.servicos).itens as Record<string, unknown>[]) : [];
  return itens.map((s) => ({
    nome: corta(s.nome, 60),
    descricao: corta(s.descricao, 320),
    preco: corta(s.preco_label, 32) || "Sob consulta",
    duracao: corta(s.duracao_label, 32) || "30 min",
    imagemSrc: corta(obj(s.imagem).src, 2000),
  }));
}

export function copiaDoSite(site: Record<string, unknown>): CopiaViva {
  const hero = obj(site.hero);
  const sobre = obj(site.sobre);
  const contato = obj(site.contato);
  const faq = obj(site.faq);
  const servicos = obj(site.servicos);
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
  };
}

function aplicarServicos(site: Record<string, unknown>, patch: NonNullable<PatchPedido["servicos"]>, avisos: string[]) {
  const bloco = { ...obj(site.servicos) };
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
    if (i < 0) continue;
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
  if (!itens.length) return;
  bloco.itens = itens;
  site.servicos = bloco;
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

export function aplicarPedido(siteIn: Record<string, unknown>, visualIn: VisualConfig, patch: PatchPedido): ResultadoPedido {
  const site = siteIn;
  const visual: VisualConfig = { ...visualIn };
  const avisos: string[] = [];
  const tocou: TocouPedido = {
    contato: false,
    textos: false,
    servicos: false,
    visual: false,
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
  const empresa = { ...obj(site.empresa) };

  if (patch.empresa) {
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
    site.empresa = empresa;
  }

  if (patch.hero?.titulo || patch.hero?.subtitulo) {
    const hero = { ...obj(site.hero) };
    if (patch.hero.titulo) hero.titulo = corta(patch.hero.titulo, 90);
    if (patch.hero.subtitulo) hero.subtitulo = corta(patch.hero.subtitulo, 180);
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
      textoPreenchido(patch.eventos.titulo) ||
      textoPreenchido(patch.eventos.acrescentar) ||
      textoPreenchido(patch.eventos.itens))
  ) {
    aplicarEventos(site, patch.eventos, avisos);
    tocou.eventos = true;
    tocou.textos = true;
  }

  if (patch.servicos && (patch.servicos.sem_preco === true || textoPreenchido(patch.servicos))) {
    aplicarServicos(site, patch.servicos, avisos);
    tocou.servicos = true;
  }
  if (
    patch.profissionais &&
    (patch.profissionais.ocultar === true ||
      patch.profissionais.limpar === true ||
      textoPreenchido(patch.profissionais.atualizar) ||
      textoPreenchido(patch.profissionais.acrescentar) ||
      textoPreenchido(patch.profissionais.remover))
  ) {
    const bloco = { ...obj(site.profissionais) };
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
      if (itens.length >= 8) {
        avisos.push("A equipe fica com no máximo 8 profissionais.");
        break;
      }
      const nome = corta(item.nome, 60);
      if (!nome || nome === "Novo nome") continue;
      itens.push({
        id: `pro_extra_${itens.length + 1}`,
        nome,
        cargo: corta(item.cargo, 40),
        descricao: corta(item.descricao, 240),
        whatsapp: corta(item.whatsapp, 20),
        email: corta(item.email, 80),
      });
    }
    bloco.itens = itens;
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
    const redePedida = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "whatsappFlutuante"].some(
      (chave) => typeof patch.visual?.[chave as "instagram"] === "boolean",
    );
    const agendamentoPedida = typeof patch.visual.agendamento === "boolean";
    if (paleta || tipo || cab || rodapeLayout || logoTamanho || logoAlinhamento || banner || animacao || estilo || botao || aparenciaPedida || accent || fundo || redePedida || agendamentoPedida) {
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
      aplicarVisualNoTema(site, visual);
      const tema = { ...obj(site.tema) };
      if (accent) tema.color_accent = accent;
      if (fundo) {
        tema.color_background = fundo;
        tema.color_surface = fundo;
      }
      site.tema = tema;
      tocou.visual = true;
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
    tocou.midia = true;
  }
  const slotsVistos = new Set<string>();
  for (const item of fotosPedido) {
    const src = sanitizarFotoSrc(item?.src);
    const slot = item?.slot;
    if (!src || (slot !== "hero" && slot !== "sobre" && slot !== "galeria" && slot !== "servico")) continue;
    const chave = `${slot}:${item.indice ?? 0}`;
    if (slotsVistos.has(chave)) continue;
    slotsVistos.add(chave);
    const indice = Number(item.indice);
    const i = Number.isFinite(indice) ? indice : 0;
    aplicarSrcNoSlot(site, { tipo: slot, indice: i }, src, item.credito as Record<string, unknown> | undefined);
    const credito = item.credito;
    if (credito?.fotografo && credito.perfil_url && credito.texto) {
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
  const aviso = [avisoModelo, ...avisos].filter(Boolean).join(" ");
  const mudou = abrir !== "" || Object.values(tocou).some(Boolean);
  const resumo = corta(patch.resumo, 220) || (mudou ? "Atualizei o que cabia neste site." : "");
  return { site, visual, resumo, aviso, abrir, tocou, avisos: avisosExtra, redes: redesExtra };
}
