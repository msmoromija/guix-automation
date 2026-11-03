/** Senha do painel comercial (cupons + pedidos) — só altera neste arquivo. */
export const SENHA_PAINEL_COMERCIAL = "19881986";

/** @deprecated use SENHA_PAINEL_COMERCIAL */
export const SENHA_PAINEL_CUPONS = SENHA_PAINEL_COMERCIAL;

export function senhaCuponsConfere(valor: string | null | undefined) {
  return String(valor || "").trim() === SENHA_PAINEL_COMERCIAL;
}

export function senhaComercialConfere(valor: string | null | undefined) {
  return senhaCuponsConfere(valor);
}
