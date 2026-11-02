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

/** Busca Unsplash + palavras que NÃO podem aparecer no resultado. */
export const BUSCA_FOTO: Record<
  Nicho,
  { query: Record<string, string>; bloquear: string[] }
> = {
  barbearia: {
    query: {
      hero: "barbershop interior men fade haircut chair",
      sobre: "barber cutting mens hair close up",
      servico: "straight razor shave barbershop",
      profissional: "male barber portrait barbershop",
      galeria: "barbershop clippers details",
    },
    bloquear: ["manicure", "pedicure", "nails", "spa", "makeup", "hair salon woman", "beauty salon", "escova", "coloração"],
  },
  salao: {
    query: {
      hero: "hair salon woman blow dry styling",
      sobre: "hairdresser coloring hair salon",
      servico: "woman haircut salon mirror",
      profissional: "female hairdresser portrait salon",
      galeria: "hair salon interior chairs",
    },
    bloquear: ["barbershop", "beard shave", "fade haircut men", "straight razor"],
  },
  estetica: {
    query: {
      hero: "spa facial treatment cabin",
      sobre: "esthetician skincare treatment",
      servico: "facial spa massage",
      profissional: "esthetician portrait spa",
      galeria: "spa interior calm",
    },
    bloquear: ["barbershop", "gym", "hair salon blow dry"],
  },
  petshop: {
    query: { hero: "pet grooming salon dog", sobre: "dog bath grooming", servico: "cat dog pet shop", profissional: "pet groomer", galeria: "happy dog grooming" },
    bloquear: ["barbershop", "hair salon"],
  },
  academia: {
    query: { hero: "gym weights training", sobre: "personal trainer gym", servico: "dumbbell workout", profissional: "fitness coach portrait", galeria: "gym interior" },
    bloquear: ["spa facial", "hair salon", "barbershop"],
  },
  contabilidade: {
    query: { hero: "accounting office desk documents", sobre: "business meeting office", servico: "laptop spreadsheet office", profissional: "accountant portrait", galeria: "modern office" },
    bloquear: ["barbershop", "gym", "salon"],
  },
  advocacia: {
    query: { hero: "law office library", sobre: "lawyer meeting client", servico: "legal documents desk", profissional: "lawyer portrait", galeria: "courthouse columns" },
    bloquear: ["barbershop", "salon", "gym"],
  },
  clinica: {
    query: { hero: "medical clinic reception", sobre: "doctor consultation", servico: "clinic room", profissional: "doctor portrait", galeria: "clinic hallway" },
    bloquear: ["barbershop", "salon", "gym"],
  },
  generico: {
    query: { hero: "local small business storefront", sobre: "shopkeeper attending customer", servico: "local shop counter", profissional: "small business owner", galeria: "store interior" },
    bloquear: [],
  },
};

export const REGRA_NICHO: Record<Nicho, string> = {
  barbearia: "Barbearia masculina: corte, barba, fade, navalha. NUNCA descreva salão feminino, manicure, escova progressiva ou estética.",
  salao: "Salão de beleza: corte feminino, coloração, escova. Não descreva barbearia masculina.",
  estetica: "Clínica de estética e spa. Não descreva academia nem barbearia.",
  petshop: "Pet shop e banho e tosa. Não descreva salão de gente.",
  academia: "Academia e treino. Não descreva spa nem salão.",
  contabilidade: "Escritório de contabilidade. Linguagem empresarial.",
  advocacia: "Escritório de advocacia. Linguagem sóbria.",
  clinica: "Clínica de saúde. Linguagem cuidadosa.",
  generico: "Negócio local de rua.",
};

export function tomDoEstilo(estilo?: string) {
  if (estilo === "luxo") return "sofisticado, sóbrio, premium";
  if (estilo === "urbano") return "direto, jovem, com energia";
  if (estilo === "classico") return "tradicional, acolhedor, de ofício";
  if (estilo === "suave") return "calmo, leve, spa";
  return "profissional, claro, comercial";
}
