export type PassoItem = {
  slug: string;
  numero: string;
  titulo: string;
  texto: string;
  resumo: string;
  pontos: string[];
  detalhe: string;
};

export const passos: PassoItem[] = [
  {
    slug: "informacoes",
    numero: "01",
    titulo: "Você envia as informações",
    texto: "Nome do negócio, serviços, horários, cores e preferências.",
    resumo: "Tudo começa com os dados do seu negócio. Quanto mais claros, mais rápido a estrutura fica pronta.",
    pontos: [
      "Nome, segmento e endereço do negócio.",
      "Serviços, preços e duração de cada atendimento.",
      "Horários de funcionamento e preferências de cores.",
      "WhatsApp e contatos que devem aparecer no site.",
    ],
    detalhe:
      "Você não precisa escrever o site do zero. Envia o essencial do negócio — o que vende, quando atende, como quer aparecer — e o GuiX.net usa isso para montar a presença. Se faltar um dado importante, o prazo de 24 horas começa quando ele chega completo.",
  },
  {
    slug: "configuracao",
    numero: "02",
    titulo: "A IA e o sistema configuram tudo",
    texto: "Textos, estrutura, agenda e WhatsApp são preparados automaticamente.",
    resumo: "A IA e o sistema montam textos, páginas, agenda e integração com WhatsApp a partir do que você enviou.",
    pontos: [
      "Textos e estrutura do site no tom do seu segmento.",
      "Agenda com serviços, duração e horários disponíveis.",
      "Botões e confirmações ligados ao WhatsApp da empresa.",
      "Identidade visual alinhada às cores e preferências enviadas.",
    ],
    detalhe:
      "Em vez de um processo manual lento de agência, a configuração é automática. A IA organiza a cara do site; o sistema prepara agenda e WhatsApp. Você ainda pode escolher configuração feita pela equipe, com taxa extra, se preferir não usar a IA.",
  },
  {
    slug: "publicacao",
    numero: "03",
    titulo: "Publicamos em até 24 horas",
    texto: "Domínio, e-mail e site entram no ar juntos.",
    resumo: "Quando as informações estão completas, a presença entra no ar em até 24 horas: domínio, e-mail, site, agenda e WhatsApp.",
    pontos: [
      "Domínio próprio no nome do negócio.",
      "E-mail profissional no mesmo domínio.",
      "Site no ar, com agenda e WhatsApp funcionando.",
      "Um único momento de publicação, sem peças soltas.",
    ],
    detalhe:
      "A entrega não é só o visual do site. Domínio, e-mail e página entram juntos, com a agenda pronta para receber horários e o WhatsApp no número da empresa. O prazo de até 24 horas vale a partir das informações completas.",
  },
  {
    slug: "controle",
    numero: "04",
    titulo: "Você assume o controle",
    texto: "Altera horários, serviços e conteúdos pelo painel, sem complicação.",
    resumo: "Depois da publicação, o painel fica com você. Muda o que precisa sem abrir chamado para agência.",
    pontos: [
      "Horários, serviços e textos editáveis no painel.",
      "Sem depender de agência para ajustes do dia a dia.",
      "O site continua no ar enquanto você atualiza.",
      "Presença sua: um pagamento pela estrutura, sem mensalidade de site.",
    ],
    detalhe:
      "Publicar é o começo. O painel acompanha o negócio depois: troca horário, inclui serviço, ajusta texto. A ideia é você operar sozinho no essencial, com a estrutura já pronta — não ficar preso a um processo lento cada vez que algo muda.",
  },
];

export function passoPorSlug(slug: string) {
  return passos.find((item) => item.slug === slug);
}
