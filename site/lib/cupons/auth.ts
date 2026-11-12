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

/** Logins liberados nos painéis internos (mesma lista dos avisos de compra). */
export const EMAILS_PAINEL = ["msmoromija@gmail.com", "atendimento@guix.net.br"];

export function emailsPainel() {
  const extras = (process.env.GUIX_OPS_EMAILS || process.env.GUIX_OPS_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...EMAILS_PAINEL, ...extras])];
}

export function emailPainelConfere(valor: string | null | undefined) {
  const email = String(valor || "").trim().toLowerCase();
  return Boolean(email) && emailsPainel().includes(email);
}

/** Login do painel: e-mail autorizado + senha atual de orçamentos. */
export function loginPainelConfere(email: string | null | undefined, senha: string | null | undefined) {
  return emailPainelConfere(email) && senhaComercialConfere(senha);
}
