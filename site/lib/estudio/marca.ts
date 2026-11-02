/** Lockups profissionais: nome inteiro + slogan. Emblema geométrico do nicho, não só iniciais. */

export type EstiloLockup = "wordmark" | "selo" | "empilhado" | "emblema";

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "G";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function esc(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] || c);
}

function dataSvg(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Símbolo do nicho — traço único, estilo marca. */
export function emblemaNicho(nicho: string, cor: string, cx = 60, cy = 60) {
  const n = nicho || "barbearia";
  if (n === "barbearia") {
    return `<g>
      <rect x="${cx - 7}" y="${cy - 26}" width="14" height="52" rx="7" fill="none" stroke="${cor}" stroke-width="2.4"/>
      <path d="M${cx - 5} ${cy - 16} Q${cx} ${cy - 8} ${cx + 5} ${cy - 16} Q${cx} ${cy - 4} ${cx - 5} ${cy - 16}" fill="${cor}"/>
      <path d="M${cx - 5} ${cy + 2} Q${cx} ${cy + 10} ${cx + 5} ${cy + 2} Q${cx} ${cy + 14} ${cx - 5} ${cy + 2}" fill="${cor}"/>
      <circle cx="${cx}" cy="${cy - 28}" r="3" fill="${cor}"/>
    </g>`;
  }
  if (n === "salao") {
    return `<g fill="none" stroke="${cor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${cx - 10} ${cy + 16} L${cx} ${cy - 18} L${cx + 10} ${cy + 16}"/>
      <path d="M${cx - 6} ${cy + 4} H${cx + 6}"/>
      <circle cx="${cx - 12}" cy="${cy + 20}" r="5"/>
      <circle cx="${cx + 12}" cy="${cy + 20}" r="5"/>
    </g>`;
  }
  if (n === "estetica") {
    return `<g fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round">
      <path d="M${cx} ${cy + 18} C${cx - 22} ${cy + 4} ${cx - 16} ${cy - 18} ${cx} ${cy - 14} C${cx + 16} ${cy - 18} ${cx + 22} ${cy + 4} ${cx} ${cy + 18}Z"/>
    </g>`;
  }
  if (n === "petshop") {
    return `<g fill="${cor}">
      <circle cx="${cx - 14}" cy="${cy - 10}" r="7"/><circle cx="${cx + 14}" cy="${cy - 10}" r="7"/>
      <circle cx="${cx - 22}" cy="${cy + 8}" r="6"/><circle cx="${cx + 22}" cy="${cy + 8}" r="6"/>
      <ellipse cx="${cx}" cy="${cy + 12}" rx="12" ry="10"/>
    </g>`;
  }
  if (n === "academia") {
    return `<g fill="none" stroke="${cor}" stroke-width="4" stroke-linecap="round">
      <path d="M${cx - 28} ${cy} H${cx + 28}"/>
      <rect x="${cx - 34}" y="${cy - 12}" width="10" height="24" rx="2" fill="${cor}" stroke="none"/>
      <rect x="${cx + 24}" y="${cy - 12}" width="10" height="24" rx="2" fill="${cor}" stroke="none"/>
    </g>`;
  }
  if (n === "advocacia") {
    return `<g fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round">
      <path d="M${cx} ${cy - 20} V${cy + 20}"/>
      <path d="M${cx - 22} ${cy - 8} H${cx + 22}"/>
      <path d="M${cx - 18} ${cy - 8} L${cx - 18} ${cy + 8} Q${cx} ${cy + 16} ${cx + 18} ${cy + 8} L${cx + 18} ${cy - 8}"/>
    </g>`;
  }
  return `<g fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round">
    <rect x="${cx - 16}" y="${cy - 18}" width="32" height="36" rx="3"/>
    <path d="M${cx - 8} ${cy - 6} H${cx + 8} M${cx - 8} ${cy + 4} H${cx + 4}"/>
  </g>`;
}

export function lockupWordmark(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
}) {
  const nome = esc(opts.nome).slice(0, 42);
  const slogan = esc(opts.slogan || "").slice(0, 72);
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="200" viewBox="0 0 720 200">
    <rect width="720" height="200" fill="${opts.fundo}"/>
    <text x="360" y="${slogan ? 88 : 108}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="36" letter-spacing="4" fill="${opts.tinta}">${nome.toUpperCase()}</text>
    <line x1="250" y1="${slogan ? 108 : 128}" x2="470" y2="${slogan ? 108 : 128}" stroke="${opts.acento}" stroke-width="1.4"/>
    ${slogan ? `<text x="360" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" letter-spacing="2.4" fill="${opts.acento}">${slogan.toUpperCase()}</text>` : ""}
  </svg>`);
}

export function lockupSelo(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho: string;
}) {
  const nome = esc(opts.nome).slice(0, 36);
  const slogan = esc(opts.slogan || "").slice(0, 48);
  const ini = iniciais(opts.nome);
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="220" viewBox="0 0 720 220">
    <rect width="720" height="220" fill="${opts.fundo}"/>
    <circle cx="140" cy="110" r="72" fill="none" stroke="${opts.acento}" stroke-width="2"/>
    <circle cx="140" cy="110" r="62" fill="none" stroke="${opts.tinta}" stroke-width="0.6" opacity="0.45"/>
    ${emblemaNicho(opts.nicho, opts.acento, 140, 110)}
    <text x="140" y="188" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="${opts.acento}" opacity="0">${ini}</text>
    <text x="250" y="${slogan ? 100 : 118}" font-family="Georgia, 'Times New Roman', serif" font-size="32" fill="${opts.tinta}">${nome}</text>
    ${slogan ? `<text x="250" y="132" font-family="system-ui, sans-serif" font-size="14" fill="${opts.acento}">${slogan}</text>` : ""}
  </svg>`);
}

export function lockupEmpilhado(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
}) {
  const partes = opts.nome.trim().split(/\s+/);
  const linha1 = esc(partes[0] || opts.nome).slice(0, 22);
  const linha2 = esc(partes.slice(1).join(" ")).slice(0, 28);
  const slogan = esc(opts.slogan || "").slice(0, 64);
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240" viewBox="0 0 720 240">
    <rect width="720" height="240" fill="${opts.fundo}"/>
    <text x="360" y="88" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="${opts.tinta}">${linha1}</text>
    ${linha2 ? `<text x="360" y="132" text-anchor="middle" font-family="Georgia, serif" font-size="28" letter-spacing="8" fill="${opts.acento}">${linha2.toUpperCase()}</text>` : ""}
    <rect x="330" y="148" width="60" height="1.5" fill="${opts.acento}"/>
    ${slogan ? `<text x="360" y="178" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${opts.tinta}" opacity="0.75">${slogan}</text>` : ""}
  </svg>`);
}

export function lockupEmblema(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho: string;
  emblemaHref?: string;
}) {
  const nome = esc(opts.nome).slice(0, 40);
  const slogan = esc(opts.slogan || "").slice(0, 64);
  const icon = opts.emblemaHref
    ? `<image href="${opts.emblemaHref}" x="36" y="48" width="112" height="112"/>`
    : emblemaNicho(opts.nicho, opts.acento, 92, 104);
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="200" viewBox="0 0 720 200">
    <rect width="720" height="200" fill="${opts.fundo}"/>
    ${icon}
    <text x="176" y="${slogan ? 92 : 112}" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="${opts.tinta}">${nome}</text>
    ${slogan ? `<text x="176" y="124" font-family="system-ui, sans-serif" font-size="14" fill="${opts.acento}">${slogan}</text>` : ""}
  </svg>`);
}

export function propostasEstudio(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho: string;
}) {
  const base = { nome: opts.nome, slogan: opts.slogan, fundo: opts.fundo, tinta: opts.tinta, acento: opts.acento };
  return [
    { id: "wordmark", titulo: "Nome escrito", nota: "Marca só com o nome, editorial", src: lockupWordmark(base) },
    { id: "empilhado", titulo: "Duas linhas", nota: "Nome empilhado, ar de casa premium", src: lockupEmpilhado(base) },
    { id: "selo", titulo: "Selo do ofício", nota: "Símbolo + nome ao lado", src: lockupSelo({ ...base, nicho: opts.nicho }) },
    { id: "emblema", titulo: "Emblema", nota: "Símbolo à esquerda e o nome", src: lockupEmblema({ ...base, nicho: opts.nicho }) },
  ];
}

export function gerarMarcaSvg(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho?: string;
}) {
  return lockupEmblema({ ...opts, nicho: opts.nicho || "barbearia" });
}
