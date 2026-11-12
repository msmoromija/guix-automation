import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Validação sem TS: JSONs + pastas de marca + allowlists em arquivos-fonte
const root = path.resolve(".");
const exemplos = ["dentista", "psicologia", "nutricionista"];
const erros = [];

for (const n of exemplos) {
  const p = path.join(root, "content/exemplos", `${n}.site.json`);
  if (!fs.existsSync(p)) {
    erros.push(`falta ${p}`);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (j?.meta?.nicho !== n) erros.push(`${n}: meta.nicho=${j?.meta?.nicho}`);
  if (!j?.empresa?.nome) erros.push(`${n}: sem empresa.nome`);
  if (!Array.isArray(j?.servicos?.itens) || j.servicos.itens.length < 3) erros.push(`${n}: poucos serviços`);
  if (!Array.isArray(j?.faq?.itens) || j.faq.itens.length < 4) erros.push(`${n}: FAQ curto`);

  const marcas = path.join(root, "public/marcas", n);
  if (!fs.existsSync(marcas)) {
    erros.push(`falta pasta marcas/${n}`);
    continue;
  }
  const pngs = fs.readdirSync(marcas).filter((f) => f.endsWith(".png"));
  const index = JSON.parse(fs.readFileSync(path.join(marcas, "index.json"), "utf8"));
  if (pngs.length < 8) erros.push(`${n}: só ${pngs.length} logos`);
  if (index.length !== pngs.length) erros.push(`${n}: index.json desalinhado (${index.length} vs ${pngs.length})`);
}

const fontes = [
  "lib/media/tipos.ts",
  "lib/nichos.ts",
  "lib/planos.ts",
  "lib/automacao/template-id.ts",
  "lib/media/catalogo.ts",
  "lib/sites/runner-pos-pago.ts",
  "app/api/prototipo/criar/route.ts",
  "components/Footer.tsx",
];

for (const f of fontes) {
  const s = fs.readFileSync(path.join(root, f), "utf8");
  for (const n of exemplos) {
    if (f.includes("Footer")) continue;
    if (!s.includes(n) && !s.includes(`"${n}"`) && !s.includes(`'${n}'`)) {
      // planos.ts tem os ids; Footer não precisa
      if (f.endsWith("Footer.tsx")) continue;
      if (f.includes("tipos") || f.includes("nichos") || f.includes("planos") || f.includes("catalogo") || f.includes("template") || f.includes("runner") || f.includes("criar")) {
        if (!s.includes(n)) erros.push(`${f}: sem ${n}`);
      }
    }
  }
}

const footer = fs.readFileSync(path.join(root, "components/Footer.tsx"), "utf8");
if (!footer.includes("navEsq") || !footer.includes("Contato")) {
  erros.push("Footer: layout novo ausente");
}
if (footer.includes("sm:grid-cols-[1.3fr_1fr_1fr]") && !footer.includes("navEsq")) {
  erros.push("Footer: layout antigo ainda presente");
}

const planos = fs.readFileSync(path.join(root, "lib/planos.ts"), "utf8");
const nichosFonte = fs.readFileSync(path.join(root, "lib/nichos.ts"), "utf8");
for (const n of exemplos) {
  if (!nichosFonte.includes(`slug: "${n}"`)) erros.push(`nichos: ${n} ausente do catálogo`);
}
if (!planos.includes("nichos.map((item) => ({ id: item.slug, nome: item.nome }))")) {
  erros.push("planos: nichos com modelo pronto não entram no plano simples");
}
if (!planos.includes('{ id: "imobiliaria", nome: "Imobiliária" }')) {
  erros.push("planos: nicho sem modelo pronto ausente do plano avançado");
}

if (erros.length) {
  console.error("FALHOU:\n- " + erros.join("\n- "));
  process.exit(1);
}
console.log("OK smoke nichos + footer");
for (const n of exemplos) {
  const pngs = fs.readdirSync(path.join(root, "public/marcas", n)).filter((f) => f.endsWith(".png"));
  console.log(`  ${n}: json + ${pngs.length} logos`);
}
