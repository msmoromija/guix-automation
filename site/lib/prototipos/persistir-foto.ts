import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { filtrarArquivoBasico } from "@/lib/media/validar-imagem";
import { chaveClienteInbox, enviarBuffer } from "@/lib/media/r2";
import type { CategoriaImagem } from "@/lib/media/tipos";

const MIME_EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Move fotos locais do rascunho para o inbox privado do projeto no R2. */
export async function persistirFotoPrototipo(
  src: string,
  clienteId: string,
  categoria: CategoriaImagem,
  alt: string,
) {
  if (!src.startsWith("data:")) return src;

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (!match || src.length > 1_800_000) {
    throw new Error("A foto enviada não está em um formato válido. Escolha novamente um arquivo JPG, PNG ou WebP.");
  }

  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.toString("base64") !== match[2]) {
    throw new Error("Não foi possível ler a foto. Escolha novamente o arquivo.");
  }

  const filtro = filtrarArquivoBasico({
    contentType,
    nome: `foto.${MIME_EXTENSAO[contentType]}`,
    bytes: bytes.byteLength,
  });
  if (!filtro.ok) throw new Error(filtro.motivo);

  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  const formatoValido =
    (contentType === "image/jpeg" && metadata.format === "jpeg") ||
    (contentType === "image/png" && metadata.format === "png") ||
    (contentType === "image/webp" && metadata.format === "webp");
  if (!formatoValido || !metadata.width || !metadata.height) {
    throw new Error("O arquivo não parece ser uma foto válida.");
  }

  const key = chaveClienteInbox(clienteId, categoria, `${randomUUID()}.${MIME_EXTENSAO[contentType]}`);
  const enviado = await enviarBuffer({
    key,
    body: bytes,
    contentType,
    origem: "upload",
    alt,
    tags: ["upload", "prototipo", categoria],
    status: "aprovada",
    clienteId,
    categoria,
    width: metadata.width,
    height: metadata.height,
  });
  return enviado.url;
}
