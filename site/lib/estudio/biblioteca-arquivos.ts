/** Logomarcas desenhadas (PNG) por ofício. */

function faixa(nicho: string, n: number) {
  return Array.from({ length: n }, (_, i) => `/marcas/${nicho}/${String(i + 1).padStart(2, "0")}.png`);
}

export const MARCAS_ARQUIVO: Record<string, string[]> = {
  barbearia: faixa("barbearia", 28),
  salao: faixa("salao", 32),
  estetica: faixa("estetica", 23),
  petshop: faixa("petshop", 15),
  academia: faixa("academia", 15),
  contabilidade: faixa("contabilidade", 13),
  advocacia: faixa("advocacia", 17),
};

export function arquivosDoNicho(nicho: string): string[] {
  return MARCAS_ARQUIVO[nicho] || [];
}
