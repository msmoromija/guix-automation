import sharp, { type Metadata } from "sharp";
import type { CategoriaImagem } from "./tipos";
import { slotDaCategoria, type SlotBanner } from "./slots";

export const MIME_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_BYTES = Number(process.env.MIDIA_MAX_BYTES || 8 * 1024 * 1024);

export type StatusAvaliacao = "aprovada" | "negada" | "pendente";

export interface ResultadoValidacao {
  ok: boolean;
  status: StatusAvaliacao;
  motivo?: string;
  width: number;
  height: number;
  format?: string;
  slot: SlotBanner;
  aspectOriginal: number;
}

function mimeDeArquivo(type: string, nome: string) {
  if (type && MIME_PERMITIDOS.has(type)) return type;
  const lower = nome.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return type || "";
}

export function filtrarArquivoBasico(opts: {
  contentType: string;
  nome: string;
  bytes: number;
}): { ok: true; contentType: string } | { ok: false; motivo: string } {
  if (opts.bytes <= 0) return { ok: false, motivo: "arquivo vazio" };
  if (opts.bytes > MAX_BYTES) {
    return {
      ok: false,
      motivo: `arquivo maior que ${Math.round(MAX_BYTES / (1024 * 1024))} MB`,
    };
  }
  const mime = mimeDeArquivo(opts.contentType, opts.nome);
  if (!MIME_PERMITIDOS.has(mime)) {
    return { ok: false, motivo: "formato inválido — use JPG, PNG ou WebP" };
  }
  return { ok: true, contentType: mime };
}

/** Avalia se a imagem atende o slot (resolução mínima para crop cover). */
export async function avaliarParaSlot(
  buffer: Buffer,
  categoria: CategoriaImagem,
): Promise<ResultadoValidacao> {
  const slot = slotDaCategoria(categoria);
  if (!slot) {
    return {
      ok: false,
      status: "negada",
      motivo: `categoria desconhecida: ${categoria}`,
      width: 0,
      height: 0,
      slot: slotDaCategoria("hero")!,
      aspectOriginal: 0,
    };
  }

  let meta: Metadata;
  try {
    meta = await sharp(buffer, { failOn: "none" }).metadata();
  } catch {
    return {
      ok: false,
      status: "negada",
      motivo: "arquivo de imagem corrompido ou ilegível",
      width: 0,
      height: 0,
      slot,
      aspectOriginal: 0,
    };
  }

  const width = meta.width || 0;
  const height = meta.height || 0;
  const aspectOriginal = height > 0 ? width / height : 0;

  if (width < slot.minW || height < slot.minH) {
    return {
      ok: false,
      status: "negada",
      motivo: `resolução insuficiente para ${slot.label}: mínimo ${slot.minW}×${slot.minH}px (enviado ${width}×${height})`,
      width,
      height,
      format: meta.format,
      slot,
      aspectOriginal,
    };
  }

  // Cover crop exige que a imagem cubra outW×outH em pelo menos uma dimensão escalada.
  const scale = Math.max(slot.outW / width, slot.outH / height);
  if (scale > 1.01) {
    return {
      ok: false,
      status: "negada",
      motivo: `imagem pequena demais para enquadrar em ${slot.outW}×${slot.outH}px sem upscale`,
      width,
      height,
      format: meta.format,
      slot,
      aspectOriginal,
    };
  }

  return {
    ok: true,
    status: "aprovada",
    width,
    height,
    format: meta.format,
    slot,
    aspectOriginal,
  };
}
