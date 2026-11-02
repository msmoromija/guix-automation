import type { CategoriaImagem } from "./tipos";

/** Requisitos por slot de banner (enquadramento no site). */
export interface SlotBanner {
  categoria: CategoriaImagem;
  label: string;
  /** Largura / altura alvo do crop. */
  aspect: number;
  /** Largura mínima da imagem original (px). */
  minW: number;
  /** Altura mínima da imagem original (px). */
  minH: number;
  /** Largura de saída após enquadrar (px). */
  outW: number;
  /** Altura de saída após enquadrar (px). */
  outH: number;
  /** Tolerância relativa do aspect (ex.: 0.25 = ±25%). Só informativo no pré-check. */
  aspectTol: number;
}

export const SLOTS: Record<CategoriaImagem, SlotBanner> = {
  hero: {
    categoria: "hero",
    label: "Banner principal (hero)",
    aspect: 16 / 9,
    minW: 1280,
    minH: 720,
    outW: 1920,
    outH: 1080,
    aspectTol: 0.35,
  },
  servico: {
    categoria: "servico",
    label: "Serviço",
    aspect: 16 / 10,
    minW: 800,
    minH: 500,
    outW: 1280,
    outH: 800,
    aspectTol: 0.3,
  },
  sobre: {
    categoria: "sobre",
    label: "Sobre",
    aspect: 4 / 5,
    minW: 600,
    minH: 750,
    outW: 960,
    outH: 1200,
    aspectTol: 0.3,
  },
  profissional: {
    categoria: "profissional",
    label: "Profissional",
    aspect: 1,
    minW: 400,
    minH: 400,
    outW: 800,
    outH: 800,
    aspectTol: 0.25,
  },
  promocao: {
    categoria: "promocao",
    label: "Promoção",
    aspect: 16 / 9,
    minW: 960,
    minH: 540,
    outW: 1600,
    outH: 900,
    aspectTol: 0.3,
  },
  evento: {
    categoria: "evento",
    label: "Evento",
    aspect: 2,
    minW: 960,
    minH: 480,
    outW: 1600,
    outH: 800,
    aspectTol: 0.35,
  },
  galeria: {
    categoria: "galeria",
    label: "Galeria",
    aspect: 1,
    minW: 600,
    minH: 600,
    outW: 1200,
    outH: 1200,
    aspectTol: 0.25,
  },
  logo: {
    categoria: "logo",
    label: "Logo",
    aspect: 1,
    minW: 128,
    minH: 128,
    outW: 512,
    outH: 512,
    aspectTol: 0.5,
  },
  og: {
    categoria: "og",
    label: "Open Graph",
    aspect: 1.91,
    minW: 1200,
    minH: 630,
    outW: 1200,
    outH: 630,
    aspectTol: 0.2,
  },
};

export function slotDaCategoria(categoria: string): SlotBanner | null {
  if (categoria in SLOTS) return SLOTS[categoria as CategoriaImagem];
  return null;
}
