import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const origem = path.resolve(process.argv[2] || "tmp-marcas-barbearia");
const destino = path.resolve(process.argv[3] || "public/marcas/barbearia");
const publico = process.argv[4] || "/marcas/barbearia";

function lum(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function sat(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}
function fundoClaro(r, g, b) {
  return lum(r, g, b) > 188 && sat(r, g, b) < 0.14;
}

async function limpar(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const px = (x, y) => (y * w + x) * c;
  const visto = new Uint8Array(w * h);
  const pilha = [];
  const entra = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visto[p]) return;
    const i = px(x, y);
    if (!fundoClaro(data[i], data[i + 1], data[i + 2])) return;
    visto[p] = 1;
    pilha.push(x, y);
  };
  for (let x = 0; x < w; x++) {
    entra(x, 0);
    entra(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    entra(0, y);
    entra(w - 1, y);
  }
  while (pilha.length) {
    const y = pilha.pop();
    const x = pilha.pop();
    data[px(x, y) + 3] = 0;
    entra(x + 1, y);
    entra(x - 1, y);
    entra(x, y + 1);
    entra(x, y - 1);
  }
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[px(x, y) + 3] < 12) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) {
    throw new Error("marca vazia");
  }
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 });
}

const nomes = (await readdir(origem)).filter((n) => /\.jpe?g$/i.test(n)).sort();
const vistos = new Set();
const salvos = [];
await mkdir(destino, { recursive: true });

for (const nome of nomes) {
  const raw = await readFile(path.join(origem, nome));
  const hash = createHash("sha1").update(raw).digest("hex");
  if (vistos.has(hash)) continue;
  vistos.add(hash);
  try {
    const img = await limpar(raw);
    const n = String(salvos.length + 1).padStart(2, "0");
    const arquivo = `${n}.png`;
    await img.toFile(path.join(destino, arquivo));
    salvos.push(`${publico}/${arquivo}`);
    console.log("ok", arquivo, nome);
  } catch (e) {
    console.warn("skip", nome, e.message);
  }
}

await writeFile(path.join(destino, "index.json"), JSON.stringify(salvos, null, 2));
console.log("total", salvos.length);
