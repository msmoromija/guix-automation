import { idSimboloPadrao, nomeMarcaLimpo, svgSimbolo } from "./simbolos";

export type ModoLockup = "lado" | "selo" | "wordmark" | "empilhado";

export function iniciais(nome: string) {
  const partes = nomeMarcaLimpo(nome).split(/\s+/).filter(Boolean);
  if (!partes.length) return "G";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function esc(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] || c);
}

export function dataSvg(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function emblemaNicho(nicho: string, cor: string, cx = 48, cy = 48) {
  const inner = svgSimbolo(nicho || "generico", idSimboloPadrao(nicho), cor).replace(/<\/?svg[^>]*>/g, "");
  const dx = cx - 48;
  const dy = cy - 48;
  return `<g transform="translate(${dx} ${dy})">${inner}</g>`;
}

function fonteNome(nicho: string) {
  if (nicho === "advocacia" || nicho === "contabilidade") return "Georgia, 'Times New Roman', serif";
  if (nicho === "academia") return "system-ui, 'Segoe UI', sans-serif";
  return "Georgia, 'Times New Roman', serif";
}

export function lockupWordmark(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho?: string;
}) {
  const nome = esc(nomeMarcaLimpo(opts.nome)).slice(0, 36);
  const slogan = esc(opts.slogan || "").slice(0, 64);
  const fonte = fonteNome(opts.nicho || "");
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120">
    <text x="12" y="${slogan ? 52 : 72}" font-family="${fonte}" font-size="40" letter-spacing="1.2" fill="${opts.tinta}">${nome}</text>
    <rect x="12" y="${slogan ? 64 : 84}" width="56" height="3" fill="${opts.acento}"/>
    ${slogan ? `<text x="12" y="92" font-family="system-ui, sans-serif" font-size="14" fill="${opts.acento}">${slogan}</text>` : ""}
  </svg>`);
}

export function lockupEmpilhado(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho?: string;
}) {
  const limpo = nomeMarcaLimpo(opts.nome);
  const partes = limpo.split(/\s+/);
  const linha1 = esc(partes[0] || limpo).slice(0, 22);
  const linha2 = esc(partes.slice(1).join(" ")).slice(0, 28);
  const fonte = fonteNome(opts.nicho || "");
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120">
    <text x="12" y="${linha2 ? 48 : 72}" font-family="${fonte}" font-size="36" fill="${opts.tinta}">${linha1}</text>
    ${linha2 ? `<text x="12" y="86" font-family="${fonte}" font-size="22" letter-spacing="6" fill="${opts.acento}">${linha2.toUpperCase()}</text>` : ""}
  </svg>`);
}

function innerDeSvg(svg: string) {
  return svg.replace(/<\/?svg[^>]*>/gi, "");
}

function lockupComSimbolo(opts: {
  nome: string;
  slogan?: string;
  tinta: string;
  acento: string;
  nicho: string;
  id: string;
  modo: "lado" | "selo";
}) {
  const nome = esc(nomeMarcaLimpo(opts.nome)).slice(0, 32);
  const slogan = esc(opts.slogan || "").slice(0, 48);
  const fonte = fonteNome(opts.nicho);
  const mark = innerDeSvg(svgSimbolo(opts.nicho, opts.id, opts.acento));

  if (opts.modo === "selo") {
    return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120">
      <circle cx="52" cy="60" r="44" fill="none" stroke="${opts.acento}" stroke-width="2"/>
      <g transform="translate(20 28) scale(0.67)">${mark}</g>
      <text x="112" y="${slogan ? 54 : 68}" font-family="${fonte}" font-size="32" fill="${opts.tinta}">${nome}</text>
      ${slogan ? `<text x="112" y="82" font-family="system-ui, sans-serif" font-size="13" fill="${opts.acento}">${slogan}</text>` : ""}
    </svg>`);
  }

  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="120" viewBox="0 0 720 120">
    <rect x="4" y="12" width="96" height="96" rx="18" fill="none" stroke="${opts.acento}" stroke-width="1.6"/>
    <g transform="translate(8 16)">${mark}</g>
    <text x="120" y="${slogan ? 54 : 70}" font-family="${fonte}" font-size="32" fill="${opts.tinta}">${nome}</text>
    ${slogan ? `<text x="120" y="82" font-family="system-ui, sans-serif" font-size="13" fill="${opts.acento}">${slogan}</text>` : ""}
  </svg>`);
}

export function lockupDaEscolha(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho: string;
  simboloId: string;
  modo: ModoLockup;
}) {
  if (opts.modo === "wordmark" || !opts.simboloId) return lockupWordmark(opts);
  if (opts.modo === "empilhado") return lockupEmpilhado(opts);
  return lockupComSimbolo({
    nome: opts.nome,
    slogan: opts.slogan,
    tinta: opts.tinta,
    acento: opts.acento,
    nicho: opts.nicho,
    id: opts.simboloId,
    modo: opts.modo === "selo" ? "selo" : "lado",
  });
}

export function lockupEmblema(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho: string;
}) {
  return lockupDaEscolha({
    ...opts,
    simboloId: idSimboloPadrao(opts.nicho),
    modo: "lado",
  });
}

export function gerarMarcaSvg(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho?: string;
}) {
  return lockupEmblema({ ...opts, nicho: opts.nicho || "generico" });
}
