const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "prototipos");
const slugs = ["barbearia", "salao", "estetica", "petshop", "academia", "contabilidade", "advocacia"];

function patch(file, pairs) {
  if (!fs.existsSync(file)) {
    console.log("missing", file);
    return;
  }
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  for (const [from, to] of pairs) {
    if (!text.includes(from)) {
      console.log("no match", path.relative(root, file), JSON.stringify(from).slice(0, 80));
      continue;
    }
    text = text.split(from).join(to);
  }
  if (!text.includes("casaHref") && text !== original) {
    // import added separately
  }
  if (text !== original && !text.includes('from "@/lib/casaHref"') && !text.includes("from '@/lib/casaHref'")) {
    const importLine = 'import { casaHref } from "@/lib/casaHref";\n';
    text = importLine + text;
  }
  if (text !== original) {
    fs.writeFileSync(file, text);
    console.log("patched", path.relative(root, file));
  }
}

for (const slug of slugs) {
  const src = path.join(root, slug, "src");
  patch(path.join(src, "components", "Header.tsx"), [
    ["`/${m.href}`", "casaHref(m.href)"],
    ["`/${href}`", "casaHref(href)"],
    ["`/${h}`", "casaHref(h)"],
    ["const item = (href: string) => `/${href}`;", "const item = (href: string) => casaHref(href);"],
  ]);
  patch(path.join(src, "components", "Rodape.tsx"), [
    ["href={l.href}", "href={casaHref(l.href)}"],
  ]);
}
