import fs from "fs";
import path from "path";

const root = "C:/Dev/guix-automation/site";
const files = [
  "lib/automacao/pos-pagamento.ts",
  "lib/sites/runner-pos-pago.ts",
  "app/api/prototipo/criar/route.ts",
  "app/api/prototipo/textos/route.ts",
  "app/api/prototipo/modelo/route.ts",
  "lib/estudio/resolver-midia.ts",
  "app/painel/midia/page.tsx",
  "app/painel/automacao/page.tsx",
];

for (const rel of files) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  if (s.includes('"clinica"') && /NICHOS|"dentista"/.test(s)) {
    // ensure clinica is in the list near dentista if missing from array of allowed
    if (!/"clinica",\s*"dentista"|"dentista",\s*"clinica"|"clinica",\s*\n\s*"dentista"/.test(s) && s.includes('"dentista"')) {
      if (!s.includes('"clinica"')) {
        s = s.replace(/"dentista",/, '"dentista",\n  "clinica",');
        fs.writeFileSync(p, s);
        console.log("added clinica", rel);
        continue;
      }
    }
    console.log("has clinica", rel);
    continue;
  }
  if (s.includes('"dentista"') && !s.includes('"clinica"')) {
    s = s.replace(/"dentista",/, '"dentista",\n  "clinica",');
    fs.writeFileSync(p, s);
    console.log("ok", rel);
  } else {
    console.log("skip", rel);
  }
}
