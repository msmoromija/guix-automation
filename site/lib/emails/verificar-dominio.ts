import { resolveTxt } from "dns/promises";

export async function txtPublicoPresente(nome: string, valor: string) {
  try {
    const registros = await resolveTxt(nome);
    return registros.some((partes) => partes.join("").trim() === valor);
  } catch {
    return false;
  }
}
