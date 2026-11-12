import sharp from "sharp";
import fs from "fs";
import path from "path";

const sheets = [
  {
    nicho: "dentista",
    file: "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets/WhatsApp_Image_2026-11-03_at_22.22.20__1_-30a781a2-3071-4661-8e79-6de539b093ab.jpg",
  },
  {
    nicho: "psicologia",
    file: "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets/WhatsApp_Image_2026-11-03_at_22.22.20-475d8a4d-9309-4bd1-b0e2-3394e56289bd.jpg",
  },
  {
    nicho: "nutricionista",
    file: "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets/WhatsApp_Image_2026-11-03_at_22.27.37-0e1f7073-220e-446c-b649-d4d27f53d30d.jpg",
  },
  {
    nicho: "nutricionista",
    file: "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets/WhatsApp_Image_2026-11-03_at_22.27.37__1_-ce47c36f-c0ab-463d-96f8-1622bf84edc0.jpg",
    append: true,
  },
];

async function boxesFromSheet(file) {
  const img = sharp(file);
  const meta = await img.metadata();
  const width = meta.width;
  const height = meta.height;
  const { data } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const step = 4;
  const thr = 28;
  const gw = Math.ceil(width / step);
  const gh = Math.ceil(height / step);
  const visited = new Uint8Array(gw * gh);
  const idx = (x, y) => y * gw + x;

  function isInk(px, py) {
    const i = (py * width + px) * 4;
    return data[i] > thr || data[i + 1] > thr || data[i + 2] > thr;
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
      let minX = px;
      let maxX = px;
      let minY = py;
      let maxY = py;
      let count = 0;
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
      if (count < 40 || w < 40 || h < 40) continue;
      if (w > width * 0.7 && h > height * 0.7) continue;
      regions.push({ minX, minY, maxX, maxY, w, h, count });
    }
  }
  return { width, height, regions };
}

function mergeRegions(regions, height) {
  const merged = [];
  for (const r of regions) {
    const hit = merged.find(
      (m) => !(r.maxX < m.minX - 20 || r.minX > m.maxX + 20 || r.maxY < m.minY - 20 || r.minY > m.maxY + 20),
    );
    if (hit) {
      hit.minX = Math.min(hit.minX, r.minX);
      hit.minY = Math.min(hit.minY, r.minY);
      hit.maxX = Math.max(hit.maxX, r.maxX);
      hit.maxY = Math.max(hit.maxY, r.maxY);
    } else {
      merged.push({ ...r });
    }
  }
  merged.sort((a, b) => (a.minY - b.minY > height * 0.06 ? a.minY - b.minY : a.minX - b.minX));
  return merged;
}

async function extract() {
  const counters = {};
  for (const sheet of sheets) {
    const outDir = path.join("C:/Dev/guix-automation/site/public/marcas", sheet.nicho);
    fs.mkdirSync(outDir, { recursive: true });
    if (!sheet.append) {
      for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
      counters[sheet.nicho] = 0;
    } else if (counters[sheet.nicho] == null) {
      counters[sheet.nicho] = fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).length;
    }

    const { width, height, regions } = await boxesFromSheet(sheet.file);
    const merged = mergeRegions(regions, height);
    console.log(sheet.nicho, path.basename(sheet.file), width, "x", height, "=>", merged.length);

    for (const r of merged) {
      const pad = 24;
      const left = Math.max(0, r.minX - pad);
      const top = Math.max(0, r.minY - pad);
      const right = Math.min(width, r.maxX + pad);
      const bottom = Math.min(height, r.maxY + pad);
      const w = right - left;
      const h = bottom - top;
      const side = Math.max(w, h);
      counters[sheet.nicho]++;
      const n = String(counters[sheet.nicho]).padStart(2, "0");
      const out = path.join(outDir, `${n}.png`);

      const buf = await sharp(sheet.file)
        .extract({ left, top, width: w, height: h })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const px = Buffer.alloc(buf.info.width * buf.info.height * 4);
      for (let i = 0; i < buf.data.length; i += 4) {
        const r0 = buf.data[i];
        const g0 = buf.data[i + 1];
        const b0 = buf.data[i + 2];
        const dark = r0 < 22 && g0 < 22 && b0 < 22;
        px[i] = r0;
        px[i + 1] = g0;
        px[i + 2] = b0;
        px[i + 3] = dark ? 0 : 255;
      }

      const logo = await sharp(px, {
        raw: { width: buf.info.width, height: buf.info.height, channels: 4 },
      })
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: side,
          height: side,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: logo,
            left: Math.floor((side - w) / 2),
            top: Math.floor((side - h) / 2),
          },
        ])
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(out);
    }
  }

  for (const nicho of ["dentista", "psicologia", "nutricionista"]) {
    const dir = path.join("C:/Dev/guix-automation/site/public/marcas", nicho);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".png"))
      .sort();
    const index = files.map((f) => `/marcas/${nicho}/${f}`);
    fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 2));
    console.log(nicho, "=>", files.length, "logos");
  }
}

extract().catch((e) => {
  console.error(e);
  process.exit(1);
});
