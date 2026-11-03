export type FaixaPrecoCliente = "avancado" | "personalizado";

export type ClienteCaso = {
  slug: string;
  nome: string;
  segmento: string;
  resumo: string;
  detalhe: string;
  /** Liga o caso ao plano da vitrine de preços. */
  faixa: FaixaPrecoCliente;
  /** Centavos de referência do plano (vitrine). */
  precoCentavos: number;
  /** Texto curto do selo de preço. */
  precoRotulo: string;
  marcaRegistrada?: string;
  /** Só quando o GuiX.net também entregou o site. */
  siteUrl?: string;
  siteLabel?: string;
  appUrl?: string;
  appLabel?: string;
  destaques: string[];
  painelTitulo?: string;
  painelTexto?: string;
  painelItens?: string[];
  painelLinkLabel?: string;
  painelLinkUrl?: string;
};

export const clientes: ClienteCaso[] = [
  {
    slug: "as-contabil-mei-em-dia",
    nome: "AS Contábil — MEI em Dia",
    segmento: "SaaS contábil para MEI",
    faixa: "avancado",
    precoCentavos: 149_990,
    precoRotulo: "Presença Avançada · R$ 1.499,90",
    resumo:
      "Aplicação web para o microempreendedor organizar receitas, despesas e faturamento, acompanhar o limite anual do MEI e escolher o nível de apoio do escritório contábil.",
    detalhe:
      "Exemplo na faixa da Presença Avançada (R$ 1.499,90): o GuiX.net desenvolveu o SaaS MEI em Dia para a Alfredo Santos Contábil — não o site institucional do escritório. A aplicação concentra o controle financeiro do negócio e a ponte com o contador: do registro do dia a dia à integração contábil, com planos claros para quem quer só organizar ou também contar com o escritório.",
    appUrl: "https://app.alfredosantoscontabil.com.br",
    appLabel: "Abrir o SaaS MEI em Dia",
    destaques: [
      "Registro de receitas, despesas e histórico financeiro",
      "Acompanhamento de faturamento mensal, anual e limite do MEI",
      "Planos MEI Controle e MEI Contador",
      "Envio de documentos e notas ao escritório no plano com apoio",
      "Solicitação de serviços contábeis avulsos quando precisar",
    ],
    painelTitulo: "O que o MEI encontra",
    painelTexto:
      "Uma ferramenta simples, feita para quem trabalha por conta própria — com clareza nos números e apoio contábil sob medida.",
    painelItens: [
      "Organize finanças",
      "Acompanhe números",
      "Limite anual MEI",
      "MEI Controle",
      "MEI Contador",
      "Serviços extras",
    ],
    painelLinkLabel: "Conferir o SaaS no ar →",
  },
  {
    slug: "morox-industrial",
    nome: "MOROX Industrial SaaS",
    segmento: "Orçamentação industrial e gestão comercial",
    faixa: "personalizado",
    precoCentavos: 299_990,
    precoRotulo: "Presença Personalizada · a partir de R$ 2.999,90",
    resumo:
      "Plataforma de orçamentação para usinagem e fabricação — da solicitação ao preço aprovado, com custo, margem, proposta e conversa com o cliente no mesmo fluxo.",
    detalhe:
      "Exemplo na faixa da Presença Personalizada (a partir de R$ 2.999,90): site e SaaS com algoritmos avançados para automatizar a orçamentação industrial. A formação de preço deixa de depender de planilha solta: matéria-prima, processos, insumos, equipamentos, markup e impostos entram no mesmo cálculo.",
    marcaRegistrada: "Marca MOROX registrada no INPI.",
    siteUrl: "https://www.morox.com.br",
    siteLabel: "morox.com.br",
    appUrl: "https://play.google.com/store/apps/details?id=br.com.morox.industrial",
    appLabel: "App na Google Play",
    destaques: [
      "Automação do fluxo comercial de orçamentos",
      "Formação de custo com matéria-prima, processos e equipamentos",
      "Propostas em PDF com validade e condições comerciais",
      "Comunicação com o cliente vinculada a cada orçamento",
      "Multiplataforma: site, PC, tablet e celular",
    ],
    painelTitulo: "Calculadoras da oficina",
    painelTexto:
      "No site, a formação de preço ganha ferramentas prontas — peso, solda, hora-máquina, markup e mais, sem planilha.",
    painelItens: [
      "Peso",
      "Solda",
      "Roscas",
      "RPM",
      "Hora-máquina",
      "Preço da peça",
      "Markup",
      "Equilíbrio",
      "DIFAL",
      "Polegada",
    ],
    painelLinkLabel: "Conferir as calculadoras no site →",
    painelLinkUrl: "https://www.morox.com.br/calculadoras",
  },
];

export function clientePorSlug(slug: string) {
  return clientes.find((item) => item.slug === slug);
}

export function clientesPorFaixa(faixa: FaixaPrecoCliente) {
  return clientes.filter((item) => item.faixa === faixa);
}
