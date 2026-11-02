import { NextRequest } from "next/server";
import { lerClienteId } from "./isolamento";

/** Auth provisória do painel até existir login real. */
export function autorizarPainel(req: NextRequest): boolean {
  const esperado = process.env.PAINEL_MIDIA_TOKEN;
  if (!esperado) return process.env.NODE_ENV === "development";
  const header = req.headers.get("x-painel-token") || "";
  const query = req.nextUrl.searchParams.get("token") || "";
  return header === esperado || query === esperado;
}

/**
 * Painel autenticado + clienteId obrigatório (isolamento entre projetos).
 * Retorna clienteId sanitizado ou null.
 */
export function autorizarCliente(req: NextRequest): string | null {
  if (!autorizarPainel(req)) return null;
  return lerClienteId(req);
}
