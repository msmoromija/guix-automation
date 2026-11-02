import type { Nicho } from "./tipos";

/** Tags da biblioteca própria — usadas pela IA e pelo painel. */
const TAGS: Record<Nicho, string[]> = {
  barbearia: [
    "barber-chair",
    "fade",
    "barba",
    "tesoura",
    "interior-barbearia",
    "produto-barba",
    "equipe",
  ],
  salao: [
    "corte-feminino",
    "coloracao",
    "escova",
    "interior-salao",
    "manicure",
    "equipe-salao",
  ],
  estetica: [
    "limpeza-pele",
    "spa",
    "massage",
    "cabine",
    "skincare",
    "relaxamento",
  ],
  petshop: ["cachorro", "gato", "banho-tosa", "pet-shop", "veterinario"],
  academia: ["musculacao", "treino", "halteres", "aula-coletiva", "cardio"],
  contabilidade: ["escritorio", "reuniao", "documentos", "notebook", "equipe"],
  advocacia: ["escritorio-advocacia", "balanca", "reuniao-cliente", "biblioteca"],
  clinica: ["consultorio", "atendimento", "equipe-medica", "recepcao"],
  generico: ["negocio-local", "atendimento", "fachada", "equipe", "produto"],
};

export function tagsDoNicho(nicho: Nicho): string[] {
  return TAGS[nicho] || TAGS.generico;
}

export function todosOsNichosComTags() {
  return Object.entries(TAGS).map(([nicho, tags]) => ({
    nicho: nicho as Nicho,
    tags,
  }));
}
