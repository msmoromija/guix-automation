import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { baixarObjeto } from "@/lib/media/r2";
import type { PacotePrototipo } from "@/lib/prototipos/cofre";
import { googleFontsHref, tipoPorId, type VisualConfig } from "@/lib/estudio/visual";

export type AssetManifesto = {
  arquivo: string;
  caminhoNoSite: string;
  srcOriginal: string;
  tags: string[];
  origem?: string;
  alt?: string;
  contentType: string;
};

type RefImagem = {
  caminho: string;
  src: string;
  alt?: string;
  origem?: string;
  categoria?: string;
  tags: string[];
};

function ehSrcImagem(src: string) {
  if (!src || typeof src !== "string") return false;
  if (src.startsWith("data:image/")) return true;
  if (src.startsWith("/marcas/")) return true;
  if (src.startsWith("/api/midia/")) return true;
  if (/^https?:\/\//i.test(src)) return true;
  return false;
}

function coletarRefs(valor: unknown, caminho = "", acc: RefImagem[] = []): RefImagem[] {
  if (!valor || typeof valor !== "object") return acc;
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => coletarRefs(item, `${caminho}[${i}]`, acc));
    return acc;
  }
  const obj = valor as Record<string, unknown>;
  if (typeof obj.src === "string" && ehSrcImagem(obj.src)) {
    const tags = [
      typeof obj.categoria === "string" ? obj.categoria : "",
      typeof obj.origem === "string" ? obj.origem : "",
      caminho.includes("logo") ? "logomarca" : "",
      caminho.includes("hero") ? "hero" : "",
      caminho.includes("galeria") ? "galeria" : "",
      caminho.includes("sobre") ? "sobre" : "",
      caminho.includes("servico") ? "servico" : "",
      caminho.includes("profissional") || caminho.includes("foto") ? "profissional" : "",
      caminho.includes("og") ? "seo" : "",
    ].filter(Boolean);
    acc.push({
      caminho,
      src: obj.src,
      alt: typeof obj.alt === "string" ? obj.alt : undefined,
      origem: typeof obj.origem === "string" ? obj.origem : undefined,
      categoria: typeof obj.categoria === "string" ? obj.categoria : undefined,
      tags: [...new Set(tags)],
    });
  }
  for (const [k, v] of Object.entries(obj)) {
    const next = caminho ? `${caminho}.${k}` : k;
    coletarRefs(v, next, acc);
  }
  return acc;
}

function setPorCaminho(raiz: Record<string, unknown>, caminho: string, srcNovo: string) {
  const partes: Array<string | number> = [];
  caminho.replace(/([^.\[\]]+)|\[(\d+)\]/g, (_, chave: string, indice: string) => {
    if (indice !== undefined) partes.push(Number(indice));
    else if (chave) partes.push(chave);
    return "";
  });
  let cursor: unknown = raiz;
  for (let i = 0; i < partes.length - 1; i++) {
    if (cursor == null || typeof cursor !== "object") return;
    cursor = (cursor as Record<string | number, unknown>)[partes[i]];
  }
  const ultimo = partes[partes.length - 1];
  if (cursor && typeof cursor === "object" && ultimo !== undefined) {
    const alvo = (cursor as Record<string | number, unknown>)[ultimo];
    if (alvo && typeof alvo === "object" && "src" in (alvo as object)) {
      (alvo as { src: string }).src = srcNovo;
    }
  }
}

function extensaoDe(contentType: string, src: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  if (src.includes(".png")) return "png";
  if (src.includes(".webp")) return "webp";
  if (src.includes(".jpg") || src.includes(".jpeg")) return "jpg";
  if (src.includes("svg")) return "svg";
  return "bin";
}

function nomeArquivo(indice: number, ref: RefImagem, ext: string) {
  const base =
    ref.tags.find((t) => ["logomarca", "hero", "sobre", "galeria", "servico", "profissional", "seo"].includes(t)) ||
    ref.categoria ||
    "imagem";
  const n = String(indice + 1).padStart(2, "0");
  return `${n}-${base}.${ext}`;
}

async function resolverBytes(src: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    if (src.startsWith("data:image/")) {
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(src);
      if (!m) return null;
      return { bytes: Buffer.from(m[2], "base64"), contentType: m[1] };
    }

    if (src.startsWith("/marcas/")) {
      const rel = src.replace(/^\//, "");
      const arquivo = path.join(process.cwd(), "public", rel);
      const bytes = await readFile(arquivo);
      return { bytes, contentType: "image/png" };
    }

    const midia = src.match(/\/api\/midia\/arquivo\/(.+?)(?:\?|$)/);
    if (midia) {
      const key = midia[1]
        .split("/")
        .map((p) => decodeURIComponent(p))
        .join("/");
      const bytes = await baixarObjeto(key);
      return { bytes, contentType: "application/octet-stream" };
    }

    if (/^https?:\/\//i.test(src)) {
      const pub = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
      if (pub && src.startsWith(`${pub}/`)) {
        const key = src.slice(pub.length + 1);
        const bytes = await baixarObjeto(key);
        return { bytes, contentType: "application/octet-stream" };
      }
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) return null;
      const bytes = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "application/octet-stream";
      return { bytes, contentType };
    }
  } catch {
    return null;
  }
  return null;
}

function cloneJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Pacote ZIP completo para replicar o protótipo em domínio próprio. */
export async function montarPacoteZip(pacote: PacotePrototipo): Promise<{
  buffer: Buffer;
  manifesto: AssetManifesto[];
  avisos: string[];
}> {
  const zip = new JSZip();
  const pasta = `${pacote.token}`;
  const site = cloneJson(pacote.site || {}) as Record<string, unknown>;
  const visual = (pacote.visual || null) as VisualConfig | null;
  const avisos: string[] = [];
  const manifesto: AssetManifesto[] = [];

  const refs = coletarRefs(site);
  const vistos = new Set<string>();
  let indice = 0;

  for (const ref of refs) {
    if (!ref.src || vistos.has(`${ref.caminho}|${ref.src.slice(0, 80)}`)) continue;
    vistos.add(`${ref.caminho}|${ref.src.slice(0, 80)}`);
    const resolvido = await resolverBytes(ref.src);
    if (!resolvido) {
      avisos.push(`Não baixou: ${ref.caminho} (${ref.src.slice(0, 80)})`);
      continue;
    }
    const ext = extensaoDe(resolvido.contentType, ref.src);
    const arquivo = nomeArquivo(indice, ref, ext);
    indice += 1;
    const relativo = `assets/${arquivo}`;
    zip.file(`${pasta}/${relativo}`, resolvido.bytes);
    setPorCaminho(site, ref.caminho, `./${relativo}`);
    manifesto.push({
      arquivo: relativo,
      caminhoNoSite: ref.caminho,
      srcOriginal: ref.src.startsWith("data:") ? `data:${resolvido.contentType};base64,…` : ref.src,
      tags: ref.tags,
      origem: ref.origem,
      alt: ref.alt,
      contentType: resolvido.contentType,
    });
  }

  const meta = {
    versaoPacote: "1.0",
    geradoEm: new Date().toISOString(),
    token: pacote.token,
    nicho: pacote.nicho,
    nome: pacote.nome,
    cidade: pacote.cidade || "",
    whatsapp: pacote.whatsapp || "",
    email: pacote.email || "",
    slogan: pacote.slogan || "",
    status: pacote.status || "rascunho",
    criadoEm: pacote.criadoEm,
    expiraEm: pacote.expiraEm,
    temPrototipo: true,
    totalAssets: manifesto.length,
    avisos,
  };

  const fonts = visual
    ? {
        tipografiaId: visual.tipografiaId,
        ...(() => {
          const t = tipoPorId(visual.tipografiaId);
          return { font_heading: t.font_heading, font_body: t.font_body, nome: t.nome };
        })(),
        googleFontsCss: googleFontsHref(visual),
      }
    : site.tema
      ? {
          font_heading: (site.tema as { font_heading?: string }).font_heading,
          font_body: (site.tema as { font_body?: string }).font_body,
        }
      : {};

  const README = [
    `Pacote GuiX — ${pacote.nome} (${pacote.token})`,
    ``,
    `Conteúdo:`,
    `- site.json → estrutura completa do site (textos, FAQ, serviços, tema, contatos)`,
    `- visual.json → layout, logo cores, agenda, WhatsApp flutuante, animações`,
    `- meta.json → dados do negócio e do pedido`,
    `- fonts.json → fontes usadas (carregue via Google Fonts)`,
    `- assets/ → logomarca e imagens já baixadas e tagueadas`,
    `- manifesto.json → mapa arquivo ↔ posição no site + tags`,
    `- pacote-completo.json → tudo em um arquivo`,
    ``,
    `Montar o projeto automaticamente (na máquina / CI GuiX):`,
    ``,
    `  node scripts/processar-pacote-zip.mjs --zip este-arquivo.zip`,
    `  # ou no PowerShell:`,
    `  .\\scripts\\processar-pacote.ps1 -Zip .\\este-arquivo.zip -Install`,
    ``,
    `Isso copia prototipos/<nicho>, injeta site.json + assets e gera clientes/<slug>/repo.`,
    `Depois: npm run dev → conferir → push → Vercel + domínio + e-mail.`,
    ``,
    `Pedido pago (painel):`,
    `  node scripts/baixar-e-processar-pedido.mjs --pedido COBRANCA_ID --token PAINEL_TOKEN`,
    ``,
    avisos.length ? `Avisos:\n${avisos.map((a) => `- ${a}`).join("\n")}` : "Sem avisos de mídia.",
  ].join("\n");

  zip.file(`${pasta}/README.txt`, README);
  zip.file(`${pasta}/meta.json`, JSON.stringify(meta, null, 2));
  zip.file(`${pasta}/site.json`, JSON.stringify(site, null, 2));
  zip.file(`${pasta}/visual.json`, JSON.stringify(visual || {}, null, 2));
  zip.file(`${pasta}/fonts.json`, JSON.stringify(fonts, null, 2));
  zip.file(`${pasta}/manifesto.json`, JSON.stringify(manifesto, null, 2));
  zip.file(
    `${pasta}/pacote-completo.json`,
    JSON.stringify(
      {
        meta,
        site,
        visual: visual || {},
        fonts,
        manifesto,
      },
      null,
      2,
    ),
  );

  const buffer = Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  return { buffer, manifesto, avisos };
}
