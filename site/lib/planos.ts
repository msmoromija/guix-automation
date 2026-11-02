import { nichos } from "./nichos";

export const TAXA_EQUIPE_CENTAVOS = 20_000;
export const MAX_PARCELAS = 12;

export type PlanoId = "simples" | "avancado";
export type Configuracao = "ia" | "equipe";

export const planos = [
  {
    id: "simples" as const,
    nome: "Presença Completa",
    centavos: 49_990,
    destaque: true,
    chamada: "Para a maioria dos negócios",
    resumo: "Barbearias, salões, estética, pet shops, academias, contabilidade e advocacia.",
    itens: [
      "Domínio próprio",
      "E-mail profissional",
      "Site responsivo",
      "Agenda online",
      "WhatsApp integrado",
      "Publicação em até 24 horas",
    ],
  },
  {
    id: "avancado" as const,
    nome: "Presença Avançada",
    centavos: 149_990,
    destaque: false,
    chamada: "Negócios com mais recursos",
    resumo: "Clínicas, consultórios, imobiliárias e operações que pedem catálogo ou agenda mais completa.",
    itens: [
      "Tudo da Presença Completa",
      "Estrutura própria do segmento",
      "Agenda, especialidades ou catálogo",
      "Publicação em até 24 horas",
    ],
  },
];

export const nichosSimples = nichos.map((item) => ({ id: item.slug, nome: item.nome }));

export const nichosAvancados = [
  { id: "clinica", nome: "Clínica" },
  { id: "dentista", nome: "Dentista" },
  { id: "imobiliaria", nome: "Imobiliária" },
];

export function planoPorId(id: string) {
  return planos.find((item) => item.id === id);
}

export function nichosDoPlano(id: PlanoId) {
  return id === "avancado" ? nichosAvancados : nichosSimples;
}

export function nomeDoNicho(plano: PlanoId, id: string) {
  return nichosDoPlano(plano).find((item) => item.id === id)?.nome ?? null;
}

export function calcularTotal(plano: PlanoId, configuracao: Configuracao) {
  const base = planoPorId(plano)?.centavos ?? 0;
  return base + (configuracao === "equipe" ? TAXA_EQUIPE_CENTAVOS : 0);
}
