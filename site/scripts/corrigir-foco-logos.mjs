/**
 * Reextrai clínica por picos de tinta (limites no meio do vão) + PNG 512 com folga.
 * Sharp 0.35: composite + resize separado (não encadear extend+resize em raw).
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const ROOT = "C:/Dev/guix-automation/site/public/marcas";
const ASSETS = "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets";

const CLINICA_SHEETS = [
  path.join(ASSETS, "WhatsApp_Image_2026-11-04_at_07.02.24__1_-5cf3a2b8-cc82-4666-afde-77bc3b8c2657.jpg"),
  path.join(ASSETS, "WhatsApp_Image_2026-11-04_at_07.02.24-ca7e0285-2ce2-43ee-8e6b-20290bf3087a.jpg"),
];

const REPADAR = ["advocacia", "academia", "petshop"];
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const FOLGA = 0.22;

async function enquadrar512(croppedBuf, bw, bh) {
  const pad = Math.round(Math.max(bw, bh) * FOLGA);
  const side = Math.max(bw, bh) + pad * 2;
  const square = await sharp({
    create: { width: side, height: side, channels: 4, background: TRANSPARENT },
  })
    .composite([
      {
        input: croppedBuf,
        left: Math.round((side - bw) / 2),
        top: Math.round((side - bh) / 2),
      },
    ])
    .png()
    .toBuffer();
  return sharp(square).resize(512, 512, { fit: "fill" }).png().toBuffer();
}

function findPeaks1D(arr, thrRatio = 0.08, smooth = 4) {
  const N = arr.length;
  const sm = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0,
      c = 0;
    for (let k = -smooth; k <= smooth; k++) {
      const j = i + k;
      if (j >= 0 && j < N) {
        s += arr[j];
        c++;
      }
    }
    sm[i] = s / c;
  }
  const thr = Math.max(...sm) * thrRatio;
  const peaks = [];
  let inPeak = false;
  for (let i = 0; i < N; i++) {
    if (!inPeak && sm[i] > thr) {
      inPeak = true;
      peaks.push({ start: i, end: i, max: sm[i], argmax: i });
    } else if (inPeak) {
      const p = peaks[peaks.length - 1];
      if (sm[i] > p.max) {
        p.max = sm[i];
        p.argmax = i;
      }
      if (sm[i] <= thr) {
        p.end = i;
        inPeak = false;
      } else p.end = i;
    }
  }
  return peaks.filter((p) => p.end - p.start > 24);
}

function equalCols(W, n = 5) {
  const m = Math.round(W * 0.008);
  const usable = W - m * 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const start = m + Math.round((usable * i) / n);
    const end = m + Math.round((usable * (i + 1)) / n);
    out.push({ start, end, argmax: (start + end) >> 1, max: 1 });
  }
  return out;
}

async function extractClinicaSheet(file) {
  const scale = 2;
  const { width: W0, height: H0 } = await sharp(file).metadata();
  const W = W0 * scale;
  const H = H0 * scale;
  const scaled = await sharp(file).resize(W, H, { kernel: sharp.kernel.lanczos3 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const data = scaled.data;

  const colInk = new Float64Array(W);
  const rowInk = new Float64Array(H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const lum = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat >= 16 && lum < 250) {
        colInk[x]++;
        rowInk[y]++;
      }
    }
  }

  let cols = findPeaks1D(colInk);
  let rows = findPeaks1D(rowInk);
  if (cols.length !== 5) {
    console.warn(path.basename(file), "cols", cols.length, "→ equal");
    cols = equalCols(W, 5);
  }
  if (rows.length !== 2) {
    console.warn(path.basename(file), "rows", rows.length, "→ equal");
    rows = [
      { start: Math.round(H * 0.14), end: Math.round(H * 0.46), argmax: Math.round(H * 0.3), max: 1 },
      { start: Math.round(H * 0.54), end: Math.round(H * 0.86), argmax: Math.round(H * 0.7), max: 1 },
    ];
  }

  console.log(
    path.basename(file),
    "cols",
    cols.map((c) => `${c.start}-${c.end}`).join(","),
    "rows",
    rows.map((r) => `${r.start}-${r.end}`).join(","),
  );

  const items = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      // margem além do pico — anti-alias da ponta; vizinho cai no CC filter
      const left = Math.max(0, cols[c].start - 28);
      const right = Math.min(W, cols[c].end + 28);
      const top = Math.max(0, rows[r].start - 24);
      const bottom = Math.min(H, rows[r].end + 48);
      const width = right - left;
      const height = bottom - top;

      const slice = Buffer.alloc(width * height * 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const si = ((top + y) * W + (left + x)) * 4;
          const di = (y * width + x) * 4;
          const r0 = data[si],
            g0 = data[si + 1],
            b0 = data[si + 2];
          const lum = (r0 + g0 + b0) / 3;
          const sat = Math.max(r0, g0, b0) - Math.min(r0, g0, b0);
          let a = 255;
          if (lum > 252 && sat < 8) a = 0;
          else if (lum > 242 && sat < 12) a = Math.round(255 * ((252 - lum) / 10));
          else if (lum > 230 && sat < 10) a = 55;
          slice[di] = r0;
          slice[di + 1] = g0;
          slice[di + 2] = b0;
          slice[di + 3] = a;
        }
      }

      // maior componente conexo (tinta forte) — descarta pedaço do vizinho
      const strong = (x, y) => {
        const i = (y * width + x) * 4;
        if (slice[i + 3] < 60) return false;
        const lum = (slice[i] + slice[i + 1] + slice[i + 2]) / 3;
        const sat = Math.max(slice[i], slice[i + 1], slice[i + 2]) - Math.min(slice[i], slice[i + 1], slice[i + 2]);
        return !(lum > 215 && sat < 16);
      };
      const seen = new Uint8Array(width * height);
      let best = null;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const id = y * width + x;
          if (seen[id] || !strong(x, y)) continue;
          const stack = [[x, y]];
          seen[id] = 1;
          let minX = x,
            maxX = x,
            minY = y,
            maxY = y,
            count = 0;
          while (stack.length) {
            const [cx, cy] = stack.pop();
            count++;
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
            for (const [nx, ny] of [
              [cx - 1, cy],
              [cx + 1, cy],
              [cx, cy - 1],
              [cx, cy + 1],
            ]) {
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              const nid = ny * width + nx;
              if (seen[nid] || !strong(nx, ny)) continue;
              seen[nid] = 1;
              stack.push([nx, ny]);
            }
          }
          if (!best || count > best.count) best = { minX, maxX, minY, maxY, count };
        }
      }
      if (!best || best.count < 800) {
        console.warn("skip", r, c);
        continue;
      }

      // zera tinta fora do maior CC (vizinho)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x < best.minX - 4 || x > best.maxX + 4 || y < best.minY - 4 || y > best.maxY + 4) {
            slice[(y * width + x) * 4 + 3] = 0;
          }
        }
      }

      const soft = Math.round(Math.max(best.maxX - best.minX, best.maxY - best.minY) * 0.12);
      const el = Math.max(0, best.minX - soft);
      const et = Math.max(0, best.minY - soft);
      const ew = Math.min(width - el, best.maxX - best.minX + 1 + soft * 2);
      const eh = Math.min(height - et, best.maxY - best.minY + 1 + soft * 2);

      const cropped = await sharp(slice, { raw: { width, height, channels: 4 } })
        .extract({ left: el, top: et, width: ew, height: eh })
        .png()
        .toBuffer();
      const m = await sharp(cropped).metadata();
      items.push({ cropped, w: m.width, h: m.height });
    }
  }
  return items;
}

async function extrairClinica() {
  const outDir = path.join(ROOT, "clinica");
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir).filter((x) => x.endsWith(".png") || x === "index.json")) {
    try {
      fs.unlinkSync(path.join(outDir, f));
    } catch {
      /* lock */
    }
  }

  let n = 0;
  for (const file of CLINICA_SHEETS) {
    const items = await extractClinicaSheet(file);
    console.log(path.basename(file), "=>", items.length);
    for (const it of items) {
      n++;
      const out = await enquadrar512(it.cropped, it.w, it.h);
      fs.writeFileSync(path.join(outDir, `${String(n).padStart(2, "0")}.png`), out);
    }
  }

  const files = fs.readdirSync(outDir).filter((f) => /^\d+\.png$/.test(f)).sort();
  try {
    fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(files.map((f) => `/marcas/clinica/${f}`), null, 2));
  } catch (e) {
    console.warn("index lock clinica", e.code);
  }
  const meta = await sharp(path.join(outDir, "01.png")).metadata();
  console.log("clinica", files.length, meta.width + "x" + meta.height);
}

function bboxInk(px, w, h, alphaMin = 40) {
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (px[i + 3] < alphaMin) continue;
      const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
      const sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
      if (lum > 210 && sat < 18) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX) return null;
  return { minX, minY, maxX, maxY };
}

async function repadarNicho(nicho) {
  const dir = path.join(ROOT, nicho);
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).sort();
  let ok = 0;
  for (const f of files) {
    const file = path.join(dir, f);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const box = bboxInk(data, info.width, info.height, 40);
    if (!box) continue;
    const needsResize = info.width !== 512 || info.height !== 512;
    const folgaEsq = box.minX / info.width;
    const folgaDir = (info.width - 1 - box.maxX) / info.width;
    const folgaTop = box.minY / info.height;
    const folgaBot = (info.height - 1 - box.maxY) / info.height;
    if (!needsResize && folgaEsq >= 0.14 && folgaDir >= 0.14 && folgaTop >= 0.14 && folgaBot >= 0.14) continue;

    const bw = box.maxX - box.minX + 1;
    const bh = box.maxY - box.minY + 1;
    const cropped = await sharp(file).extract({ left: box.minX, top: box.minY, width: bw, height: bh }).png().toBuffer();
    const meta = await sharp(cropped).metadata();
    const out = await enquadrar512(cropped, meta.width, meta.height);
    try {
      fs.writeFileSync(file, out);
      ok++;
    } catch {
      console.warn("skip lock", file);
    }
  }
  try {
    const clean = fs.readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).sort();
    fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(clean.map((f) => `/marcas/${nicho}/${f}`), null, 2));
  } catch (e) {
    console.warn("index lock", nicho, e.code || e.message);
  }
  console.log("repadar", nicho, ok, "/", files.length);
}

async function main() {
  await extrairClinica();
  for (const n of REPADAR) await repadarNicho(n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
