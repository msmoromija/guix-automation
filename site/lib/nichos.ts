export type Tema = {
  fundo: string;
  tinta: string;
  acento: string;
  superficie: string;
};

export type Nicho = {
  slug: string;
  nome: string;
  negocio: string;
  lugar: string;
  frase: string;
  detalhe: string;
  demo: string;
  tema: Tema;
};

export const nichos: Nicho[] = [
  {
    slug: "barbearia",
    nome: "Barbearia",
    negocio: "Barbearia Vila Norte",
    lugar: "Jardins, Aracaju",
    frase: "Corte e barba com hora marcada.",
    detalhe: "O cliente escolhe o serviço, o barbeiro e o horário no site — reserva automática, sem depender do WhatsApp.",
    demo: "/exemplos/barbearia",
    tema: { fundo: "#141210", tinta: "#F4F0E6", acento: "#E4C48A", superficie: "#221F1B" },
  },
  {
    slug: "salao",
    nome: "Salão",
    negocio: "Salão Vila Flor",
    lugar: "Atalaia, Aracaju",
    frase: "Corte, cor e unhas sem fila na recepção.",
    detalhe: "Vários serviços e várias profissionais no mesmo endereço, com horário reservado.",
    demo: "/exemplos/salao",
    tema: { fundo: "#F7F4F1", tinta: "#3F2A26", acento: "#C4A484", superficie: "#FFFFFF" },
  },
  {
    slug: "estetica",
    nome: "Estética",
    negocio: "Estúdio Serra Clara",
    lugar: "Treze de Julho, Aracaju",
    frase: "A sala fica só sua no horário marcado.",
    detalhe: "Massagem, sobrancelha e cuidados estéticos. Sem procedimento médico e sem promessa clínica.",
    demo: "/exemplos/estetica",
    tema: { fundo: "#F4F6F3", tinta: "#1E3330", acento: "#C4A882", superficie: "#FFFFFF" },
  },
  {
    slug: "petshop",
    nome: "Pet shop",
    negocio: "Pet Shop Bento",
    lugar: "Grageru, Aracaju",
    frase: "Banho e tosa com preço por porte.",
    detalhe: "Pequeno, médio e grande têm tempo próprio. Vacina e remédio ficam com o veterinário.",
    demo: "/exemplos/petshop",
    tema: { fundo: "#F7F6F2", tinta: "#243028", acento: "#D4B46A", superficie: "#FFFFFF" },
  },
  {
    slug: "academia",
    nome: "Academia",
    negocio: "Academia Farol",
    lugar: "Farolândia, Aracaju",
    frase: "Avaliação e aula, manhã e tarde separadas.",
    detalhe: "A grade da manhã e a da tarde aparecem em blocos. O meio do dia continua fechado.",
    demo: "/exemplos/academia",
    tema: { fundo: "#101418", tinta: "#F3F4F6", acento: "#D6E26A", superficie: "#1A2128" },
  },
  {
    slug: "contabilidade",
    nome: "Contabilidade",
    negocio: "Lima Contabilidade",
    lugar: "Centro, Aracaju",
    frase: "A reunião com o contador tem hora.",
    detalhe: "Abertura, imposto de renda e folha. A inscrição do MEI no governo continua gratuita.",
    demo: "/exemplos/contabilidade",
    tema: { fundo: "#F4F6F8", tinta: "#1A3654", acento: "#1A3654", superficie: "#FFFFFF" },
  },
  {
    slug: "advocacia",
    nome: "Advocacia",
    negocio: "Vale Luz Advogados",
    lugar: "Centro, Aracaju",
    frase: "Primeiro a gente ouve o seu caso.",
    detalhe: "O valor da página é a conversa. Processo, se existir, é orçado à parte.",
    demo: "/exemplos/advocacia",
    tema: { fundo: "#F6F4F1", tinta: "#1A1A1A", acento: "#6E2430", superficie: "#FFFFFF" },
  },
  {
    slug: "dentista",
    nome: "Dentista",
    negocio: "Consultório Costa Clara",
    lugar: "Treze de Julho, Aracaju",
    frase: "Seu sorriso, no horário que você escolhe.",
    detalhe: "Avaliação, limpeza, restauração e urgência simples. O paciente escolhe o horário no site.",
    demo: "/exemplos/dentista",
    tema: { fundo: "#F3F8F9", tinta: "#0F3D4A", acento: "#0D9488", superficie: "#FFFFFF" },
  },
  {
    slug: "clinica",
    nome: "Clínica médica",
    negocio: "Clínica Horizonte",
    lugar: "Treze de Julho, Aracaju",
    frase: "O médico te recebe no horário marcado.",
    detalhe: "Clínica geral, retorno, check-up e pediatria. O paciente reserva o horário no site.",
    demo: "/exemplos/clinica",
    tema: { fundo: "#F3F7FA", tinta: "#0F3D5E", acento: "#0EA5E9", superficie: "#FFFFFF" },
  },
  {
    slug: "psicologia",
    nome: "Psicologia",
    negocio: "Consultório Serena Vale",
    lugar: "Jardins, Aracaju",
    frase: "Um horário só seu para conversar.",
    detalhe: "Atendimento individual, casal e adolescente. O paciente reserva o horário no site.",
    demo: "/exemplos/psicologia",
    tema: { fundo: "#F4F6FA", tinta: "#1B365D", acento: "#C6A15B", superficie: "#FFFFFF" },
  },
  {
    slug: "nutricionista",
    nome: "Nutricionista",
    negocio: "Consultório Nutri Farol",
    lugar: "Farolândia, Aracaju",
    frase: "Comer melhor começa numa conversa.",
    detalhe: "Avaliação, plano alimentar e reconsulta. O paciente escolhe o horário no site.",
    demo: "/exemplos/nutricionista",
    tema: { fundo: "#F4F8F3", tinta: "#1F3D2A", acento: "#5B8C3E", superficie: "#FFFFFF" },
  },
];

export function nichoPorSlug(slug: string) {
  return nichos.find((item) => item.slug === slug);
}
