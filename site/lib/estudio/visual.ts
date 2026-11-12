/** Visual do rascunho — fora do schema 1.0.0 congelado. Mapeia o que der para `tema`. */

import { urlCanal, urlSegura } from "./canais";

export type ModoAparencia = "claro" | "escuro" | "automatico";
export type EstiloVisual = "moderno" | "luxo" | "urbano" | "classico" | "suave";
export type CabecalhoLayout = "logo-esquerda" | "centralizado" | "logo-slogan" | "logo-direita" | "menu-abaixo" | "compacto";
export type RodapeLayout = "centralizado" | "dividido" | "empilhado" | "minimo";
export type LogoTamanho = "pequeno" | "medio" | "grande";
export type OrigemMarca = "icone" | "emblema" | "arquivo" | "texto";
export type LogoAlinhamento = "centro" | "topo" | "base";
export type BannerLayout = "automatico" | "solido" | "degrade";
export type Animacao = "suave" | "media" | "intensa";
export type BotaoEstilo = "arredondado" | "quadrado" | "pílula" | "sem-contorno";
export type EquipeFotoForma = "circulo" | "quadrado";
export type EquipeFotoTamanho = "pequeno" | "medio" | "grande";

export interface VisualConfig {
  aparencia: ModoAparencia;
  paletaId: string;
  tipografiaId: string;
  estilo: EstiloVisual;
  cabecalho: CabecalhoLayout;
  rodapeLayout: RodapeLayout;
  logoTamanho: LogoTamanho;
  /** Ícone × texto do lockup no cabeçalho. */
  logoAlinhamento: LogoAlinhamento;
  /** Cores do lockup (PNG da biblioteca / ajuste manual). */
  logoCorIcone?: string;
  logoCorNome?: string;
  logoCorAcento?: string;
  /** Configuração da marca gerada pela IA e persistida no protótipo. */
  logoIcone?: string;
  logoEmblema?: string;
  logoArquivo?: string;
  logoOrigem?: OrigemMarca;
  logoLayout?: "lado" | "empilhado" | "selo" | "marca" | "wordmark";
  logoFonteId?: string;
  /** Cor de destaque manual (sobrepõe a paleta). Aceita #RRGGBB. */
  corAccent?: string;
  /** Cor de fundo manual (sobrepõe a paleta). Aceita #RRGGBB. */
  corFundo?: string;
  /** Cores de texto personalizadas (sobrepõem os tons da paleta). */
  corTitulos?: string;
  corTexto?: string;
  corTextoSuave?: string;
  banner: BannerLayout;
  botao: BotaoEstilo;
  animacao: Animacao;
  whatsappFlutuante: boolean;
  instagram: boolean;
  facebook: boolean;
  linkedin: boolean;
  tiktok: boolean;
  youtube: boolean;
  agendamento: boolean;
  /**
   * Como o horário é confirmado quando agendamento está ligado:
   * - manual: profissional aceita no painel (padrão)
   * - automatico: confirma na hora
   * - whatsapp: profissional confirma pelo WhatsApp
   */
  modoConfirmacaoAgenda?: "manual" | "automatico" | "whatsapp";
  linkedinUrl?: string;
  redesExtra?: { id: string; label: string; url: string }[];
  rotulosRede?: Record<string, string>;
  presetId?: string;
  /** Moldura da foto na seção equipe. */
  equipeFotoForma?: EquipeFotoForma;
  /** Tamanho da foto na seção equipe. */
  equipeFotoTamanho?: EquipeFotoTamanho;
  /** Duração de cada vaga na agenda (15–120). Padrão 30. */
  duracaoSlotMinutos?: number;
  /** Agenda por profissional — fora do schema congelado. */
  agendaEquipe?: Array<{
    nome: string;
    /** Legado: só ids de dia. Novo: grade com início/fim e pausa. */
    dias: Array<
      | string
      | {
          dia: string;
          inicio: string;
          fim: string;
          pausa?: boolean;
          pausaInicio?: string;
          pausaFim?: string;
        }
    >;
    inicio?: string;
    fim?: string;
    nota?: string;
    ausencias?: Array<{ de: string; ate: string; motivo: string }>;
  }>;
}

export interface Paleta {
  id: string;
  nome: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  color_surface: string;
  color_text: string;
  color_text_muted: string;
}

export interface Tipografia {
  id: string;
  nome: string;
  font_heading: string;
  font_body: string;
}

export const PALETAS: Paleta[] = [
  {
    id: "latao-escuro",
    nome: "Latão noturno",
    color_primary: "#111111",
    color_secondary: "#C6A15B",
    color_accent: "#D4B483",
    color_background: "#0C0C0C",
    color_surface: "#171717",
    color_text: "#F4F0E6",
    color_text_muted: "#C8C2B4",
  },
  {
    id: "papel-quente",
    nome: "Papel quente",
    color_primary: "#3F2A26",
    color_secondary: "#C4A484",
    color_accent: "#B88962",
    color_background: "#F7F4F1",
    color_surface: "#FFFFFF",
    color_text: "#3F2A26",
    color_text_muted: "#7A655C",
  },
  {
    id: "spa",
    nome: "Spa claro",
    color_primary: "#1E3330",
    color_secondary: "#C4A882",
    color_accent: "#8FA89A",
    color_background: "#F4F6F3",
    color_surface: "#FFFFFF",
    color_text: "#1E3330",
    color_text_muted: "#5B6E68",
  },
  {
    id: "limão-escuro",
    nome: "Farol",
    color_primary: "#101418",
    color_secondary: "#D6E26A",
    color_accent: "#D6E26A",
    color_background: "#101418",
    color_surface: "#1A2128",
    color_text: "#F3F4F6",
    color_text_muted: "#A8B0B8",
  },
  {
    id: "marinho",
    nome: "Marinho papel",
    color_primary: "#1A3654",
    color_secondary: "#1A3654",
    color_accent: "#C4A15A",
    color_background: "#F4F6F8",
    color_surface: "#FFFFFF",
    color_text: "#1A3654",
    color_text_muted: "#5A6B7A",
  },
  {
    id: "bordô",
    nome: "Bordô marfim",
    color_primary: "#1A1A1A",
    color_secondary: "#6E2430",
    color_accent: "#6E2430",
    color_background: "#F6F4F1",
    color_surface: "#FFFFFF",
    color_text: "#1A1A1A",
    color_text_muted: "#6B6560",
  },
];

export const TIPOGRAFIAS: Tipografia[] = [
  { id: "editorial", nome: "Editorial", font_heading: "Oswald", font_body: "Manrope" },
  { id: "luxo", nome: "Luxo", font_heading: "Playfair Display", font_body: "Lora" },
  { id: "limpo", nome: "Limpo", font_heading: "Inter", font_body: "Inter" },
  { id: "urbano", nome: "Urbano", font_heading: "Bebas Neue", font_body: "DM Sans" },
  { id: "suave", nome: "Suave", font_heading: "Cormorant Garamond", font_body: "Source Sans 3" },
];

export const PRESETS: Array<{
  id: string;
  nome: string;
  desc: string;
  visual: Partial<VisualConfig>;
}> = [
  {
    id: "barbearia-classica",
    nome: "Barbearia clássica",
    desc: "Escuro, latão, títulos fortes",
    visual: {
      aparencia: "escuro",
      paletaId: "latao-escuro",
      tipografiaId: "editorial",
      estilo: "classico",
      cabecalho: "logo-esquerda",
      botao: "arredondado",
      animacao: "suave",
    },
  },
  {
    id: "salao-quente",
    nome: "Salão acolhedor",
    desc: "Claro, papel, elegante",
    visual: {
      aparencia: "claro",
      paletaId: "papel-quente",
      tipografiaId: "suave",
      estilo: "moderno",
      cabecalho: "logo-slogan",
      botao: "pílula",
      animacao: "suave",
    },
  },
  {
    id: "premium",
    nome: "Luxo / premium",
    desc: "Contraste alto, serifada",
    visual: {
      aparencia: "escuro",
      paletaId: "bordô",
      tipografiaId: "luxo",
      estilo: "luxo",
      cabecalho: "centralizado",
      botao: "quadrado",
      animacao: "media",
    },
  },
  {
    id: "urbano",
    nome: "Urbano / jovem",
    desc: "Energia, acento limão",
    visual: {
      aparencia: "escuro",
      paletaId: "limão-escuro",
      tipografiaId: "urbano",
      estilo: "urbano",
      cabecalho: "logo-esquerda",
      botao: "sem-contorno",
      animacao: "intensa",
    },
  },
  {
    id: "spa",
    nome: "Estética / spa",
    desc: "Claro, respiro, calmo",
    visual: {
      aparencia: "claro",
      paletaId: "spa",
      tipografiaId: "suave",
      estilo: "suave",
      cabecalho: "logo-slogan",
      botao: "pílula",
      animacao: "suave",
    },
  },
  {
    id: "corporativo",
    nome: "Escritório",
    desc: "Marinho, direto",
    visual: {
      aparencia: "claro",
      paletaId: "marinho",
      tipografiaId: "limpo",
      estilo: "moderno",
      cabecalho: "logo-esquerda",
      botao: "arredondado",
      animacao: "suave",
    },
  },
];

export function sanitizarVisual(raw: Partial<VisualConfig> | null | undefined): Partial<VisualConfig> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<VisualConfig> = { ...raw };
  if (typeof out.linkedinUrl === "string") {
    out.linkedinUrl = urlCanal("linkedin", out.linkedinUrl) || undefined;
  }
  if (Array.isArray(out.redesExtra)) {
    out.redesExtra = out.redesExtra
      .map((r) => ({
        id: String(r.id || "").slice(0, 24),
        label: String(r.label || "").slice(0, 32),
        url: urlSegura(String(r.url || "")) || urlCanal(String(r.id || ""), String(r.url || "")),
      }))
      .filter((r) => r.id && r.url);
  }
  if (out.logoOrigem && !["icone", "emblema", "arquivo", "texto"].includes(out.logoOrigem)) out.logoOrigem = undefined;
  if (out.logoLayout && !["lado", "empilhado", "selo", "marca", "wordmark"].includes(out.logoLayout)) out.logoLayout = undefined;
  if (out.logoIcone && !/^[A-Za-z][A-Za-z0-9-]{0,39}$/.test(out.logoIcone)) out.logoIcone = undefined;
  if (out.logoEmblema && !/^[a-z0-9-]{1,48}$/.test(out.logoEmblema)) out.logoEmblema = undefined;
  if (out.logoArquivo && !/^\/marcas\/[a-z0-9-]+\/\d{2}\.png$/.test(out.logoArquivo)) out.logoArquivo = undefined;
  if (out.logoFonteId && !/^[a-z]{3,16}$/.test(out.logoFonteId)) out.logoFonteId = undefined;
  for (const campo of ["logoCorIcone", "logoCorNome", "logoCorAcento"] as const) {
    if (out[campo] && !/^#[0-9A-Fa-f]{6}$/.test(out[campo] || "")) out[campo] = undefined;
  }
  for (const campo of ["corTitulos", "corTexto", "corTextoSuave"] as const) {
    if (out[campo] && !/^#[0-9A-Fa-f]{6}$/.test(out[campo] || "")) out[campo] = undefined;
  }
  return out;
}

export function visualPadrao(nicho?: string): VisualConfig {
  const map: Record<string, string> = {
    barbearia: "barbearia-classica",
    salao: "salao-quente",
    estetica: "spa",
    academia: "urbano",
    contabilidade: "corporativo",
    advocacia: "premium",
    petshop: "salao-quente",
    dentista: "spa",
    clinica: "spa",
    psicologia: "premium",
    nutricionista: "spa",
  };
  const preset = PRESETS.find((p) => p.id === (map[nicho || ""] || "corporativo"))!;
  return {
    aparencia: "escuro",
    paletaId: "latao-escuro",
    tipografiaId: "editorial",
    estilo: "moderno",
    cabecalho: "logo-esquerda",
    rodapeLayout: "centralizado",
    logoTamanho: "medio",
    logoAlinhamento: "centro",
    banner: "automatico",
    botao: "arredondado",
    animacao: "suave",
    equipeFotoForma: "circulo",
    equipeFotoTamanho: "medio",
    duracaoSlotMinutos: 30,
    whatsappFlutuante: true,
    instagram: true,
    facebook: true,
    linkedin: true,
    tiktok: true,
    youtube: true,
    agendamento: true,
    // Cliente finaliza no site; dono pode mudar para manual/WhatsApp no painel
    modoConfirmacaoAgenda: "automatico",
    ...preset.visual,
    presetId: preset.id,
  };
}

export type ModoConfirmacaoAgenda = NonNullable<VisualConfig["modoConfirmacaoAgenda"]>;

export function normalizarModoConfirmacaoAgenda(v: unknown): ModoConfirmacaoAgenda {
  if (v === "automatico" || v === "whatsapp" || v === "manual") return v;
  return "manual";
}

export function paletaPorId(id: string) {
  return PALETAS.find((p) => p.id === id) || PALETAS[0];
}

export function tipoPorId(id: string) {
  return TIPOGRAFIAS.find((t) => t.id === id) || TIPOGRAFIAS[0];
}

export function raioDoBotao(botao: BotaoEstilo): "none" | "sm" | "md" | "lg" {
  if (botao === "quadrado" || botao === "sem-contorno") return "none";
  if (botao === "arredondado") return "md";
  return "lg";
}

function hexCor(v?: string) {
  return v && /^#[0-9A-Fa-f]{6}$/.test(v) ? v : "";
}

export function aplicarVisualNoTema(site: Record<string, unknown>, visual: VisualConfig) {
  const paleta = paletaPorId(visual.paletaId);
  const tipo = tipoPorId(visual.tipografiaId);
  const tema = { ...((site.tema as Record<string, unknown>) || {}) };
  const accent = hexCor(visual.corAccent) || paleta.color_accent;
  const fundo = hexCor(visual.corFundo);
  const corTexto = hexCor(visual.corTexto) || paleta.color_text;
  const corTextoSuave = hexCor(visual.corTextoSuave) || paleta.color_text_muted;
  Object.assign(tema, {
    color_primary: paleta.color_primary,
    color_secondary: paleta.color_secondary,
    color_accent: accent,
    color_background: fundo || paleta.color_background,
    color_surface: fundo || paleta.color_surface,
    color_text: corTexto,
    color_text_muted: corTextoSuave,
    font_heading: tipo.font_heading,
    font_body: tipo.font_body,
    radius: raioDoBotao(visual.botao),
  });
  site.tema = tema;
  return site;
}

export function googleFontsHref(visual: VisualConfig) {
  const tipo = tipoPorId(visual.tipografiaId);
  const fam = [tipo.font_heading, tipo.font_body]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${fam}&display=swap`;
}
