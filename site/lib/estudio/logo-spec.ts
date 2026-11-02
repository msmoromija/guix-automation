import { arquivosDoNicho } from "./biblioteca-arquivos";
import { emblemaExiste, emblemasDoNicho, svgEmblema } from "./emblemas";
import { iconePorId, innerIcone } from "./icones-marca";
import { nomeMarcaLimpo } from "./simbolos";

export type LayoutLogo = "lado" | "empilhado" | "selo" | "marca" | "wordmark";
export type OrigemLogo = "ia" | "biblioteca" | "manual";

export type SpecLogo = {
  id: string;
  origem: OrigemLogo;
  icone: string;
  emblema?: string;
  arquivo?: string;
  layout: LayoutLogo;
  fonteId: string;
  corIcone?: string;
  corNome?: string;
  corAcento?: string;
};

export const CORES_LOGO = [
  { hex: "#D4B483", nome: "Latão" },
  { hex: "#C6A15B", nome: "Ouro" },
  { hex: "#E8C547", nome: "Amarelo" },
  { hex: "#6E2430", nome: "Bordô" },
  { hex: "#B42318", nome: "Vermelho" },
  { hex: "#1A3654", nome: "Marinho" },
  { hex: "#0EA5E9", nome: "Azul" },
  { hex: "#0F766E", nome: "Teal" },
  { hex: "#16A34A", nome: "Verde" },
  { hex: "#D6E26A", nome: "Limão" },
  { hex: "#7C3AED", nome: "Violeta" },
  { hex: "#E11D48", nome: "Rosa" },
  { hex: "#1A1614", nome: "Tinta" },
  { hex: "#F4F0E6", nome: "Creme" },
  { hex: "#FFFFFF", nome: "Branco" },
];

export function hexOk(v?: string) {
  return Boolean(v && /^#[0-9A-Fa-f]{6}$/.test(v));
}

/** Texto claro (fundo escuro) → inverter marca preta. */
export function tintaClara(tinta?: string) {
  const v = String(tinta || "");
  if (v === "currentColor") return true;
  if (!hexOk(v)) return false;
  const n = parseInt(v.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export const LAYOUTS_LOGO: Array<{ id: LayoutLogo; nome: string }> = [
  { id: "lado", nome: "Ícone ao lado" },
  { id: "selo", nome: "Selo" },
  { id: "marca", nome: "Ícone em quadro" },
  { id: "empilhado", nome: "Nome em duas linhas" },
  { id: "wordmark", nome: "Só o nome" },
];

export const FONTES_LOGO = [
  { id: "georgia", nome: "Georgia", css: "Georgia, 'Times New Roman', serif" },
  { id: "palatino", nome: "Palatino", css: "Palatino, 'Palatino Linotype', serif" },
  { id: "garamond", nome: "Garamond", css: "Garamond, Georgia, serif" },
  { id: "system", nome: "Sistema", css: "system-ui, 'Segoe UI', sans-serif" },
  { id: "trebuchet", nome: "Trebuchet", css: "'Trebuchet MS', sans-serif" },
  { id: "verdana", nome: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "optima", nome: "Optima", css: "Optima, Candara, sans-serif" },
  { id: "gothic", nome: "Gótico", css: "'Century Gothic', CenturyGothic, sans-serif" },
  { id: "impacto", nome: "Impacto", css: "Impact, 'Arial Black', sans-serif" },
  { id: "maquina", nome: "Máquina", css: "'Courier New', Courier, monospace" },
];

export function fonteCss(id: string) {
  return FONTES_LOGO.find((f) => f.id === id)?.css || FONTES_LOGO[0].css;
}

function esc(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] || c);
}

export function dataSvg(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function grupoIcone(id: string, cor: string, x: number, y: number, escala: number) {
  if (!id || !iconePorId(id)) return "";
  return `<g transform="translate(${x} ${y}) scale(${escala})" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${innerIcone(id)}</g>`;
}

function grupoEmblema(id: string, cor: string, acento: string, nome: string, x: number, y: number, escala: number) {
  if (!id || !emblemaExiste(id)) return "";
  return `<g transform="translate(${x} ${y}) scale(${escala})">${svgEmblema(id, cor, acento, nome)}</g>`;
}

function grupoMarca(spec: SpecLogo, corIcone: string, acento: string, nome: string, x: number, y: number, escalaLucide: number) {
  if (spec.emblema && emblemaExiste(spec.emblema)) {
    const s = Math.max(1.28, (escalaLucide * 24) / 64 * 1.35);
    return grupoEmblema(spec.emblema, corIcone, acento, nome, x, y, s);
  }
  return grupoIcone(spec.icone, corIcone, x, y, escalaLucide);
}

/** SVG sem fundo. Ícone usa cor própria (padrão: acento), não o cinza do texto. */
export function svgMarca(
  spec: SpecLogo,
  opts: { nome: string; slogan?: string; tinta: string; acento: string },
) {
  const nome = esc(nomeMarcaLimpo(opts.nome)).slice(0, 36);
  const slogan = esc(opts.slogan || "").slice(0, 42);
  const fonte = fonteCss(spec.fonteId);
  const tinta = hexOk(spec.corNome) ? spec.corNome! : opts.tinta;
  const acento = hexOk(spec.corAcento) ? spec.corAcento! : opts.acento;
  const corIcone = hexOk(spec.corIcone) ? spec.corIcone! : acento;
  const temMarca = spec.layout !== "wordmark" && Boolean(spec.emblema || spec.icone);
  const yNome = slogan ? 54 : 70;
  const nomeLimpo = nomeMarcaLimpo(opts.nome);

  if (!temMarca) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120" fill="none">
      <text x="8" y="${slogan ? 52 : 72}" font-family="${fonte}" font-size="40" font-weight="600" fill="${tinta}">${nome}</text>
      <rect x="8" y="${slogan ? 64 : 84}" width="52" height="3" fill="${acento}"/>
      ${slogan ? `<text x="8" y="92" font-family="system-ui, sans-serif" font-size="13" fill="${acento}">${slogan}</text>` : ""}
    </svg>`;
  }

  if (spec.layout === "selo" && !spec.emblema) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120" fill="none">
      <circle cx="52" cy="60" r="44" stroke="${acento}" stroke-width="2"/>
      ${grupoMarca(spec, corIcone, acento, nomeLimpo, 28, 36, 2)}
      <text x="112" y="${yNome}" font-family="${fonte}" font-size="32" font-weight="600" fill="${tinta}">${nome}</text>
      ${slogan ? `<text x="112" y="86" font-family="system-ui, sans-serif" font-size="13" fill="${acento}">${slogan}</text>` : ""}
    </svg>`;
  }

  if (spec.layout === "marca" && !spec.emblema) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120" fill="none">
      <rect x="8" y="16" width="88" height="88" rx="18" stroke="${acento}" stroke-width="1.8"/>
      ${grupoMarca(spec, corIcone, acento, nomeLimpo, 24, 32, 2.3)}
      <text x="116" y="${yNome}" font-family="${fonte}" font-size="32" font-weight="600" fill="${tinta}">${nome}</text>
      ${slogan ? `<text x="116" y="86" font-family="system-ui, sans-serif" font-size="13" fill="${acento}">${slogan}</text>` : ""}
    </svg>`;
  }

  if (spec.layout === "empilhado") {
    const partes = nomeLimpo.split(/\s+/);
    const l1 = esc(partes[0] || nome).slice(0, 22);
    const l2 = esc(partes.slice(1).join(" ")).slice(0, 28);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120" fill="none">
      ${grupoMarca(spec, corIcone, acento, nomeLimpo, 8, 16, 2.8)}
      <text x="108" y="${l2 ? 52 : 72}" font-family="${fonte}" font-size="30" font-weight="600" fill="${tinta}">${l1}</text>
      ${l2 ? `<text x="108" y="86" font-family="${fonte}" font-size="16" letter-spacing="5" fill="${acento}">${l2.toUpperCase()}</text>` : ""}
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120" fill="none">
    ${grupoMarca(spec, corIcone, acento, nomeLimpo, 8, 16, 2.8)}
    <text x="108" y="${yNome}" font-family="${fonte}" font-size="32" font-weight="600" fill="${tinta}">${nome}</text>
    ${slogan ? `<text x="108" y="86" font-family="system-ui, sans-serif" font-size="13" fill="${acento}">${slogan}</text>` : ""}
  </svg>`;
}

export function uriMarca(
  spec: SpecLogo,
  opts: { nome: string; slogan?: string; tinta: string; acento: string },
) {
  return dataSvg(svgMarca(spec, opts));
}

/** Versão do site: tinta herda a cor do cabeçalho. */
export function uriMarcaViva(
  spec: SpecLogo,
  opts: { nome: string; slogan?: string; acento: string },
) {
  return uriMarca(spec, { ...opts, tinta: "currentColor" });
}

const PALETA_NICHO: Record<string, { cores: string[]; fontes: string[]; layouts: LayoutLogo[] }> = {
  barbearia: {
    cores: ["#C6A15B", "#D4B483", "#6E2430", "#1A3654", "#1A1614"],
    fontes: ["georgia", "optima", "impacto", "palatino", "garamond"],
    layouts: ["lado", "selo", "marca", "empilhado", "lado"],
  },
  salao: {
    cores: ["#E11D48", "#7C3AED", "#C6A15B", "#D4B483", "#1A1614"],
    fontes: ["optima", "palatino", "georgia", "trebuchet", "garamond"],
    layouts: ["lado", "selo", "empilhado", "marca", "lado"],
  },
  estetica: {
    cores: ["#0F766E", "#D4B483", "#7C3AED", "#1A3654", "#16A34A"],
    fontes: ["optima", "garamond", "palatino", "georgia", "gothic"],
    layouts: ["lado", "selo", "marca", "empilhado", "lado"],
  },
  petshop: {
    cores: ["#0EA5E9", "#16A34A", "#C6A15B", "#E11D48", "#1A3654"],
    fontes: ["trebuchet", "verdana", "optima", "georgia", "gothic"],
    layouts: ["lado", "selo", "marca", "empilhado", "lado"],
  },
  academia: {
    cores: ["#B42318", "#1A1614", "#D6E26A", "#0EA5E9", "#E8C547"],
    fontes: ["impacto", "gothic", "trebuchet", "system", "verdana"],
    layouts: ["marca", "lado", "selo", "empilhado", "lado"],
  },
  advocacia: {
    cores: ["#1A3654", "#C6A15B", "#1A1614", "#6E2430", "#D4B483"],
    fontes: ["georgia", "garamond", "palatino", "optima", "impacto"],
    layouts: ["lado", "selo", "marca", "empilhado", "lado"],
  },
  contabilidade: {
    cores: ["#1A3654", "#0F766E", "#0EA5E9", "#1A1614", "#C6A15B"],
    fontes: ["system", "trebuchet", "verdana", "georgia", "optima"],
    layouts: ["lado", "marca", "selo", "empilhado", "lado"],
  },
  clinica: {
    cores: ["#0F766E", "#0EA5E9", "#1A3654", "#16A34A", "#D4B483"],
    fontes: ["optima", "georgia", "system", "trebuchet", "garamond"],
    layouts: ["lado", "selo", "marca", "empilhado", "lado"],
  },
  generico: {
    cores: ["#D4B483", "#1A3654", "#0F766E", "#7C3AED", "#1A1614"],
    fontes: ["georgia", "optima", "trebuchet", "palatino", "gothic"],
    layouts: ["lado", "selo", "marca", "empilhado", "lado"],
  },
};

export function propostasBiblioteca(nicho: string): SpecLogo[] {
  const paleta = PALETA_NICHO[nicho] || PALETA_NICHO.barbearia;
  const arquivos = arquivosDoNicho(nicho);
  if (arquivos.length) {
    return arquivos.map((arquivo, i) => ({
      id: `lib-${nicho}-arq-${i + 1}`,
      origem: "biblioteca" as const,
      icone: "",
      arquivo,
      layout: "lado" as const,
      fonteId: paleta.fontes[i % paleta.fontes.length],
      corIcone: paleta.cores[i % paleta.cores.length],
      corAcento: paleta.cores[(i + 2) % paleta.cores.length],
    }));
  }
  const marcas = emblemasDoNicho(nicho);
  const layouts: LayoutLogo[] = ["lado", "empilhado", "selo", "marca"];
  const out: SpecLogo[] = [];
  for (let i = 0; i < 20; i++) {
    const marca = marcas[i % Math.max(1, marcas.length)];
    const cor = paleta.cores[i % paleta.cores.length];
    const acento = paleta.cores[(i + 2) % paleta.cores.length];
    out.push({
      id: `lib-${nicho}-${i}-${marca?.id || "marca"}`,
      origem: "biblioteca",
      icone: "",
      emblema: marca?.id,
      layout: layouts[i % layouts.length],
      fonteId: paleta.fontes[i % paleta.fontes.length],
      corIcone: cor,
      corAcento: acento,
    });
  }
  return out;
}

export function specManual(
  icone: string,
  layout: LayoutLogo,
  fonteId: string,
  cores?: Pick<SpecLogo, "corIcone" | "corNome" | "corAcento">,
  emblema?: string,
  arquivo?: string,
): SpecLogo {
  return {
    id: `man-${arquivo || emblema || icone || "aa"}-${layout}-${fonteId}`,
    origem: "manual",
    icone: layout === "wordmark" || emblema || arquivo ? "" : icone,
    emblema: layout === "wordmark" || arquivo ? undefined : emblema,
    arquivo: layout === "wordmark" ? undefined : arquivo,
    layout,
    fonteId,
    corIcone: cores?.corIcone,
    corNome: cores?.corNome,
    corAcento: cores?.corAcento,
  };
}

export const LIMITE_IA_LOGO = 10;
export const LOTE_IA_LOGO = 5;
