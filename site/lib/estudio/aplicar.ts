import { aplicarDadosCliente } from "@/lib/automacao/aplicar-cliente";
import type { EntradaAutomacao } from "@/lib/automacao/tipos";
import { aplicarVisualNoTema, type VisualConfig } from "./visual";

export interface LinhaServico {
  nome: string;
  preco?: string;
  duracao?: string;
}

export interface LinhaPro {
  nome: string;
  cargo?: string;
}

export function aplicarEstudio(
  site: Record<string, unknown>,
  opts: {
    entrada: EntradaAutomacao;
    visual: VisualConfig;
    logoSrc?: string;
    servicos?: LinhaServico[];
    profissionais?: LinhaPro[];
  },
) {
  aplicarDadosCliente(site, opts.entrada);
  aplicarVisualNoTema(site, opts.visual);

  const empresa = { ...(site.empresa as Record<string, unknown>) };
  const logo = { ...((empresa.logo as Record<string, unknown>) || {}) };
  if (opts.logoSrc) {
    if (!logo.id) logo.id = "img_logo_marca";
    logo.src = opts.logoSrc;
    logo.alt = opts.entrada.nome;
    logo.categoria = "logo";
    logo.origem = "upload";
    delete logo.credito;
  }
  empresa.logo = logo;
  const ig = String(opts.entrada.instagram || "").replace(/^@/, "").trim();
  if (ig) {
    const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
    const idx = redes.findIndex((r) => r.id === "instagram");
    const item = {
      id: "instagram",
      label: "Instagram",
      url: `https://instagram.com/${ig}`,
    };
    if (idx >= 0) redes[idx] = { ...redes[idx], ...item };
    else redes.push(item);
    empresa.redes = redes;
  }
  site.empresa = empresa;

  if (opts.servicos?.length) {
    const bloco = { ...((site.servicos as Record<string, unknown>) || {}) };
    const atuais = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
    bloco.itens = opts.servicos.map((s, i) => {
      const base = atuais[i] || {};
      return {
        ...base,
        id: String(base.id || `srv-${i + 1}`),
        nome: s.nome,
        preco_label: s.preco || base.preco_label || "",
        duracao_label: s.duracao || base.duracao_label || "",
      };
    });
    site.servicos = bloco;
  }

  if (opts.profissionais?.length) {
    const bloco = { ...((site.profissionais as Record<string, unknown>) || {}) };
    const atuais = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
    bloco.itens = opts.profissionais.map((p, i) => {
      const base = atuais[i] || {};
      return {
        ...base,
        id: String(base.id || `pro-${i + 1}`),
        nome: p.nome,
        cargo: p.cargo || base.cargo || "",
      };
    });
    site.profissionais = bloco;
  }

  return site;
}

export function sanitizarLogoSrc(raw: unknown) {
  const s = String(raw || "");
  if (!s) return undefined;
  if (s.length > 380_000) return undefined;
  if (!s.startsWith("data:image/")) return undefined;
  return s;
}
