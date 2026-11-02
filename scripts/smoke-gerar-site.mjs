/**
 * Smoke local sem Next: valida exemplo + patch empresa (sem OpenAI/R2).
 * Uso: node scripts/smoke-gerar-site.mjs
 */
import { readFile } from "fs/promises";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const addFormats = require("ajv-formats");

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const exemplo = JSON.parse(
  await readFile(path.join(root, "exemplos", "barbearia.site.json"), "utf8"),
);
const schema = JSON.parse(await readFile(path.join(root, "schema", "site.schema.json"), "utf8"));

exemplo.empresa.nome = "Barbearia Smoke Test";
exemplo.meta.nicho = "barbearia";
exemplo.hero.imagem.origem = "biblioteca";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const ok = validate(exemplo);
if (!ok) {
  console.error(validate.errors?.slice(0, 10));
  process.exit(1);
}
console.log("ok schema + origem biblioteca no hero");
