/**
 * Acrescenta logos de folhas WhatsApp sem apagar a biblioteca git.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const ROOT = "C:/Dev/guix-automation/site/public/marcas";
const ASSETS = "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets";

const sheets = [
  {
    nicho: "advocacia",
    file: path.join(ASSETS, "WhatsApp_Image_2026-11-04_at_05.29.38-8b439b46-1936-4771-93e5-e9f0de036158.jpg"),
    fundo: "branco",
  },
  {
    nicho: "academia",
    file: path.join(ASSETS, "WhatsApp_Image_2026-11-04_at_05.29.37__2_-a191798c-b60b-4079-894c-112061d0c785.jpg"),
    fundo: "branco",
  },
  {
    nicho: "petshop",
    file: path.join(ASSETS, "WhatsApp_Image_2026-11-04_at_05.29.37__1_-47c7cfe7-83a3-4b89-bfef-6aeba798f537.jpg"),
    fundo: "branco",
  },
];

function isBg(r, g, b, fundo) {
  if (fundo === "preto") return r < 22 && g < 22 && b < 22;
  return r > 248 && g > 248 && b > 248;
}

async function boxesFromSheet(file, fundo) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { width, height } = meta;
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const step = 3;
  const gw = Math.ceil(width / step);
  const gh = Math.ceil(height / step);
  const visited = new Uint8Array(gw * gh);
  const idx = (x, y) => y * gw + x;
  function isInk(px, py) {
    const i = (py * width + px) * 4;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (fundo === "preto") return r > 28 || g > 28 || b > 28;
    return r < 245 || g < 245 || b < 245;
  }
  const regions = [];
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (visited[idx(gx, gy)]) continue;
      const px = Math.min(gx * step, width - 1);
      const py = Math.min(gy * step, height - 1);
      if (!isInk(px, py)) {
        visited[idx(gx, gy)] = 1;
        continue;
      }
      let minX = px,
        maxX = px,
        minY = py,
        maxY = py,
        count = 0;
      const stack = [[gx, gy]];
      visited[idx(gx, gy)] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const x = Math.min(cx * step, width - 1);
        const y = Math.min(cy * step, height - 1);
        if (!isInk(x, y)) continue;
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          if (visited[idx(nx, ny)]) continue;
          visited[idx(nx, ny)] = 1;
          stack.push([nx, ny]);
        }
      }
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      if (count < 40 || w < 32 || h < 32) continue;
      if (w > width * 0.8 && h > height * 0.8) continue;
      regions.push({ minX, minY, maxX, maxY });
    }
  }
  const merged = [];
  for (const r of regions) {
    const hit = merged.find(
      (m) => !(r.maxX < m.minX - 14 || r.minX > m.maxX + 14 || r.maxY < m.minY - 14 || r.minY > m.maxY + 14),
    );
    if (hit) {
      hit.minX = Math.min(hit.minX, r.minX);
      hit.minY = Math.min(hit.minY, r.minY);
      hit.maxX = Math.max(hit.maxX, r.maxX);
      hit.maxY = Math.max(hit.maxY, r.maxY);
    } else merged.push({ ...r });
  }
  merged.sort((a, b) => (a.minY - b.minY > height * 0.045 ? a.minY - b.minY : a.minX - b.minX));
  return { width, height, merged };
}

async function append(sheet) {
  const outDir = path.join(ROOT, sheet.nicho);
  fs.mkdirSync(outDir, { recursive: true });
  let n = fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).length;
  const { width, height, merged } = await boxesFromSheet(sheet.file, sheet.fundo);
  console.log(sheet.nicho, "append", merged.length, "from", n);
  for (const r of merged) {
    const pad = 28;
    const left = Math.max(0, r.minX - pad);
    const top = Math.max(0, r.minY - pad);
    const w = Math.min(width - left, r.maxX - r.minX + 1 + pad * 2);
    const h = Math.min(height - top, r.maxY - r.minY + 1 + pad * 2);
    n++;
    const buf = await sharp(sheet.file)
      .extract({ left, top, width: w, height: h })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const px = Buffer.alloc(buf.data.length);
    for (let i = 0; i < buf.data.length; i += 4) {
      px[i] = buf.data[i];
      px[i + 1] = buf.data[i + 1];
      px[i + 2] = buf.data[i + 2];
      px[i + 3] = isBg(buf.data[i], buf.data[i + 1], buf.data[i + 2], sheet.fundo) ? 0 : 255;
    }
    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < buf.info.height; y++) {
      for (let x = 0; x < buf.info.width; x++) {
        if (px[(y * buf.info.width + x) * 4 + 3] < 16) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX <= minX) {
      n--;
      continue;
    }
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const folga = Math.round(Math.max(bw, bh) * 0.18);
    const side = Math.max(bw, bh) + folga * 2;
    const padL = Math.round((side - bw) / 2);
    const padT = Math.round((side - bh) / 2);
    const cropped = await sharp(px, { raw: { width: buf.info.width, height: buf.info.height, channels: 4 } })
      .extract({ left: minX, top: minY, width: bw, height: bh })
      .png()
      .toBuffer();
    const square = await sharp({
      create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: cropped, left: padL, top: padT }])
      .png()
      .toBuffer();
    await sharp(square)
      .resize(512, 512, { fit: "fill" })
      .png()
      .toFile(path.join(outDir, `${String(n).padStart(2, "0")}.png`));
  }
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).sort();
  fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(files.map((f) => `/marcas/${sheet.nicho}/${f}`), null, 2));
  console.log("TOTAL", sheet.nicho, files.length);
}

for (const s of sheets) {
  await append(s);
}
