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
      "Para quem usa modelo pronto com automação do projeto: barbearia, salão, estética, pet shop, academia, contabilidade, advocacia, dentista, clínica, psicologia e nutricionista.",
    itens: [
      "Domínio próprio",
      "Até 5 e-mails profissionais (Zoho)",
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
      "Para soluções um pouco mais complexas — sem modelo pronto no ar: imobiliária, catálogo robusto, operação com fluxos extras ou estrutura além do padrão automatizado.",
    itens: [
      "Tudo da Presença Completa",
      "Estrutura adaptada ao segmento",
      "Catálogo, agenda ou fluxos extras",
      "Publicação em até 5 dias (5 x 24 horas), conforme o escopo",
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
      "Para operações bem mais complexas ou sob medida: SaaS, portais industriais, escolas, multiunidades, fluxos próprios de agendamento ou qualquer projeto que exija configuração profunda. O valor final depende da personalização.",
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

/** Todos os nichos com modelo pronto e automação entram na Presença Completa. */
export const nichosSimples = nichos.map((item) => ({ id: item.slug, nome: item.nome }));

/** Sem modelo pré-pronto — soluções um pouco mais complexas. */
export const nichosAvancados = [{ id: "imobiliaria", nome: "Imobiliária" }];

export function planoPorId(id: string) {
  return planos.find((item) => item.id === id);
}

export function nichosDoPlano(id: PlanoId) {
  return id === "avancado" ? nichosAvancados : nichosSimples;
}

export function nomeDoNicho(plano: PlanoId, id: string) {
  return (
    nichosDoPlano(plano).find((item) => item.id === id)?.nome ??
    nichosSimples.find((item) => item.id === id)?.nome ??
    nichosAvancados.find((item) => item.id === id)?.nome ??
    null
  );
}

export function calcularTotal(plano: PlanoId, configuracao: Configuracao) {
  const base = planoPorId(plano)?.centavos ?? 0;
  return base + (configuracao === "equipe" ? TAXA_EQUIPE_CENTAVOS : 0);
}
