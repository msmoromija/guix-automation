import { nichos } from "./nichos";

export const TAXA_EQUIPE_CENTAVOS = 20_000;
export const MAX_PARCELAS = 12;

export type PlanoId = "simples" | "avancado";
export type Configuracao = "ia" | "equipe";

export type PlanoVitrine = {
  id: PlanoId | "personalizado";
  nome: string;
  centavos: number;
  destaque: boolean;
  aPartirDe?: boolean;
  contratavel: boolean;
  chamada: string;
  resumo: string;
  itens: string[];
  ctaLabel: string;
};

export const planos: PlanoVitrine[] = [
  {
    id: "simples",
    nome: "Presença Completa",
    centavos: 49_990,
    destaque: true,
    contratavel: true,
    chamada: "Mais pedida",
    resumo:
      "Para serviços com modelo padrão: barbearias, salões, estética, pet shops, academias, contabilidade e advocacia.",
    itens: [
      "Domínio próprio",
      "E-mail profissional",
      "Site responsivo",
      "Agenda online",
      "WhatsApp integrado",
      "Publicação em até 24 horas",
    ],
    ctaLabel: "Quero meu site agora",
  },
  {
    id: "avancado",
    nome: "Presença Avançada",
    centavos: 149_990,
    destaque: false,
    contratavel: true,
    chamada: "Mais estrutura",
    resumo:
      "Para negócios médios que precisam de mais estrutura: imobiliárias, consultórios menores e operações com catálogo ou agenda mais organizada.",
    itens: [
      "Tudo da Presença Completa",
      "Estrutura própria do segmento",
      "Agenda, especialidades ou catálogo",
      "Publicação em até 24 horas",
    ],
    ctaLabel: "Quero meu site agora",
  },
  {
    id: "personalizado",
    nome: "Presença Personalizada",
    centavos: 299_990,
    destaque: false,
    aPartirDe: true,
    contratavel: false,
    chamada: "Sob medida",
    resumo:
      "Para negócios com operação mais complexa ou que precisam de personalização maior: clínicas e consultórios com equipe, imobiliárias com catálogo robusto, escolas, estúdios com múltiplos serviços, empresas com fluxos próprios de agendamento ou qualquer operação que exija estrutura e configuração mais específicas. O valor final depende do nível de personalização necessário.",
    itens: [
      "Tudo da Presença Avançada",
      "Configuração mais profunda e específica do negócio",
      "Fluxos e estrutura sob medida",
      "Suporte mais próximo na montagem",
    ],
    ctaLabel: "Falar no WhatsApp",
  },
];

export const planosContrataveis = planos.filter(
  (item): item is PlanoVitrine & { id: PlanoId; contratavel: true } => item.contratavel && (item.id === "simples" || item.id === "avancado"),
);

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
