import fs from "fs";
import path from "path";

const root = "C:/Dev/guix-automation";
const files = [
  "site/lib/automacao/pos-pagamento.ts",
  "site/lib/sites/runner-pos-pago.ts",
  "site/app/api/prototipo/criar/route.ts",
  "site/app/api/prototipo/textos/route.ts",
  "site/app/api/prototipo/modelo/route.ts",
  "site/lib/estudio/resolver-midia.ts",
  "site/app/painel/midia/page.tsx",
  "site/app/painel/automacao/page.tsx",
  "site/lib/media/r2.ts",
];

for (const rel of files) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  if (s.includes('"psicologia"')) {
    console.log("skip", rel);
    continue;
  }
  const next = s.replace(/"dentista",/, '"dentista",\n  "psicologia",\n  "nutricionista",');
  if (next === s) {
    console.log("MISS", rel);
    continue;
  }
  fs.writeFileSync(p, next);
  console.log("ok", rel);
}
