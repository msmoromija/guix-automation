import { randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { enviarBuffer, baixarObjeto, listarPrefixo, apagarObjeto } from "@/lib/media/r2";
import { sanitizarClienteId } from "@/lib/media/isolamento";
import type { Nicho } from "@/lib/media/tipos";
import {
  PREVIEW_MAX_SLOTS,
  PREVIEW_TTL_DIAS,
  type PreviewMeta,
  type PreviewSlotRegistro,
} from "./tipos";

const REGISTRY_KEY = "sistema/previews/registry.json";

function dataDir() {
  return path.join(process.cwd(), "data", "previews");
}

function novoToken() {
  return randomBytes(24).toString("hex");
}

function novoId() {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

function expiraEmIso(dias = PREVIEW_TTL_DIAS) {
  return new Date(Date.now() + dias * 86400000).toISOString();
}

async function lerRegistryLocal(): Promise<PreviewSlotRegistro> {
  try {
    const raw = await readFile(path.join(dataDir(), "registry.json"), "utf8");
    return JSON.parse(raw) as PreviewSlotRegistro;
  } catch {
    return { atualizadosEm: new Date().toISOString(), max: PREVIEW_MAX_SLOTS, itens: [] };
  }
}

async function gravarRegistryLocal(reg: PreviewSlotRegistro) {
  if (process.env.VERCEL) return;
  try {
    await mkdir(dataDir(), { recursive: true });
    await writeFile(path.join(dataDir(), "registry.json"), JSON.stringify(reg, null, 2), "utf8");
  } catch {
    /* Lambda/read-only */
  }
}

async function lerRegistryR2(): Promise<PreviewSlotRegistro | null> {
  try {
    const buf = await baixarObjeto(REGISTRY_KEY);
    return JSON.parse(buf.toString("utf8")) as PreviewSlotRegistro;
  } catch {
    return null;
  }
}

async function gravarRegistryR2(reg: PreviewSlotRegistro) {
  await enviarBuffer({
    key: REGISTRY_KEY,
    body: Buffer.from(JSON.stringify(reg, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "registry previews",
    tags: ["sistema", "previews"],
    status: "aprovada",
  });
}

export async function carregarRegistry(): Promise<PreviewSlotRegistro> {
  const remoto = await lerRegistryR2().catch(() => null);
  if (remoto) return remoto;
  return lerRegistryLocal();
}

async function salvarRegistry(reg: PreviewSlotRegistro) {
  reg.atualizadosEm = new Date().toISOString();
  reg.max = PREVIEW_MAX_SLOTS;
  await gravarRegistryLocal(reg);
  try {
    await gravarRegistryR2(reg);
  } catch {
    /* R2 opcional em dev sem credencial */
  }
}

/** Só remove protótipos grátis vencidos. Pagos/publicados nunca caem da lista. */
function limparExpirados(reg: PreviewSlotRegistro) {
  const agora = Date.now();
  const mortos = reg.itens.filter(
    (i) => i.status === "prototipo" && new Date(i.expiraEm).getTime() <= agora,
  );
  reg.itens = reg.itens.filter((i) => !mortos.some((m) => m.id === i.id));
  return { reg, mortos };
}

/** Reserva um slot; se cheio, remove só o protótipo grátis mais antigo — nunca um pago. */
export async function reservarSlot(entrada: {
  nicho: Nicho;
  nome: string;
  cidade?: string;
  whatsapp?: string;
  email?: string;
}): Promise<PreviewMeta> {
  const limpo = limparExpirados(await carregarRegistry());
  let reg = limpo.reg;
  for (const m of limpo.mortos) {
    await apagarPreviewArquivos(m.clienteId).catch(() => undefined);
  }

  while (reg.itens.length >= PREVIEW_MAX_SLOTS) {
    const candidatos = reg.itens
      .filter((i) => i.status === "prototipo")
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
    const vitima = candidatos[0];
    if (!vitima) {
      throw new Error("Todos os slots de preview estão ocupados por sites pagos.");
    }
    reg.itens = reg.itens.filter((i) => i.id !== vitima.id);
    await apagarPreviewArquivos(vitima.clienteId).catch(() => undefined);
  }

  const id = novoId();
  const clienteId = sanitizarClienteId(`p${id}`);
  const meta: PreviewMeta = {
    id,
    token: novoToken(),
    clienteId,
    nicho: entrada.nicho,
    nome: entrada.nome,
    cidade: entrada.cidade,
    whatsapp: entrada.whatsapp,
    email: entrada.email,
    criadoEm: new Date().toISOString(),
    expiraEm: expiraEmIso(),
    status: "prototipo",
  };
  reg.itens.push(meta);
  await salvarRegistry(reg);
  return meta;
}

export async function obterPreview(id: string): Promise<PreviewMeta | null> {
  const { reg } = limparExpirados(await carregarRegistry());
  return reg.itens.find((i) => i.id === id) || null;
}

export async function autenticarPreview(id: string, token: string) {
  const meta = await obterPreview(id);
  if (!meta || meta.token !== token) return null;
  if (meta.status === "pago" || meta.status === "publicado") return meta;
  if (new Date(meta.expiraEm).getTime() < Date.now()) return null;
  return meta;
}

export async function soltarSlot(id: string) {
  const reg = await carregarRegistry();
  const item = reg.itens.find((i) => i.id === id);
  if (!item || item.status !== "prototipo") return;
  reg.itens = reg.itens.filter((i) => i.id !== id);
  await salvarRegistry(reg);
  await apagarPreviewArquivos(item.clienteId).catch(() => undefined);
}

export async function autenticarEVincular(id: string, token: string, cobrancaId: string) {
  const meta = await autenticarPreview(id, token);
  if (!meta) return null;
  return vincularCobranca(id, cobrancaId);
}

export async function marcarPreviewPago(id: string, cobrancaId: string) {
  const reg = await carregarRegistry();
  const item = reg.itens.find((i) => i.id === id);
  if (!item) return null;
  item.status = "pago";
  item.cobrancaId = cobrancaId;
  item.expiraEm = expiraEmIso(90);
  await salvarRegistry(reg);
  return item;
}

export async function obterPreviewPorCobranca(cobrancaId: string) {
  const reg = await carregarRegistry();
  return reg.itens.find((i) => i.cobrancaId === cobrancaId) || null;
}

export async function vincularCobranca(id: string, cobrancaId: string) {
  const reg = await carregarRegistry();
  const item = reg.itens.find((i) => i.id === id);
  if (!item) return null;
  item.cobrancaId = cobrancaId;
  await salvarRegistry(reg);
  return item;
}

export async function salvarSitePreview(clienteId: string, site: unknown) {
  const body = Buffer.from(JSON.stringify(site, null, 2));
  const key = `clientes/${sanitizarClienteId(clienteId)}/config/site.json`;
  try {
    await enviarBuffer({
      key,
      body,
      contentType: "application/json",
      origem: "biblioteca",
      alt: "site.json preview",
      tags: ["preview", "site-json"],
      status: "aprovada",
      clienteId,
    });
  } catch (e) {
    if (process.env.VERCEL) {
      throw e instanceof Error ? e : new Error("R2 indisponível para gravar o site.json");
    }
    const dir = path.join(dataDir(), sanitizarClienteId(clienteId));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "site.json"), body, "utf8");
  }
  // espelho local sempre
  try {
    const dir = path.join(process.cwd(), "..", "clientes", sanitizarClienteId(clienteId), "config");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "site.json"), body, "utf8");
  } catch {
    /* ok */
  }
  return key;
}

export async function lerSitePreview(clienteId: string): Promise<Record<string, unknown> | null> {
  const id = sanitizarClienteId(clienteId);
  const key = `clientes/${id}/config/site.json`;
  try {
    const buf = await baixarObjeto(key);
    return JSON.parse(buf.toString("utf8")) as Record<string, unknown>;
  } catch {
    /* local */
  }
  for (const p of [
    path.join(dataDir(), id, "site.json"),
    path.join(process.cwd(), "..", "clientes", id, "config", "site.json"),
    path.join(process.cwd(), "clientes", id, "config", "site.json"),
  ]) {
    try {
      return JSON.parse(await readFile(p, "utf8")) as Record<string, unknown>;
    } catch {
      /* next */
    }
  }
  return null;
}

async function apagarPreviewArquivos(clienteId: string) {
  const prefix = `clientes/${sanitizarClienteId(clienteId)}/`;
  try {
    const itens = await listarPrefixo(prefix, 200);
    for (const item of itens) {
      await apagarObjeto(item.key).catch(() => undefined);
    }
  } catch {
    /* ok */
  }
}

export function urlPreview(id: string, token?: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || "";
  const q = token ? `?t=${token}` : "";
  return `${base}/p/${id}${q}`;
}

export function urlConta(id: string, token: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || "";
  return `${base}/conta/${id}?t=${token}`;
}

export async function slotsLivres() {
  const { reg } = limparExpirados(await carregarRegistry());
  return Math.max(0, PREVIEW_MAX_SLOTS - reg.itens.length);
}
