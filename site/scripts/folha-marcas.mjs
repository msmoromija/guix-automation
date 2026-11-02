import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve("tmp-marcas-lote");
const files = (await readdir(dir)).filter((n) => /\.jpe?g$/i.test(n) && !n.startsWith("_")).sort();
const cols = 7;
const cell = 140;
const chunk = 21;
const labelH = 22;

for (let s = 0; s < Math.ceil(files.length / chunk); s++) {
  const slice = files.slice(s * chunk, s * chunk + chunk);
  const rows = Math.ceil(slice.length / cols);
  const tiles = [];
  for (let i = 0; i < slice.length; i++) {
    const idx = String(s * chunk + i).padStart(2, "0");
    const thumb = await sharp(path.join(dir, slice[i])).resize(cell, cell, { fit: "cover" }).jpeg({ quality: 72 }).toBuffer();
    const svg = Buffer.from(
      `<svg width="${cell}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="16" fill="#fff" font-size="12" font-family="Arial">${idx}</text></svg>`,
    );
    const labeled = await sharp({
      create: { width: cell, height: cell + labelH, channels: 3, background: "#111" },
    })
      .composite([
        { input: thumb, top: 0, left: 0 },
        { input: svg, top: cell, left: 0 },
      ])
      .jpeg({ quality: 80 })
      .toBuffer();
    tiles.push({
      input: labeled,
      left: (i % cols) * cell,
      top: Math.floor(i / cols) * (cell + labelH),
    });
  }
  const out = path.join(dir, `_folha${s}.jpg`);
  await sharp({
    create: {
      width: cols * cell,
      height: rows * (cell + labelH),
      channels: 3,
      background: "#111",
    },
  })
    .composite(tiles)
    .jpeg({ quality: 82 })
    .toFile(out);
  console.log("wrote", out, slice.length);
}
