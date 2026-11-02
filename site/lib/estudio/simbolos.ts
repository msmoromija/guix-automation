/** Catálogo de marcas do ofício — o cliente escolhe, a IA não inventa salsicha. */

export function nomeMarcaLimpo(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of partes) {
    if (out.length && out[out.length - 1].toLowerCase() === w.toLowerCase()) continue;
    out.push(w);
  }
  return out.join(" ") || nome.trim();
}

export type ItemSimbolo = { id: string; nome: string };

type Def = ItemSimbolo & { desenho: (c: string) => string };

function tesouraAberta(c: string) {
  return `<g fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="74" r="11"/>
    <circle cx="72" cy="74" r="11"/>
    <path d="M32 66 L78 14"/>
    <path d="M64 66 L18 14"/>
    <circle cx="48" cy="50" r="4.5" fill="${c}" stroke="none"/>
    <path d="M40 56 H56"/>
  </g>`;
}

function pente(c: string) {
  return `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 22 V78"/>
    <path d="M22 22 H78"/>
    <path d="M22 40 H70"/>
    <path d="M36 22 V40 M50 22 V40 M64 22 V40 M78 22 V40"/>
  </g>`;
}

function navalha(c: string) {
  return `<g stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 62 L72 26 L80 40 L24 76 Z" fill="${c}" stroke="none"/>
    <rect x="12" y="58" width="26" height="16" rx="3" fill="none"/>
    <path d="M72 26 L86 18" fill="none"/>
  </g>`;
}

const CATALOGO: Record<string, Def[]> = {
  barbearia: [
    { id: "tesoura", nome: "Tesoura", desenho: tesouraAberta },
    { id: "pente", nome: "Pente", desenho: pente },
    { id: "navalha", nome: "Navalha", desenho: navalha },
    {
      id: "bigode",
      nome: "Bigode",
      desenho: (c) =>
        `<path fill="${c}" d="M10 52c14-22 26-10 38 4 12-14 24-26 38-4-18 18-28 8-38 4-10 4-20 14-38-4z"/>`,
    },
    {
      id: "maquina",
      nome: "Máquina",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="30" y="14" width="36" height="50" rx="7"/>
          <rect x="38" y="24" width="20" height="14" rx="2"/>
          <path d="M30 64 L24 84 L36 64 M42 64 L36 84 L48 64 M54 64 L48 84 L60 64 M66 64 L60 84 L72 64" fill="${c}" stroke="none"/>
        </g>`,
    },
    {
      id: "cadeira",
      nome: "Cadeira",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M28 22 V48"/>
          <path d="M28 32 H62"/>
          <path d="M26 48 H70"/>
          <path d="M34 48 V78 M62 48 V78"/>
          <path d="M28 78 H40 M56 78 H68"/>
          <circle cx="48" cy="62" r="5" fill="${c}" stroke="none"/>
        </g>`,
    },
    {
      id: "laco",
      nome: "Laço",
      desenho: (c) =>
        `<g fill="${c}">
          <path d="M16 48 L40 32 L40 64 Z"/>
          <path d="M80 48 L56 32 L56 64 Z"/>
          <rect x="40" y="40" width="16" height="16" rx="2"/>
        </g>`,
    },
    {
      id: "poste",
      nome: "Poste",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round">
          <circle cx="48" cy="14" r="8" fill="${c}" stroke="none"/>
          <rect x="40" y="22" width="16" height="54" rx="1"/>
          <path d="M40 30 L56 22 M40 40 L56 32 M40 50 L56 42 M40 60 L56 52 M40 70 L56 62" stroke-width="2.8"/>
          <rect x="30" y="76" width="36" height="8" rx="1" fill="${c}" stroke="none"/>
        </g>`,
    },
  ],
  salao: [
    { id: "tesoura", nome: "Tesoura", desenho: tesouraAberta },
    { id: "pente", nome: "Pente", desenho: pente },
    {
      id: "ondas",
      nome: "Mecha",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round">
          <path d="M24 78 C24 28 48 20 48 20 C48 20 72 28 72 78"/>
          <path d="M36 62 C42 46 54 46 60 62"/>
          <path d="M40 48 C44 38 52 38 56 48"/>
        </g>`,
    },
    {
      id: "secador",
      nome: "Secador",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 40 H52 L70 28 V60 L52 48 H18 Z" fill="${c}" stroke="none" opacity="0.95"/>
          <path d="M28 48 V78 H40 V56"/>
          <path d="M74 32 H84 M74 48 H86 M74 64 H84"/>
        </g>`,
    },
    {
      id: "esmalte",
      nome: "Esmalte",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <rect x="36" y="28" width="24" height="50" rx="6"/>
          <rect x="42" y="14" width="12" height="16" rx="2" fill="${c}" stroke="none"/>
        </g>`,
    },
    {
      id: "laco",
      nome: "Laço",
      desenho: (c) =>
        `<g fill="${c}">
          <path d="M16 48 L40 32 L40 64 Z"/>
          <path d="M80 48 L56 32 L56 64 Z"/>
          <rect x="40" y="40" width="16" height="16" rx="2"/>
        </g>`,
    },
  ],
  estetica: [
    {
      id: "folha",
      nome: "Folha",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <path d="M48 82 C20 58 22 24 48 30 C74 24 76 58 48 82Z"/>
          <path d="M48 34 V70"/>
        </g>`,
    },
    {
      id: "gota",
      nome: "Gota",
      desenho: (c) =>
        `<path fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" d="M48 16 C48 16 78 44 48 80 C18 44 48 16 48 16Z"/>`,
    },
    {
      id: "flor",
      nome: "Flor",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="2.8">
          <circle cx="48" cy="48" r="8" fill="${c}" stroke="none"/>
          <circle cx="48" cy="24" r="12"/><circle cx="48" cy="72" r="12"/>
          <circle cx="24" cy="48" r="12"/><circle cx="72" cy="48" r="12"/>
        </g>`,
    },
    {
      id: "lua",
      nome: "Lua",
      desenho: (c) =>
        `<path fill="${c}" d="M58 18 A34 34 0 1 0 58 78 A26 26 0 1 1 58 18Z"/>`,
    },
    {
      id: "pedras",
      nome: "Pedras",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3">
          <ellipse cx="48" cy="70" rx="28" ry="10"/>
          <ellipse cx="48" cy="54" rx="20" ry="8"/>
          <ellipse cx="48" cy="40" rx="12" ry="6"/>
        </g>`,
    },
    {
      id: "anel",
      nome: "Anel",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2">
          <circle cx="48" cy="58" r="22"/>
          <path d="M40 38 L48 16 L56 38" fill="${c}" stroke="none"/>
        </g>`,
    },
  ],
  petshop: [
    {
      id: "pata",
      nome: "Pata",
      desenho: (c) =>
        `<g fill="${c}">
          <circle cx="30" cy="30" r="9"/><circle cx="66" cy="30" r="9"/>
          <circle cx="20" cy="54" r="8"/><circle cx="76" cy="54" r="8"/>
          <ellipse cx="48" cy="64" rx="16" ry="14"/>
        </g>`,
    },
    {
      id: "osso",
      nome: "Osso",
      desenho: (c) =>
        `<g fill="${c}">
          <rect x="24" y="40" width="48" height="16" rx="8"/>
          <circle cx="22" cy="36" r="10"/><circle cx="22" cy="60" r="10"/>
          <circle cx="74" cy="36" r="10"/><circle cx="74" cy="60" r="10"/>
        </g>`,
    },
    {
      id: "focinho",
      nome: "Focinho",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <circle cx="48" cy="50" r="26"/>
          <circle cx="38" cy="44" r="4" fill="${c}" stroke="none"/>
          <circle cx="58" cy="44" r="4" fill="${c}" stroke="none"/>
          <path d="M36 58 Q48 70 60 58"/>
        </g>`,
    },
    {
      id: "casa",
      nome: "Casinha",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linejoin="round">
          <path d="M16 46 L48 16 L80 46"/>
          <path d="M24 44 V80 H72 V44"/>
          <rect x="40" y="56" width="16" height="24"/>
        </g>`,
    },
    {
      id: "gato",
      nome: "Gato",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round">
          <circle cx="48" cy="54" r="24"/>
          <path d="M28 40 L32 16 L44 40 M52 40 L64 16 L68 40"/>
          <circle cx="40" cy="52" r="3" fill="${c}" stroke="none"/>
          <circle cx="56" cy="52" r="3" fill="${c}" stroke="none"/>
        </g>`,
    },
    {
      id: "peixe",
      nome: "Peixe",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="42" cy="48" rx="26" ry="16"/>
          <path d="M66 48 L86 32 L86 64 Z" fill="${c}" stroke="none"/>
          <circle cx="30" cy="44" r="3" fill="${c}" stroke="none"/>
        </g>`,
    },
  ],
  academia: [
    {
      id: "barra",
      nome: "Barra",
      desenho: (c) =>
        `<g fill="${c}">
          <rect x="6" y="34" width="12" height="28" rx="2"/>
          <rect x="78" y="34" width="12" height="28" rx="2"/>
          <rect x="20" y="38" width="10" height="20" rx="1"/>
          <rect x="66" y="38" width="10" height="20" rx="1"/>
          <rect x="30" y="44" width="36" height="8" rx="2"/>
        </g>`,
    },
    {
      id: "halter",
      nome: "Halter",
      desenho: (c) =>
        `<g fill="${c}">
          <circle cx="22" cy="48" r="16"/>
          <circle cx="74" cy="48" r="16"/>
          <rect x="30" y="42" width="36" height="12" rx="3"/>
        </g>`,
    },
    {
      id: "alta",
      nome: "Alta",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 74 L48 22 L78 74"/><path d="M32 56 H64"/>
        </g>`,
    },
    {
      id: "raio",
      nome: "Raio",
      desenho: (c) => `<path fill="${c}" d="M54 10 L26 52 H46 L40 86 L74 40 H52 Z"/>`,
    },
    {
      id: "relogio",
      nome: "Pace",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round">
          <circle cx="48" cy="48" r="28"/>
          <path d="M48 26 V48 L66 58"/>
        </g>`,
    },
    {
      id: "pessoa",
      nome: "Atleta",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round">
          <circle cx="48" cy="20" r="10" fill="${c}" stroke="none"/>
          <path d="M24 40 L48 36 L72 40"/>
          <path d="M48 36 V62"/>
          <path d="M48 62 L30 84 M48 62 L66 84"/>
        </g>`,
    },
  ],
  advocacia: [
    {
      id: "balanca",
      nome: "Balança",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M48 14 V78"/><path d="M34 82 H62"/>
          <path d="M48 22 L16 22 L22 48 Q48 62 48 38"/>
          <path d="M48 22 L80 22 L74 48 Q48 62 48 38"/>
        </g>`,
    },
    {
      id: "livro",
      nome: "Livro",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round">
          <path d="M18 24 H48 V78 H22 Z"/>
          <path d="M78 24 H48 V78 H74 Z"/>
          <path d="M48 24 V78"/>
        </g>`,
    },
    {
      id: "colunas",
      nome: "Colunas",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round">
          <path d="M16 28 H80 L72 18 H24 Z" fill="${c}" stroke="none"/>
          <rect x="22" y="28" width="10" height="48"/>
          <rect x="43" y="28" width="10" height="48"/>
          <rect x="64" y="28" width="10" height="48"/>
          <rect x="14" y="76" width="68" height="8"/>
        </g>`,
    },
    {
      id: "martelo",
      nome: "Martelo",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round">
          <rect x="18" y="22" width="44" height="22" rx="2" fill="${c}" stroke="none"/>
          <path d="M48 44 V82"/>
        </g>`,
    },
    {
      id: "escudo",
      nome: "Escudo",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round">
          <path d="M48 12 L80 26 V50 C80 72 48 86 48 86 C48 86 16 72 16 50 V26 Z"/>
          <path d="M48 28 V68"/>
        </g>`,
    },
    {
      id: "pergaminho",
      nome: "Pergaminho",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <path d="M28 18 H72 V78 H28 Z"/>
          <path d="M38 36 H62 M38 50 H62 M38 64 H52"/>
        </g>`,
    },
  ],
  clinica: [
    {
      id: "cruz",
      nome: "Cruz",
      desenho: (c) =>
        `<g fill="${c}">
          <rect x="40" y="16" width="16" height="64" rx="3"/>
          <rect x="20" y="36" width="56" height="16" rx="3"/>
        </g>`,
    },
    {
      id: "coracao",
      nome: "Coração",
      desenho: (c) =>
        `<path fill="${c}" d="M48 80 C20 58 14 36 30 24 C38 18 46 22 48 30 C50 22 58 18 66 24 C82 36 76 58 48 80Z"/>`,
    },
    {
      id: "folha",
      nome: "Folha",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <path d="M48 82 C20 58 22 24 48 30 C74 24 76 58 48 82Z"/>
          <path d="M48 34 V70"/>
        </g>`,
    },
    {
      id: "gota",
      nome: "Gota",
      desenho: (c) =>
        `<path fill="none" stroke="${c}" stroke-width="3" d="M48 16 C48 16 78 44 48 80 C18 44 48 16 48 16Z"/>`,
    },
    {
      id: "mao",
      nome: "Cuidado",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <path d="M24 78 C24 50 48 40 72 78"/>
          <circle cx="48" cy="32" r="12"/>
        </g>`,
    },
    {
      id: "relogio",
      nome: "Hora",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round">
          <circle cx="48" cy="48" r="28"/>
          <path d="M48 26 V48 L62 56"/>
        </g>`,
    },
  ],
  generico: [
    {
      id: "losango",
      nome: "Losango",
      desenho: (c) => `<path fill="${c}" d="M48 12 L84 48 L48 84 L12 48 Z"/>`,
    },
    {
      id: "circulo",
      nome: "Círculo",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="6"><circle cx="48" cy="48" r="28"/></g>`,
    },
    {
      id: "arco",
      nome: "Arco",
      desenho: (c) =>
        `<path fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" d="M20 64 A28 28 0 1 1 76 64"/>`,
    },
    {
      id: "quadrado",
      nome: "Quadro",
      desenho: (c) => `<rect x="20" y="20" width="56" height="56" rx="8" fill="none" stroke="${c}" stroke-width="5"/>`,
    },
    {
      id: "estrela",
      nome: "Estrela",
      desenho: (c) =>
        `<path fill="${c}" d="M48 12 L56 36 H82 L62 52 L70 78 L48 62 L26 78 L34 52 L14 36 H40 Z"/>`,
    },
    {
      id: "hex",
      nome: "Hexágono",
      desenho: (c) =>
        `<path fill="none" stroke="${c}" stroke-width="4" d="M48 12 L78 30 V66 L48 84 L18 66 V30 Z"/>`,
    },
  ],
  contabilidade: [
    {
      id: "livro",
      nome: "Livro",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
          <rect x="22" y="16" width="52" height="64" rx="4"/>
          <path d="M34 34 H64 M34 48 H64 M34 62 H52"/>
        </g>`,
    },
    {
      id: "grafico",
      nome: "Gráfico",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 72 H80 M16 72 V16"/>
          <path d="M28 60 L44 40 L58 50 L76 22"/>
          <circle cx="76" cy="22" r="4" fill="${c}" stroke="none"/>
        </g>`,
    },
    {
      id: "calculadora",
      nome: "Calculadora",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3">
          <rect x="26" y="12" width="44" height="72" rx="6"/>
          <rect x="34" y="20" width="28" height="14" rx="2"/>
          <circle cx="38" cy="50" r="3" fill="${c}" stroke="none"/>
          <circle cx="48" cy="50" r="3" fill="${c}" stroke="none"/>
          <circle cx="58" cy="50" r="3" fill="${c}" stroke="none"/>
          <circle cx="38" cy="64" r="3" fill="${c}" stroke="none"/>
          <circle cx="48" cy="64" r="3" fill="${c}" stroke="none"/>
          <circle cx="58" cy="64" r="3" fill="${c}" stroke="none"/>
        </g>`,
    },
    {
      id: "moeda",
      nome: "Moeda",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3.2">
          <circle cx="48" cy="48" r="28"/>
          <path d="M40 34 C52 30 60 38 48 48 C36 58 44 66 56 62" stroke-linecap="round"/>
        </g>`,
    },
    {
      id: "colunas",
      nome: "Colunas",
      desenho: (c) =>
        `<g fill="${c}">
          <rect x="18" y="48" width="14" height="32" rx="1"/>
          <rect x="41" y="28" width="14" height="52" rx="1"/>
          <rect x="64" y="16" width="14" height="64" rx="1"/>
        </g>`,
    },
    {
      id: "pasta",
      nome: "Pasta",
      desenho: (c) =>
        `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round">
          <path d="M16 30 H40 L46 38 H80 V78 H16 Z"/>
          <path d="M16 30 V24 H38 L42 30"/>
        </g>`,
    },
  ],
};

function lista(nicho: string): Def[] {
  return CATALOGO[nicho] || CATALOGO.barbearia;
}

export function simbolosDoNicho(nicho: string): ItemSimbolo[] {
  return lista(nicho).map(({ id, nome }) => ({ id, nome }));
}

export function idSimboloPadrao(nicho: string) {
  return lista(nicho)[0].id;
}

export function rotuloSimbolo(nicho: string, id: string) {
  return lista(nicho).find((s) => s.id === id)?.nome || "Marca";
}

export function svgSimbolo(nicho: string, id: string, cor: string) {
  const item = lista(nicho).find((s) => s.id === id) || lista(nicho)[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${item.desenho(cor)}</svg>`;
}

export function proximoSimbolo(nicho: string, atual: string) {
  const ids = lista(nicho).map((s) => s.id);
  const i = ids.indexOf(atual);
  return ids[(i + 1) % ids.length];
}

export function idsSimbolos(nicho: string) {
  return lista(nicho).map((s) => s.id);
}
