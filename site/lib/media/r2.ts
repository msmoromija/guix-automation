import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import type { CategoriaImagem, CreditoUnsplash, Nicho, OrigemImagem, StatusMidia } from "./tipos";
import { assinarChave, ehChaveCliente, prefixoInbox, prefixoPublicado, sanitizarClienteId } from "./isolamento";

export function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || "guix-imagens";
  const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2: defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY");
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

export function clienteR2() {
  const { accountId, accessKeyId, secretAccessKey } = r2Config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function chaveBiblioteca(nicho: Nicho, categoria: CategoriaImagem, nome: string) {
  return `imagens/${nicho}/${categoria}/${nome}`;
}

/** Inbox privado do cliente (nunca entra na biblioteca compartilhada). */
export function chaveClienteInbox(
  clienteId: string,
  categoria: CategoriaImagem,
  nome: string,
) {
  return `${prefixoInbox(clienteId, categoria)}${nome}`;
}

/** Versão publicada/aprovada — ainda isolada por clienteId. */
export function chaveClientePublicado(
  clienteId: string,
  categoria: CategoriaImagem,
  nome: string,
) {
  return `${prefixoPublicado(clienteId, categoria)}${nome}`;
}

/** @deprecated use chaveClienteInbox / chaveClientePublicado */
export function chaveCliente(clienteId: string, nome: string) {
  const id = sanitizarClienteId(clienteId);
  return `clientes/${id}/uploads/${nome}`;
}

function pathProxy(key: string, assinado = false) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  let path = `/api/midia/arquivo/${key.split("/").map(encodeURIComponent).join("/")}`;
  if (assinado && ehChaveCliente(key)) {
    const { exp, sig } = assinarChave(key);
    path += `?exp=${exp}&sig=${sig}`;
  }
  return site ? `${site}${path}` : path;
}

/**
 * Biblioteca compartilhada pode usar CDN pública.
 * Uploads de cliente NUNCA usam R2_PUBLIC_BASE_URL (evita vazamento entre projetos).
 */
export function urlPublica(key: string) {
  if (ehChaveCliente(key)) {
    return pathProxy(key, true);
  }
  const { publicBase } = r2Config();
  if (publicBase) return `${publicBase}/${key}`;
  return pathProxy(key, false);
}

/** S3 só aceita US-ASCII na metadata; normaliza acentos e remove o restante. */
function metaAscii(valor: string, max = 900) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .slice(0, max);
}

export async function enviarBuffer(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  origem: OrigemImagem;
  credito?: CreditoUnsplash;
  alt?: string;
  tags?: string[];
  status?: StatusMidia;
  clienteId?: string;
  categoria?: CategoriaImagem;
  motivo?: string;
  width?: number;
  height?: number;
}) {
  const { bucket } = r2Config();
  const client = clienteR2();
  const metadata: Record<string, string> = {
    origem: opts.origem,
    status: opts.status || "aprovada",
  };
  if (opts.alt) metadata.alt = metaAscii(opts.alt);
  if (opts.tags?.length) metadata.tags = metaAscii(opts.tags.join(","));
  if (opts.clienteId) metadata.cliente_id = sanitizarClienteId(opts.clienteId);
  if (opts.categoria) metadata.categoria = opts.categoria;
  if (opts.motivo) metadata.motivo = metaAscii(opts.motivo, 200);
  if (opts.width) metadata.width = String(opts.width);
  if (opts.height) metadata.height = String(opts.height);
  if (opts.credito) {
    metadata.credito_fotografo = metaAscii(opts.credito.fotografo, 120);
    metadata.credito_perfil = metaAscii(opts.credito.perfil_url, 300);
    metadata.credito_unsplash = metaAscii(opts.credito.unsplash_url, 300);
    metadata.credito_texto = metaAscii(opts.credito.texto, 200);
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      Metadata: metadata,
    }),
  );

  return { key: opts.key, url: urlPublica(opts.key), status: metadata.status as StatusMidia };
}

export async function metadadosObjeto(key: string) {
  const { bucket } = r2Config();
  const client = clienteR2();
  const out = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    contentType: out.ContentType || "application/octet-stream",
    metadata: out.Metadata || {},
    size: out.ContentLength || 0,
  };
}

export async function copiarObjeto(
  origem: string,
  destino: string,
  opts: { metadata: Record<string, string>; contentType?: string },
) {
  const { bucket } = r2Config();
  const client = clienteR2();
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: encodeURIComponent(`${bucket}/${origem}`).replace(/%2F/g, "/"),
      Key: destino,
      Metadata: opts.metadata,
      MetadataDirective: "REPLACE",
      ContentType: opts.contentType,
    }),
  );
  return { key: destino, url: urlPublica(destino) };
}

export async function apagarObjeto(key: string) {
  const { bucket } = r2Config();
  const client = clienteR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function listarPrefixo(prefix: string, max = 100) {
  const { bucket } = r2Config();
  const client = clienteR2();
  const out = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: max,
    }),
  );
  return (out.Contents || [])
    .filter((o) => o.Key && !o.Key.endsWith("/.keep"))
    .map((o) => ({
      key: o.Key as string,
      url: urlPublica(o.Key as string),
      size: o.Size ?? 0,
    }));
}

export async function baixarObjeto(key: string) {
  const { bucket } = r2Config();
  const client = clienteR2();
  const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await out.Body?.transformToByteArray();
  if (!bytes) throw new Error(`R2: objeto vazio ${key}`);
  return Buffer.from(bytes);
}

/** Pastas padrão da biblioteca por nicho. */
export const NICHOS_PASTA = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "clinica",
  "dentista",
  "psicologia",
  "nutricionista",
  "generico",
] as const;

export const CATEGORIAS_PASTA = [
  "hero",
  "servico",
  "sobre",
  "profissional",
  "galeria",
  "promocao",
  "evento",
] as const;

export function listaChavesKeep() {
  const keys: string[] = [];
  for (const nicho of NICHOS_PASTA) {
    for (const cat of CATEGORIAS_PASTA) {
      keys.push(`imagens/${nicho}/${cat}/.keep`);
    }
  }
  return keys;
}
