/** Geração de código no browser (sem Node crypto). */
export function gerarCodigoSugestao(prefixo = "GUIX") {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sufixo = "";
  const arr = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 6; i++) sufixo += alfabeto[arr[i] % alfabeto.length];
  return `${prefixo}${sufixo}`;
}
