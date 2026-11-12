import type { NextRequest } from "next/server";
import { loginPainelConfere, senhaComercialConfere } from "@/lib/cupons/auth";

/**
 * Acesso ao módulo de e-mails.
 * - Login do painel: e-mail autorizado + senha atual de orçamentos.
 * - Tokens de serviço (PAINEL_MIDIA_TOKEN / GUIX_OPS_TOKEN) para automação.
 * - Compatibilidade: sem `email`, aceita apenas a senha do painel (links internos antigos).
 */
export function acessoEmailsAutorizado(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const email = (q.get("email") || "").trim();
  const senha = (q.get("senha") || q.get("token") || "").trim();
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";

  const servico = (process.env.PAINEL_MIDIA_TOKEN || process.env.GUIX_OPS_TOKEN || "").trim();
  if (servico && (bearer === servico || senha === servico)) return true;

  if (email) return loginPainelConfere(email, senha);
  return senhaComercialConfere(senha);
}
