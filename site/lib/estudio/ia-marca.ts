import sharp from "sharp";
import type { Nicho } from "@/lib/media/tipos";
import { lockupEmblema } from "./marca";

function apiKey() {
  return process.env.OPENAI_API_KEY || "";
}

const HINT_NICHO: Record<string, string> = {
  barbearia: "barber shears and a straight razor forming a heraldic mark",
  salao: "a single elegant comb and a drop of light, beauty atelier mark",
  estetica: "a leaf and a drop, spa wellness emblem",
  petshop: "a refined paw print as a luxury pet brand mark",
  academia: "a dumbbell as a geometric monogram, athletic brand",
  contabilidade: "balanced ledger lines forming a shield",
  advocacia: "abstract scales of justice, law firm emblem",
};

export async function gerarEmblemaIa(opts: {
  nome: string;
  nicho: Nicho;
  acento: string;
  fundo: string;
}): Promise<Buffer> {
  const key = apiKey();
  if (!key) throw new Error("OPENAI_API_KEY não definida");

  const prompt = [
    "Flat vector brand emblem, logo symbol only.",
    "Do not render any letters, numbers, words, signatures or watermarks.",
    `Concept: ${HINT_NICHO[opts.nicho] || "geometric professional mark"}.`,
    `Two colors only: ${opts.acento} on ${opts.fundo}.`,
    "Centered, generous padding, high-end, simple, no mockup, no 3D, no photorealism, no people, no scenery.",
    "Looks like a paid identity system, not clip art.",
  ].join(" ");

  const tentativa = await gerarImagem(key, prompt);
  return sharp(tentativa).resize(320, 320, { fit: "cover" }).webp({ quality: 82 }).toBuffer();
}

async function gerarImagem(key: string, prompt: string) {
  const dalle = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    }),
  });
  if (dalle.ok) {
    const data = (await dalle.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    return bufferDaImagem(data.data?.[0]);
  }

  const gpt = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });
  if (!gpt.ok) {
    const err = await gpt.text();
    throw new Error(`OpenAI imagem: ${gpt.status} ${err.slice(0, 220)}`);
  }
  const data = (await gpt.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  return bufferDaImagem(data.data?.[0]);
}

async function bufferDaImagem(item?: { b64_json?: string; url?: string }) {
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) {
    const r = await fetch(item.url);
    if (!r.ok) throw new Error("falha ao baixar a imagem da marca");
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error("OpenAI não devolveu imagem");
}

export function montarLockupComEmblema(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
  nicho: string;
  emblemaWebp: Buffer;
}) {
  const href = `data:image/webp;base64,${opts.emblemaWebp.toString("base64")}`;
  return lockupEmblema({
    nome: opts.nome,
    slogan: opts.slogan,
    fundo: opts.fundo,
    tinta: opts.tinta,
    acento: opts.acento,
    nicho: opts.nicho,
    emblemaHref: href,
  });
}
