import type { Nicho } from "@/lib/media/tipos";

export const PREVIEW_MAX_SLOTS = Number(process.env.PREVIEW_MAX_SLOTS || 20);
export const PREVIEW_TTL_DIAS = Number(process.env.PREVIEW_TTL_DIAS || 7);

export interface PreviewMeta {
  id: string;
  token: string;
  clienteId: string;
  nicho: Nicho;
  nome: string;
  cidade?: string;
  whatsapp?: string;
  email?: string;
  criadoEm: string;
  expiraEm: string;
  status: "prototipo" | "pago" | "publicado";
  cobrancaId?: string;
}

export interface PreviewSlotRegistro {
  atualizadosEm: string;
  max: number;
  itens: PreviewMeta[];
}
