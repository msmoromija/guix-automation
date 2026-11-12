import fs from "fs";
import path from "path";
import https from "https";

const dir = "C:/Dev/guix-automation/site/content/exemplos";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".site.json"));

function head(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 12000 }, (res) => {
      resolve(res.statusCode || 0);
      res.resume();
    });
    req.on("error", () => resolve(0));
    req.on("timeout", () => {
      req.destroy();
      resolve(0);
    });
  });
}

const broken = [];
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  const urls = [...raw.matchAll(/https:\/\/images\.unsplash\.com\/[^"\\]+/g)].map((m) => m[0]);
  const uniq = [...new Set(urls)];
  for (const url of uniq) {
    const status = await head(url);
    if (status !== 200) {
      broken.push({ file: f, status, url });
      console.log("BROKEN", status, f, url.slice(0, 90));
    }
  }
  console.log("checked", f, uniq.length, "urls");
}
if (!broken.length) console.log("ALL_OK");
else {
  console.log("TOTAL_BROKEN", broken.length);
  fs.writeFileSync("scripts/imagens-quebradas.json", JSON.stringify(broken, null, 2));
}
