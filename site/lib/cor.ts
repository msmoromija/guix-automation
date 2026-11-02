export function luminosidade(hex: string) {
  const valor = hex.replace("#", "");
  const canal = (inicio: number) => parseInt(valor.slice(inicio, inicio + 2), 16) / 255;
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
}

export function tintaSobre(hex: string) {
  return luminosidade(hex) > 0.62 ? "#1A1208" : "#F7F4EF";
}
