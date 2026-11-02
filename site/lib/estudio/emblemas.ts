/** Marcas vetoriais preenchidas (64×64). Não são ícones de traço. */

function iniDe(nome?: string) {
  const p = String(nome || "Casa")
    .replace(/[<>&"]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (!p.length) return "C";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function tesoura(c: string, rot = -38) {
  return `<g transform="translate(32 32) rotate(${rot})">
    <path fill="${c}" fill-rule="evenodd" d="M-14 8 a7.2 7.2 0 1 0 0.01 0 zm0 3.1 a4.1 4.1 0 1 1 -0.01 0"/>
    <path fill="${c}" fill-rule="evenodd" d="M14 8 a7.2 7.2 0 1 0 0.01 0 zm0 3.1 a4.1 4.1 0 1 1 -0.01 0"/>
    <path fill="${c}" d="M-8 4 L-2.2 -20 L2.4 -18.6 L-3.2 3.2 Z"/>
    <path fill="${c}" d="M8 4 L2.2 -20 L-2.4 -18.6 L3.2 3.2 Z"/>
    <circle cx="0" cy="1.6" r="2.4" fill="${c}"/>
  </g>`;
}

function pente(c: string) {
  return `<g fill="${c}">
    <rect x="14" y="16" width="36" height="8" rx="2"/>
    <rect x="16" y="24" width="3.2" height="24" rx="1"/>
    <rect x="22" y="24" width="3.2" height="26" rx="1"/>
    <rect x="28" y="24" width="3.2" height="24" rx="1"/>
    <rect x="34" y="24" width="3.2" height="26" rx="1"/>
    <rect x="40" y="24" width="3.2" height="24" rx="1"/>
    <rect x="46" y="24" width="3.2" height="22" rx="1"/>
  </g>`;
}

function navalha(c: string) {
  return `<g fill="${c}">
    <path d="M12 40 L18 22 C20 16 26 14 32 16 L50 24 L46 36 C40 34 34 36 30 42 L22 52 Z"/>
    <rect x="44" y="20" width="10" height="18" rx="2" transform="rotate(22 49 29)"/>
  </g>`;
}

function coroa(c: string) {
  return `<path fill="${c}" d="M10 44 L12 22 L22 34 L32 14 L42 34 L52 22 L54 44 Z M14 48 H50 V52 H14 Z"/>`;
}

function poltrona(c: string) {
  return `<g fill="${c}">
    <rect x="18" y="18" width="28" height="18" rx="4"/>
    <rect x="12" y="32" width="40" height="10" rx="3"/>
    <rect x="16" y="42" width="5" height="10" rx="1.5"/>
    <rect x="43" y="42" width="5" height="10" rx="1.5"/>
  </g>`;
}

function listras(c: string) {
  return `<g fill="${c}">
    <rect x="16" y="12" width="8" height="40" rx="4"/>
    <rect x="28" y="12" width="8" height="40" rx="4"/>
    <rect x="40" y="12" width="8" height="40" rx="4"/>
  </g>`;
}

function relogio(c: string) {
  return `<g>
    <circle cx="32" cy="34" r="18" fill="${c}"/>
    <circle cx="32" cy="34" r="12" fill="none" stroke="#F7F4F1" stroke-width="1.4"/>
    <path d="M32 34 L32 26 M32 34 L38 36" stroke="#F7F4F1" stroke-width="2" stroke-linecap="round"/>
    <rect x="29" y="10" width="6" height="8" rx="1" fill="${c}"/>
  </g>`;
}

function flor(c: string) {
  return `<g fill="${c}">
    <circle cx="32" cy="18" r="8"/>
    <circle cx="46" cy="26" r="8"/>
    <circle cx="46" cy="42" r="8"/>
    <circle cx="32" cy="48" r="8"/>
    <circle cx="18" cy="42" r="8"/>
    <circle cx="18" cy="26" r="8"/>
    <circle cx="32" cy="32" r="7"/>
  </g>`;
}

function gota(c: string) {
  return `<path fill="${c}" d="M32 8 C32 8 14 30 14 40 a18 18 0 0 0 36 0 C50 30 32 8 32 8 Z"/>`;
}

function brilho(c: string) {
  return `<path fill="${c}" d="M32 6 L36 26 L56 32 L36 38 L32 58 L28 38 L8 32 L28 26 Z"/>`;
}

function paleta(c: string) {
  return `<g fill="${c}">
    <path d="M18 14 C40 8 56 20 52 38 C48 54 28 58 18 46 C8 34 8 20 18 14 Z"/>
    <circle cx="26" cy="24" r="3" fill="#F7F4F1"/>
    <circle cx="38" cy="22" r="3" fill="#F7F4F1"/>
    <circle cx="42" cy="34" r="3" fill="#F7F4F1"/>
    <circle cx="30" cy="38" r="3" fill="#F7F4F1"/>
  </g>`;
}

function folha(c: string) {
  return `<path fill="${c}" d="M12 44 C12 22 28 8 52 10 C48 36 36 52 14 52 C18 46 20 40 12 44 Z M28 22 L24 46"/>`;
}

function pata(c: string) {
  return `<g fill="${c}">
    <ellipse cx="32" cy="40" rx="14" ry="12"/>
    <circle cx="16" cy="24" r="6"/>
    <circle cx="28" cy="16" r="6"/>
    <circle cx="40" cy="16" r="6"/>
    <circle cx="50" cy="24" r="6"/>
  </g>`;
}

function osso(c: string) {
  return `<g fill="${c}">
    <rect x="16" y="28" width="32" height="8" rx="3"/>
    <circle cx="14" cy="24" r="7"/>
    <circle cx="14" cy="40" r="7"/>
    <circle cx="50" cy="24" r="7"/>
    <circle cx="50" cy="40" r="7"/>
  </g>`;
}

function halter(c: string) {
  return `<g fill="${c}">
    <rect x="8" y="20" width="8" height="24" rx="1"/>
    <rect x="14" y="24" width="6" height="16" rx="1"/>
    <rect x="20" y="30" width="24" height="4" rx="1"/>
    <rect x="44" y="24" width="6" height="16" rx="1"/>
    <rect x="48" y="20" width="8" height="24" rx="1"/>
  </g>`;
}

function alvo(c: string) {
  return `<g>
    <circle cx="32" cy="32" r="22" fill="${c}"/>
    <circle cx="32" cy="32" r="14" fill="none" stroke="#F7F4F1" stroke-width="3"/>
    <circle cx="32" cy="32" r="5" fill="#F7F4F1"/>
  </g>`;
}

function balanca(c: string) {
  return `<g fill="${c}">
    <rect x="30" y="12" width="4" height="36"/>
    <rect x="22" y="10" width="20" height="4" rx="1"/>
    <path d="M8 24 H28 L24 38 H12 Z"/>
    <path d="M36 24 H56 L52 38 H40 Z"/>
    <rect x="18" y="48" width="28" height="4"/>
  </g>`;
}

function coluna(c: string) {
  return `<g fill="${c}">
    <rect x="14" y="12" width="36" height="6"/>
    <rect x="18" y="18" width="6" height="28"/>
    <rect x="29" y="18" width="6" height="28"/>
    <rect x="40" y="18" width="6" height="28"/>
    <rect x="12" y="46" width="40" height="6"/>
  </g>`;
}

function calc(c: string) {
  return `<g fill="${c}">
    <rect x="14" y="10" width="36" height="44" rx="4"/>
    <rect x="18" y="14" width="28" height="10" rx="1" fill="#F7F4F1"/>
    <rect x="18" y="28" width="8" height="6" rx="1" fill="#F7F4F1"/>
    <rect x="28" y="28" width="8" height="6" rx="1" fill="#F7F4F1"/>
    <rect x="38" y="28" width="8" height="6" rx="1" fill="#F7F4F1"/>
    <rect x="18" y="38" width="8" height="6" rx="1" fill="#F7F4F1"/>
    <rect x="28" y="38" width="8" height="6" rx="1" fill="#F7F4F1"/>
    <rect x="38" y="38" width="8" height="10" rx="1" fill="#F7F4F1"/>
  </g>`;
}

function cruz(c: string) {
  return `<path fill="${c}" d="M26 8 H38 V26 H56 V38 H38 V56 H26 V38 H8 V26 H26 Z"/>`;
}

function coracao(c: string) {
  return `<path fill="${c}" d="M32 52 L12 32 C6 26 6 16 14 12 C22 8 28 12 32 18 C36 12 42 8 50 12 C58 16 58 26 52 32 Z"/>`;
}

function diamante(c: string) {
  return `<path fill="${c}" d="M32 8 L56 32 L32 56 L8 32 Z"/>`;
}

function anel(c: string, r = 30.5, sw = 2.2) {
  return `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
}
function anelDuplo(c: string) {
  return `${anel(c, 31, 2)}${anel(c, 26.5, 0.9)}`;
}
function disco(c: string, r = 32) {
  return `<circle cx="32" cy="32" r="${r}" fill="${c}"/>`;
}
function escudo(c: string) {
  return `<path fill="${c}" d="M32 4 L58 14 V34 C58 50 32 62 32 62 C32 62 6 50 6 34 V14 Z"/>`;
}
function quadro(c: string) {
  return `<rect x="4" y="4" width="56" height="56" rx="10" fill="${c}"/>`;
}

function punch(inner: string) {
  return `<g transform="translate(32 32) scale(0.62) translate(-32 -32)">${inner}</g>`;
}

export type EmblemaDef = { id: string; nome: string };

const FUNDOS_ESCUROS = new Set(["#1A1614", "#1A3654", "#6E2430", "#B42318", "#0F766E", "#7C3AED"]);

function tintaPunch(fundo: string) {
  return FUNDOS_ESCUROS.has(fundo.toUpperCase()) ? "#F7F4F1" : "#1A1614";
}

type Builder = (c: string, a: string, nome?: string) => string;

const BUILDERS: Record<string, Builder> = {
  "tesoura-disco": (c) => disco(c) + punch(tesoura(tintaPunch(c))),
  "tesoura-anel": (c, a) => anelDuplo(c) + punch(tesoura(a || c)),
  "tesoura-escudo": (c) => escudo(c) + punch(tesoura(tintaPunch(c))),
  "tesoura-livre": (c) => tesoura(c),
  "pente-quadro": (c) => quadro(c) + punch(pente(tintaPunch(c))),
  "navalha-disco": (c) => disco(c) + punch(navalha(tintaPunch(c))),
  "coroa-anel": (c, a) => anelDuplo(c) + punch(coroa(a || c)),
  "poltrona-anel": (c, a) => anelDuplo(c) + punch(poltrona(a || c)),
  "listras-disco": (c) => disco(c) + punch(listras(tintaPunch(c))),
  "relogio-anel": (c, a) => anelDuplo(c) + `<g transform="translate(32 32) scale(0.72) translate(-32 -32)">${relogio(a || c)}</g>`,
  "iniciais-escudo": (c, _a, nome) =>
    escudo(c) +
    `<text x="32" y="38" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="700" fill="${tintaPunch(c)}">${iniDe(nome)}</text>`,
  "iniciais-disco": (c, _a, nome) =>
    disco(c) +
    `<text x="32" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="700" fill="${tintaPunch(c)}">${iniDe(nome)}</text>`,
  "iniciais-anel": (c, a, nome) =>
    anelDuplo(c) +
    `<text x="32" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="700" fill="${a || c}">${iniDe(nome)}</text>`,
  "flor-disco": (c) => disco(c) + punch(flor(tintaPunch(c))),
  "gota-anel": (c, a) => anelDuplo(c) + punch(gota(a || c)),
  "brilho-disco": (c) => disco(c) + punch(brilho(tintaPunch(c))),
  "paleta-anel": (c, a) => anelDuplo(c) + punch(paleta(a || c)),
  "folha-escudo": (c) => escudo(c) + punch(folha(tintaPunch(c))),
  "pata-disco": (c) => disco(c) + punch(pata(tintaPunch(c))),
  "osso-anel": (c, a) => anelDuplo(c) + punch(osso(a || c)),
  "halter-disco": (c) => disco(c) + punch(halter(tintaPunch(c))),
  "alvo-anel": (c, a) => anelDuplo(c) + punch(alvo(a || c)),
  "balanca-escudo": (c) => escudo(c) + punch(balanca(tintaPunch(c))),
  "coluna-anel": (c, a) => anelDuplo(c) + punch(coluna(a || c)),
  "calc-quadro": (c) => quadro(c) + punch(calc(tintaPunch(c))),
  "cruz-disco": (c) => disco(c) + punch(cruz(tintaPunch(c))),
  "coracao-anel": (c, a) => anelDuplo(c) + punch(coracao(a || c)),
  "diamante-anel": (c, a) => anelDuplo(c) + punch(diamante(a || c)),
  "folha-disco": (c) => disco(c) + punch(folha(tintaPunch(c))),
  "gota-disco": (c) => disco(c) + punch(gota(tintaPunch(c))),
};

export function svgEmblema(id: string, cor: string, acento: string, nome?: string) {
  const fn = BUILDERS[id] || BUILDERS["tesoura-disco"];
  return fn(cor, acento, nome);
}

export function uriEmblema(id: string, cor: string, acento: string, nome?: string) {
  const inner = svgEmblema(id, cor, acento, nome);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">${inner}</svg>`,
  )}`;
}

export function emblemaExiste(id: string) {
  return Boolean(BUILDERS[id]);
}

const POR_NICHO: Record<string, EmblemaDef[]> = {
  barbearia: [
    { id: "tesoura-disco", nome: "Tesoura em selo" },
    { id: "tesoura-anel", nome: "Tesoura em anel" },
    { id: "tesoura-escudo", nome: "Tesoura em escudo" },
    { id: "tesoura-livre", nome: "Tesoura" },
    { id: "pente-quadro", nome: "Pente" },
    { id: "navalha-disco", nome: "Navalha" },
    { id: "coroa-anel", nome: "Coroa" },
    { id: "poltrona-anel", nome: "Poltrona" },
    { id: "listras-disco", nome: "Listras" },
    { id: "relogio-anel", nome: "Relógio" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "iniciais-disco", nome: "Iniciais em selo" },
  ],
  salao: [
    { id: "tesoura-disco", nome: "Tesoura em selo" },
    { id: "tesoura-anel", nome: "Tesoura em anel" },
    { id: "flor-disco", nome: "Flor" },
    { id: "gota-anel", nome: "Gota" },
    { id: "brilho-disco", nome: "Brilho" },
    { id: "paleta-anel", nome: "Paleta" },
    { id: "coroa-anel", nome: "Coroa" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "folha-disco", nome: "Folha" },
    { id: "tesoura-escudo", nome: "Tesoura em escudo" },
  ],
  estetica: [
    { id: "folha-escudo", nome: "Folha em escudo" },
    { id: "folha-disco", nome: "Folha em selo" },
    { id: "gota-anel", nome: "Gota" },
    { id: "gota-disco", nome: "Gota em selo" },
    { id: "flor-disco", nome: "Flor" },
    { id: "brilho-disco", nome: "Brilho" },
    { id: "coracao-anel", nome: "Coração" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "paleta-anel", nome: "Paleta" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
  ],
  petshop: [
    { id: "pata-disco", nome: "Pata" },
    { id: "osso-anel", nome: "Osso" },
    { id: "coracao-anel", nome: "Coração" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "pata-disco", nome: "Pata em selo" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "brilho-disco", nome: "Brilho" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "folha-disco", nome: "Folha" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "osso-anel", nome: "Osso em anel" },
    { id: "coracao-anel", nome: "Cuidado" },
  ],
  academia: [
    { id: "halter-disco", nome: "Halter" },
    { id: "alvo-anel", nome: "Alvo" },
    { id: "brilho-disco", nome: "Raio" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "listras-disco", nome: "Barras" },
    { id: "alvo-anel", nome: "Alvo em anel" },
    { id: "halter-disco", nome: "Peso" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "coroa-anel", nome: "Coroa" },
    { id: "brilho-disco", nome: "Estrela" },
  ],
  advocacia: [
    { id: "balanca-escudo", nome: "Balança" },
    { id: "coluna-anel", nome: "Colunas" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "coluna-anel", nome: "Pórtico" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "balanca-escudo", nome: "Justiça" },
    { id: "coroa-anel", nome: "Coroa" },
    { id: "folha-escudo", nome: "Folha" },
    { id: "iniciais-disco", nome: "Monograma" },
    { id: "diamante-anel", nome: "Selo" },
  ],
  contabilidade: [
    { id: "calc-quadro", nome: "Calculadora" },
    { id: "coluna-anel", nome: "Colunas" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "calc-quadro", nome: "Livro" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "alvo-anel", nome: "Meta" },
    { id: "coluna-anel", nome: "Pórtico" },
    { id: "brilho-disco", nome: "Crescimento" },
    { id: "iniciais-disco", nome: "Monograma" },
    { id: "diamante-anel", nome: "Selo" },
  ],
  clinica: [
    { id: "cruz-disco", nome: "Cruz" },
    { id: "coracao-anel", nome: "Coração" },
    { id: "folha-disco", nome: "Folha" },
    { id: "gota-anel", nome: "Gota" },
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "cruz-disco", nome: "Selo médico" },
    { id: "folha-escudo", nome: "Cuidado" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "gota-disco", nome: "Gota em selo" },
    { id: "coracao-anel", nome: "Acolhimento" },
    { id: "brilho-disco", nome: "Brilho" },
  ],
  generico: [
    { id: "iniciais-disco", nome: "Iniciais" },
    { id: "iniciais-escudo", nome: "Iniciais em escudo" },
    { id: "iniciais-anel", nome: "Iniciais em anel" },
    { id: "diamante-anel", nome: "Losango" },
    { id: "brilho-disco", nome: "Brilho" },
    { id: "coroa-anel", nome: "Coroa" },
    { id: "folha-disco", nome: "Folha" },
    { id: "alvo-anel", nome: "Alvo" },
    { id: "listras-disco", nome: "Barras" },
    { id: "flor-disco", nome: "Flor" },
    { id: "gota-anel", nome: "Gota" },
    { id: "iniciais-disco", nome: "Monograma" },
  ],
};

export function emblemasDoNicho(nicho: string): EmblemaDef[] {
  const lista = POR_NICHO[nicho] || POR_NICHO.barbearia;
  const vistos = new Set<string>();
  return lista.filter((e) => {
    if (vistos.has(e.id)) return false;
    vistos.add(e.id);
    return Boolean(BUILDERS[e.id]);
  });
}
