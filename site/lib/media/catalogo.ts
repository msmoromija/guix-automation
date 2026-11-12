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
  dentista: [
    "consultorio-odontologico",
    "cadeira-dentista",
    "limpeza-dental",
    "equipe-odonto",
    "recepcao-clinica",
  ],
  psicologia: [
    "consultorio-psicologia",
    "sala-terapia",
    "atendimento-psicologico",
    "acolhimento",
    "sessao",
  ],
  nutricionista: [
    "consultorio-nutricao",
    "alimentacao-saudavel",
    "orientacao-alimentar",
    "consulta-nutricao",
    "plano-alimentar",
  ],
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
  { query: Record<string, string>; bloquear: string[]; bloquearIds?: string[] }
> = {
  barbearia: {
    query: {
      hero: "barbershop shop interior chairs",
      sobre: "hairstylist cutting mens hair",
      servico: "barber shaving beard razor",
      profissional: "barber man portrait",
      galeria: "barbershop haircut client",
    },
    bloquear: [
      "manicure",
      "pedicure",
      "nails",
      "spa",
      "makeup",
      "hair salon woman",
      "beauty salon",
      "escova",
      "coloração",
      // Objetos/lugares que aparecem como ruído e não descrevem o ofício
      "rope",
      "bracelet",
      "watch",
      "smartphone",
      "dslr",
      "camera",
      "mannequin",
      "coffee shop",
      "floral",
    ],
    bloquearIds: ["1611103740957-a4fbefdeb0f7"],
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
    query: {
      hero: "lawyer client meeting consultation people",
      sobre: "attorney talking client office",
      servico: "legal consultation handshake documents people",
      profissional: "lawyer portrait professional",
      galeria: "law firm meeting team people",
    },
    bloquear: ["barbershop", "salon", "gym", "empty library", "empty office"],
  },
  clinica: {
    query: {
      hero: "doctor patient medical consultation people",
      sobre: "doctor talking patient clinic",
      servico: "physician appointment checkup people",
      profissional: "doctor portrait white coat",
      galeria: "medical team clinic patients people",
    },
    bloquear: ["barbershop", "salon", "gym", "empty room", "empty hallway"],
  },
  dentista: {
    query: {
      hero: "dentist treating patient dental chair people",
      sobre: "dentist patient consultation xray people",
      servico: "dental care smile cleaning people",
      profissional: "dentist portrait clinic coat",
      galeria: "dentist patient appointment clinic people",
    },
    bloquear: ["barbershop", "salon", "gym", "surgery gore", "blood", "empty room", "empty office"],
  },
  psicologia: {
    query: {
      hero: "therapist patient couch therapy session people",
      sobre: "psychologist talking client consultation faces",
      servico: "counseling session sofa people listening",
      profissional: "psychologist portrait professional warm",
      galeria: "therapy session people couch consultation",
    },
    bloquear: ["barbershop", "salon", "gym", "hospital surgery", "psychiatric ward", "empty office", "empty room"],
  },
  nutricionista: {
    query: {
      hero: "nutritionist consulting patient",
      sobre: "dietitian talking client fruits vegetables",
      servico: "healthy meal prep nutrition",
      profissional: "nutritionist portrait white coat",
      galeria: "fresh vegetables fruits kitchen",
    },
    bloquear: ["barbershop", "salon", "gym weights", "fast food junk", "selfie", "cooking show"],
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
  dentista:
    "Consultório odontológico: consulta, limpeza, restauração, clareamento e urgência simples. NUNCA prometa cura milagrosa, implante hospitalar ou cirurgia complexa como se fosse rotina de balcão. Linguagem clara e cuidadosa.",
  psicologia:
    "Consultório de psicologia: sessão individual, casal, adolescente e primeira conversa. NUNCA diagnostique, prometa cura ou use jargão clínico de hospital. Linguagem acolhedora e concreta sobre horário marcado.",
  nutricionista:
    "Consultório de nutrição: avaliação, plano alimentar, reconsulta e orientação esportiva básica. NUNCA prometa emagrecimento milagroso, dieta milagrosa ou resultado garantido em X dias. Linguagem clara e realista.",
  generico: "Negócio local de rua.",
};

export function tomDoEstilo(estilo?: string) {
  if (estilo === "luxo") return "sofisticado, sóbrio, premium";
  if (estilo === "urbano") return "direto, jovem, com energia";
  if (estilo === "classico") return "tradicional, acolhedor, de ofício";
  if (estilo === "suave") return "calmo, leve, spa";
  return "profissional, claro, comercial";
}
