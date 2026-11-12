/** Logomarcas desenhadas (PNG) por ofício. */

function faixa(nicho: string, n: number) {
  return Array.from({ length: n }, (_, i) => `/marcas/${nicho}/${String(i + 1).padStart(2, "0")}.png`);
}

export const MARCAS_ARQUIVO: Record<string, string[]> = {
  barbearia: faixa("barbearia", 28),
  salao: faixa("salao", 32),
  estetica: faixa("estetica", 23),
  petshop: faixa("petshop", 19),
  academia: faixa("academia", 22),
  contabilidade: faixa("contabilidade", 13),
  advocacia: faixa("advocacia", 27),
  dentista: faixa("dentista", 25),
  clinica: faixa("clinica", 20),
  psicologia: faixa("psicologia", 26),
  nutricionista: faixa("nutricionista", 25),
};

export function arquivosDoNicho(nicho: string): string[] {
  return MARCAS_ARQUIVO[nicho] || [];
}
