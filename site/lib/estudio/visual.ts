/** Visual do rascunho — fora do schema 1.0.0 congelado. Mapeia o que der para `tema`. */

import { urlCanal, urlSegura } from "./canais";

export type ModoAparencia = "claro" | "escuro" | "automatico";
export type EstiloVisual = "moderno" | "luxo" | "urbano" | "classico" | "suave";
export type CabecalhoLayout = "logo-esquerda" | "centralizado" | "logo-slogan" | "logo-direita" | "menu-abaixo" | "compacto";
export type RodapeLayout = "centralizado" | "dividido" | "empilhado" | "minimo";
export type LogoTamanho = "pequeno" | "medio" | "grande";
export type BannerLayout = "automatico" | "solido" | "degrade";
export type Animacao = "suave" | "media" | "intensa";
export type BotaoEstilo = "arredondado" | "quadrado" | "pílula" | "sem-contorno";

export interface VisualConfig {
  aparencia: ModoAparencia;
  paletaId: string;
  tipografiaId: string;
  estilo: EstiloVisual;
  cabecalho: CabecalhoLayout;
  rodapeLayout: RodapeLayout;
  logoTamanho: LogoTamanho;
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
  linkedinUrl?: string;
  redesExtra?: { id: string; label: string; url: string }[];
  rotulosRede?: Record<string, string>;
  presetId?: string;
  /** Agenda por profissional — fora do schema congelado. */
  agendaEquipe?: Array<{ nome: string; dias: string[]; inicio?: string; fim?: string; nota?: string }>;
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
  };
  const preset = PRESETS.find((p) => p.id === (map[nicho || ""] || "barbearia-classica"))!;
  return {
    aparencia: "escuro",
    paletaId: "latao-escuro",
    tipografiaId: "editorial",
    estilo: "moderno",
    cabecalho: "logo-esquerda",
    rodapeLayout: "centralizado",
    logoTamanho: "medio",
    banner: "automatico",
    botao: "arredondado",
    animacao: "suave",
    whatsappFlutuante: true,
    instagram: true,
    facebook: true,
    linkedin: true,
    tiktok: true,
    youtube: true,
    agendamento: true,
    presetId: preset.id,
    ...preset.visual,
  };
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

export function aplicarVisualNoTema(site: Record<string, unknown>, visual: VisualConfig) {
  const paleta = paletaPorId(visual.paletaId);
  const tipo = tipoPorId(visual.tipografiaId);
  const tema = { ...((site.tema as Record<string, unknown>) || {}) };
  Object.assign(tema, {
    color_primary: paleta.color_primary,
    color_secondary: paleta.color_secondary,
    color_accent: paleta.color_accent,
    color_background: paleta.color_background,
    color_surface: paleta.color_surface,
    color_text: paleta.color_text,
    color_text_muted: paleta.color_text_muted,
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
