import sharp from "sharp";
import fs from "fs";
import path from "path";

const niches = ["dentista", "psicologia", "nutricionista"];

for (const nicho of niches) {
  const dir = path.join("C:/Dev/guix-automation/site/public/marcas", nicho);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".png"))) {
    const file = path.join(dir, f);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let minX = info.width;
    let minY = info.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] < 16) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX <= minX || maxY <= minY) continue;

    const pad = 8;
    const left = Math.max(0, minX - pad);
    const top = Math.max(0, minY - pad);
    const width = Math.min(info.width - left, maxX - minX + 1 + pad * 2);
    const height = Math.min(info.height - top, maxY - minY + 1 + pad * 2);

    const tmp = file + ".tmp.png";
    await sharp(file)
      .extract({ left, top, width, height })
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(tmp);
    fs.renameSync(tmp, file);
  }
  console.log("retrimmed", nicho);
}
