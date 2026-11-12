/**
 * Gera cards /midia/modelo-{slug}.webp a partir do hero real de cada .site.json.
 * Overlay leve — a foto precisa parecer o produto, não um poster lavado.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const root = "C:/Dev/guix-automation/site";
const outDir = path.join(root, "public/midia");
const exemplosDir = path.join(root, "content/exemplos");

const META = {
  barbearia: { accent: "#E4C48A", overlay: "rgba(20,18,16,0.40)" },
  salao: { accent: "#C4A484", overlay: "rgba(63,42,38,0.38)" },
  estetica: { accent: "#C4A882", overlay: "rgba(30,51,48,0.38)" },
  petshop: { accent: "#D4B46A", overlay: "rgba(36,48,40,0.38)" },
  academia: { accent: "#D6E26A", overlay: "rgba(16,20,24,0.42)" },
  contabilidade: { accent: "#38BDF8", overlay: "rgba(26,54,84,0.42)" },
  advocacia: { accent: "#E8B4B8", overlay: "rgba(26,26,26,0.42)" },
  dentista: { accent: "#2DD4BF", overlay: "rgba(15,61,74,0.38)" },
  clinica: { accent: "#38BDF8", overlay: "rgba(15,61,94,0.38)" },
  psicologia: { accent: "#C6A15B", overlay: "rgba(27,54,93,0.40)" },
  nutricionista: { accent: "#86EFAC", overlay: "rgba(31,61,42,0.38)" },
};

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "GuiX-preview/2.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuf(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(titulo, max = 26) {
  const words = String(titulo || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function heroUrl(src) {
  try {
    const u = new URL(src);
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", "1600");
    u.searchParams.set("h", "900");
    u.searchParams.set("q", "90");
    return u.toString();
  } catch {
    return src;
  }
}

function carregarModelos() {
  const files = fs.readdirSync(exemplosDir).filter((f) => f.endsWith(".site.json"));
  const out = [];
  for (const f of files) {
    const slug = f.replace(".site.json", "");
    const j = JSON.parse(fs.readFileSync(path.join(exemplosDir, f), "utf8"));
    const hero = j.hero?.imagem?.src;
    if (!hero) continue;
    const meta = META[slug] || { accent: "#F97316", overlay: "rgba(15,23,42,0.40)" };
    const sub = String(j.hero?.subtitulo || "").split(".")[0].slice(0, 72);
    out.push({
      slug,
      titulo: j.hero?.titulo || j.empresa?.nome || slug,
      sub,
      accent: meta.accent,
      overlay: meta.overlay,
      hero: heroUrl(hero),
    });
  }
  return out;
}

async function gerar(modelo) {
  const heroBuf = await fetchBuf(modelo.hero);
  const bg = await sharp(heroBuf)
    .resize(1400, 780, { fit: "cover", position: "centre" })
    .modulate({ saturation: 1.06, brightness: 1.02 })
    .png()
    .toBuffer();

  const lines = wrapTitle(modelo.titulo, 26);
  const titleY = 440;
  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="72" y="${titleY + i * 58}" font-family="Segoe UI, Arial, sans-serif" font-size="50" font-weight="700" fill="#FFFFFF">${escapeXml(line)}</text>`,
    )
    .join("");
  const subY = titleY + lines.length * 58 + 16;

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="780" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="780" fill="${modelo.overlay}"/>
  <text x="72" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3.2" fill="${modelo.accent}">${escapeXml(modelo.slug.toUpperCase())}</text>
  ${titleSvg}
  <text x="72" y="${subY}" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#E5E7EB">${escapeXml(modelo.sub)}</text>
  <rect x="72" y="${subY + 32}" rx="999" ry="999" width="210" height="48" fill="${modelo.accent}"/>
  <text x="177" y="${subY + 63}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="700" fill="#0F172A">Agendar horário</text>
</svg>`);

  const out = path.join(outDir, `modelo-${modelo.slug}.webp`);
  await sharp(bg)
    .composite([{ input: svg, top: 0, left: 0 }])
    .webp({ quality: 90 })
    .toFile(out);
  console.log("ok", modelo.slug);
}

const modelos = carregarModelos();
console.log("modelos", modelos.length);
for (const m of modelos) await gerar(m);
