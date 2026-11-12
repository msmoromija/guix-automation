/**
 * Regenera PNGs de /marcas a partir dos SVG de simbolos.ts —
 * nítidos em 512px, sem JPEG do WhatsApp.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const simbolosPath = path.join("C:/Dev/guix-automation/site/lib/estudio/simbolos.ts");
const src = fs.readFileSync(simbolosPath, "utf8");

// Ordem real em simbolos.ts (CATALOGO)
const ORDEM = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "advocacia",
  "clinica",
  "dentista",
  "psicologia",
  "nutricionista",
  "generico",
  "contabilidade",
];

function blocoNicho(nicho) {
  const start = src.indexOf(`\n  ${nicho}: [`);
  if (start < 0) return "";
  const from = start + `\n  ${nicho}: [`.length;
  // próximo nicho na ordem, ou fim do CATALOGO
  const idx = ORDEM.indexOf(nicho);
  let end = src.length;
  for (let i = idx + 1; i < ORDEM.length; i++) {
    const p = src.indexOf(`\n  ${ORDEM[i]}: [`, from);
    if (p > 0) {
      end = p;
      break;
    }
  }
  if (end === src.length) {
    const close = src.indexOf("\n};\n", from);
    if (close > 0) end = close;
  }
  return src.slice(from, end);
}

function extrairNicho(nicho) {
  const bloco = blocoNicho(nicho);
  const items = [];
  const itemRe = /id:\s*"([^"]+)"[\s\S]*?desenho:\s*\(c\)\s*=>\s*`([\s\S]*?)`/g;
  let hit;
  while ((hit = itemRe.exec(bloco))) {
    items.push({ id: hit[1], tpl: hit[2] });
  }
  return items;
}

const NICHOS = ["clinica", "dentista", "psicologia", "nutricionista", "advocacia", "academia", "petshop"];

const VARIANTES = [
  { cor: "#0A0A0A", kind: "base" },
  { cor: "#0A0A0A", kind: "anel" },
  { cor: "#0A0A0A", kind: "selo" },
];

async function renderPng(svg, out) {
  // density alto = raster SVG nítido; viewBox 96 → 512 via width/height do SVG
  await sharp(Buffer.from(svg), { density: 600 })
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
}

function wrapVariante(inner, kind, cor) {
  if (kind === "selo") {
    return `<circle cx="48" cy="48" r="44" fill="none" stroke="${cor}" stroke-width="3"/>
      <g transform="translate(48 48) scale(0.72) translate(-48 -48)">${inner}</g>`;
  }
  if (kind === "anel") {
    return `<circle cx="48" cy="48" r="42" fill="none" stroke="${cor}" stroke-width="2.6"/>
      <g transform="translate(48 48) scale(0.78) translate(-48 -48)">${inner}</g>`;
  }
  return inner;
}

async function gerarNicho(nicho, alvo) {
  const items = extrairNicho(nicho);
  if (!items.length) {
    console.log("skip", nicho, "(sem simbolos)");
    return 0;
  }
  const outDir = path.join("C:/Dev/guix-automation/site/public/marcas", nicho);
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir).filter((x) => x.endsWith(".png"))) {
    fs.unlinkSync(path.join(outDir, f));
  }

  const gerados = [];
  for (const item of items) {
    for (const v of VARIANTES) {
      if (gerados.length >= alvo) break;
      if ((v.kind === "anel" || v.kind === "selo") && /(anel|selo|disco|escudo)/i.test(item.id)) continue;
      const inner = item.tpl.replace(/\$\{c\}/g, v.cor);
      const body = wrapVariante(inner, v.kind, v.cor);
      gerados.push(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 96 96">${body}</svg>`);
    }
    if (gerados.length >= alvo) break;
  }

  let i = 0;
  while (gerados.length < alvo && items.length) {
    const item = items[i % items.length];
    const inner = item.tpl.replace(/\$\{c\}/g, "#0A0A0A");
    const scale = 0.85 + (i % 3) * 0.05;
    gerados.push(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 96 96">
  <g transform="translate(48 48) scale(${scale}) translate(-48 -48)">${inner}</g>
</svg>`);
    i++;
  }

  for (let n = 0; n < gerados.length; n++) {
    const out = path.join(outDir, `${String(n + 1).padStart(2, "0")}.png`);
    await renderPng(gerados[n], out);
  }
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).sort();
  fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(files.map((f) => `/marcas/${nicho}/${f}`), null, 2));
  console.log(nicho, files.length, "de", items.length, "símbolos");
  return files.length;
}

const alvos = {
  clinica: 35,
  dentista: 25,
  psicologia: 26,
  nutricionista: 23,
  advocacia: 27,
  academia: 30,
  petshop: 35,
};

async function main() {
  for (const nicho of NICHOS) {
    console.log("itens", nicho, extrairNicho(nicho).map((x) => x.id).join(","));
    await gerarNicho(nicho, alvos[nicho] || 20);
  }
  const meta = await sharp("C:/Dev/guix-automation/site/public/marcas/clinica/01.png").metadata();
  console.log("clinica/01", meta.width, "x", meta.height, "size", fs.statSync("C:/Dev/guix-automation/site/public/marcas/clinica/01.png").size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
