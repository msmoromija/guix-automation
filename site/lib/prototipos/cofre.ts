import { randomBytes } from "crypto";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import type { VisualConfig } from "@/lib/estudio/visual";
import type { Nicho } from "@/lib/media/tipos";

/** Rascunho grátis: só JSON + token. Nada fica “no ar”. */
export const PROTOTIPO_TTL_MS = Number(process.env.PROTOTIPO_TTL_HORAS || 72) * 60 * 60 * 1000;

/** Prazo padrão após aprovação para a GuiX finalizar integração (horas). */
export const PRAZO_INTEGRACAO_HORAS = Number(process.env.GUIX_PRAZO_INTEGRACAO_HORAS || 24);

export type StatusPrototipo = "rascunho" | "aprovado" | "pago" | "em_integracao" | "publicado";

export interface PacotePrototipo {
  token: string;
  nicho: Nicho;
  nome: string;
  cidade?: string;
  whatsapp?: string;
  email?: string;
  criadoEm: string;
  expiraEm: string;
  site: Record<string, unknown>;
  visual?: VisualConfig;
  slogan?: string;
  edicaoFechada?: boolean;
  fechadoEm?: string;
  /** Fluxo comercial após o estúdio. */
  status?: StatusPrototipo;
  aprovadoEm?: string;
  prazoIntegracao?: string;
  aprovacao?: {
    email?: string;
    telefone?: string;
    canais: Array<"email" | "sms" | "whatsapp">;
    enviadoEm: string;
  };
  pedidosIa?: number;
  historico?: { site: Record<string, unknown>; visual?: VisualConfig }[];
}

function chave(token: string) {
  const t = sanitizarToken(token);
  return `prototipos/${t}.json`;
}

export function sanitizarToken(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
}

export function novoToken() {
  return randomBytes(4).toString("hex"); // 8 chars, fácil de digitar
}

export function expirado(pacote: PacotePrototipo) {
  return new Date(pacote.expiraEm).getTime() <= Date.now();
}

export async function gravarPacote(pacote: PacotePrototipo) {
  const token = sanitizarToken(pacote.token);
  const body = Buffer.from(JSON.stringify({ ...pacote, token }, null, 2));
  await enviarBuffer({
    key: chave(token),
    body,
    contentType: "application/json",
    origem: "biblioteca",
    alt: "rascunho prototipo",
    tags: ["prototipo", "token", token],
    status: "aprovada",
    clienteId: `t${token}`,
  });
  return token;
}

export async function lerPacote(token: string): Promise<PacotePrototipo | null> {
  try {
    const buf = await baixarObjeto(chave(token));
    const pacote = JSON.parse(buf.toString("utf8")) as PacotePrototipo;
    if (expirado(pacote)) return null;
    return pacote;
  } catch {
    return null;
  }
}

export function horasRestantes(pacote: PacotePrototipo) {
  const ms = new Date(pacote.expiraEm).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 3600000));
}
