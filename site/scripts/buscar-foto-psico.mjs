import https from "https";
import fs from "fs";
import path from "path";

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          res.resume();
          get(next, redirects + 1).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8"), url }));
      })
      .on("error", reject);
  });
}

function head(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        resolve(res.statusCode || 0);
        res.resume();
      })
      .on("error", () => resolve(0));
  });
}

function download(url, file) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location, file).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          fs.writeFileSync(file, Buffer.concat(chunks));
          resolve(Buffer.concat(chunks).length);
        });
      })
      .on("error", reject);
  });
}

const queries = [
  "https://unsplash.com/s/photos/psychologist-patient",
  "https://unsplash.com/s/photos/therapy-session",
  "https://unsplash.com/s/photos/counseling",
];

const photoIds = new Set();
for (const q of queries) {
  const r = await get(q);
  console.log(r.status, r.url, r.body.length);
  for (const m of r.body.matchAll(/images\.unsplash\.com\/photo-([0-9]+-[a-zA-Z0-9_-]+)/g)) {
    photoIds.add(m[1].split("?")[0]);
  }
  for (const m of r.body.matchAll(/\"id\":\"([a-zA-Z0-9_-]{11})\"/g)) {
    // ignore
  }
}

console.log("found", photoIds.size);
const ok = [];
for (const id of [...photoIds]) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
  const st = await head(url);
  if (st === 200) ok.push(id);
}
console.log("ok", ok.length);
fs.writeFileSync("scripts/psico-candidatos.json", JSON.stringify(ok, null, 2));

const out = "C:/Users/Marco/.cursor/projects/c-Dev-guix-automation/assets";
let i = 0;
for (const id of ok.slice(0, 8)) {
  i++;
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
  const file = path.join(out, `psico-cand-${i}.jpg`);
  const n = await download(url, file);
  console.log(i, id, n);
}
