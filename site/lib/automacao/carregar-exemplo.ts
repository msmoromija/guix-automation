import { readFile } from "fs/promises";
import path from "path";
import type { Nicho } from "@/lib/media/tipos";

const TEMPLATE_ID: Record<Nicho, string> = {
  barbearia: "barbearia-v1",
  salao: "salao-v1",
  estetica: "estetica-v1",
  petshop: "petshop-v1",
  academia: "academia-v1",
  contabilidade: "contabilidade-v1",
  advocacia: "advocacia-v1",
  clinica: "clinica-v1",
  generico: "generico-v1",
};

/** Exemplos disponíveis (sem clinica/generico ainda). */
const FALLBACK: Partial<Record<Nicho, Nicho>> = {
  clinica: "estetica",
  generico: "barbearia",
};

export function templateIdDoNicho(nicho: Nicho) {
  return TEMPLATE_ID[nicho] || `${nicho}-v1`;
}

function candidatosExemplo(nicho: string) {
  const nome = `${nicho}.site.json`;
  const cwd = process.cwd();
  return [
    path.join(cwd, "content", "exemplos", nome),
    path.join(cwd, "site", "content", "exemplos", nome),
    path.join(cwd, "exemplos", nome),
    path.join(cwd, "..", "exemplos", nome),
  ];
}

export async function carregarExemplo(nicho: Nicho): Promise<Record<string, unknown>> {
  const efetivo = FALLBACK[nicho] || nicho;
  const erros: string[] = [];
  for (const arquivo of candidatosExemplo(efetivo)) {
    try {
      const raw = await readFile(arquivo, "utf8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      erros.push(`${arquivo}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }
  throw new Error(`exemplo não encontrado para nicho ${nicho}. Tentativas: ${erros.join(" | ")}`);
}
