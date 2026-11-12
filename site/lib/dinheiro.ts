export function formatarReais(centavos: number) {
  return (centavos / 100)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00a0/g, " ");
}

export function reaisNumero(centavos: number) {
  return Number((centavos / 100).toFixed(2));
}
