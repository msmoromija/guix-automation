import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

const PREFIXO_CLIENTE = "clientes/";
const PREFIXO_BIBLIOTECA = "imagens/";

export function ehChaveBiblioteca(key: string) {
  return key.startsWith(PREFIXO_BIBLIOTECA) && !key.includes("..");
}

export function ehChaveCliente(key: string) {
  return key.startsWith(PREFIXO_CLIENTE) && !key.includes("..");
}

/** Extrai clienteId de `clientes/{id}/…`. */
export function clienteIdDaChave(key: string): string | null {
  if (!ehChaveCliente(key)) return null;
  const parts = key.split("/");
  return parts[1] || null;
}

export function assertChaveDoCliente(key: string, clienteId: string) {
  const id = clienteIdDaChave(key);
  if (!id || id !== clienteId) {
    throw new Error("acesso negado: imagem de outro cliente");
  }
}

export function prefixoInbox(clienteId: string, categoria?: string) {
  const id = sanitizarClienteId(clienteId);
  return categoria
    ? `clientes/${id}/inbox/${categoria}/`
    : `clientes/${id}/inbox/`;
}

export function prefixoPublicado(clienteId: string, categoria?: string) {
  const id = sanitizarClienteId(clienteId);
  return categoria
    ? `clientes/${id}/publicado/${categoria}/`
    : `clientes/${id}/publicado/`;
}

export function sanitizarClienteId(clienteId: string) {
  const id = clienteId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!id || id.length < 2 || id.length > 64) {
    throw new Error("clienteId inválido");
  }
  return id;
}

function segredoAssinatura() {
  return process.env.MIDIA_SIGNING_SECRET || process.env.PAINEL_MIDIA_TOKEN || "";
}

export function assinarChave(key: string, ttlSec = 60 * 60 * 24 * 30) {
  const secret = segredoAssinatura();
  if (!secret) throw new Error("MIDIA_SIGNING_SECRET ou PAINEL_MIDIA_TOKEN necessário");
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${key}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return { exp, sig };
}

export function verificarAssinatura(key: string, exp: string, sig: string) {
  const secret = segredoAssinatura();
  if (!secret) return false;
  const expN = Number(exp);
  if (!Number.isFinite(expN) || expN < Math.floor(Date.now() / 1000)) return false;
  const esperado = createHmac("sha256", secret).update(`${key}:${expN}`).digest("hex");
  try {
    const a = Buffer.from(esperado);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** ClienteId do header/query — obrigatório nas APIs de upload do cliente. */
export function lerClienteId(req: NextRequest): string | null {
  const h = req.headers.get("x-cliente-id") || "";
  const q = req.nextUrl.searchParams.get("clienteId") || "";
  const raw = (h || q).trim();
  if (!raw) return null;
  try {
    return sanitizarClienteId(raw);
  } catch {
    return null;
  }
}

export function podeLerChaveCliente(opts: {
  key: string;
  clienteId?: string | null;
  painelOk: boolean;
  exp?: string | null;
  sig?: string | null;
}) {
  if (!ehChaveCliente(opts.key)) return false;
  if (opts.exp && opts.sig && verificarAssinatura(opts.key, opts.exp, opts.sig)) {
    return true;
  }
  if (opts.painelOk && opts.clienteId) {
    try {
      assertChaveDoCliente(opts.key, opts.clienteId);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
