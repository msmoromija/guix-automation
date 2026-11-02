import { readFile } from "fs/promises";
import path from "path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

function candidatosSchema() {
  const cwd = process.cwd();
  return [
    path.join(cwd, "schema", "site.schema.json"),
    path.join(cwd, "site", "schema", "site.schema.json"),
    path.join(cwd, "..", "schema", "site.schema.json"),
  ];
}

let validador: ReturnType<Ajv2020["compile"]> | null = null;

async function obterValidador() {
  if (validador) return validador;
  let schema: object | null = null;
  for (const schemaPath of candidatosSchema()) {
    try {
      schema = JSON.parse(await readFile(schemaPath, "utf8")) as object;
      break;
    } catch {
      /* next */
    }
  }
  if (!schema) throw new Error("schema/site.schema.json não encontrado");

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  validador = ajv.compile(schema);
  return validador;
}

export async function validarSiteJson(
  site: unknown,
): Promise<{ ok: true } | { ok: false; erros: string[] }> {
  const validate = await obterValidador();
  const ok = validate(site);
  if (ok) return { ok: true };
  const erros = (validate.errors || []).map((e) =>
    `${e.instancePath || "/"} ${e.message || ""}`.trim(),
  );
  return { ok: false, erros };
}
