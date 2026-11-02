import sharp from "sharp";
import type { SlotBanner } from "./slots";

export interface ImagemProcessada {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
}

/** Enquadra com cover (centro) no tamanho do slot e remove metadados EXIF. */
export async function enquadrarParaSlot(
  buffer: Buffer,
  slot: SlotBanner,
): Promise<ImagemProcessada> {
  const out = await sharp(buffer, { failOn: "none" })
    .rotate() // respeita orientation EXIF, depois remove
    .resize(slot.outW, slot.outH, {
      fit: "cover",
      position: "attention",
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: out.data,
    contentType: "image/webp",
    width: out.info.width,
    height: out.info.height,
  };
}
