export type DiferencialItem = {
  slug: string;
  numero: string;
  titulo: string;
  texto: string;
  resumo: string;
  pontos: string[];
  detalhe: string;
};

export const diferenciais: DiferencialItem[] = [
  {
    slug: "24-horas",
    numero: "01",
    titulo: "No ar em até 24 horas",
    texto: "Na prática, após o pagamento e a confirmação dos dados, costuma ficar pronto em poucas horas.",
    resumo: "Velocidade de produto, não de agência. Na prática, após o pagamento e a confirmação dos dados, costuma ficar pronto em poucas horas.",
    pontos: [
      "Prazo conta a partir das informações completas do negócio.",
      "Sem fila longa de briefing e revisão de agência.",
      "Domínio, e-mail, site, agenda e WhatsApp saem juntos.",
      "Você acompanha a jornada do pedido à publicação.",
    ],
    detalhe:
      "Agência tradicional costuma medir entrega em semanas. O GuiX.net foi feito para o ritmo do pequeno negócio: você envia o essencial, o sistema configura e, com tudo completo, a presença entra no ar em até 24 horas. Se faltar um dado importante, o prazo só começa quando ele chega.",
  },
  {
    slug: "entrega-completa",
    numero: "02",
    titulo: "Cinco peças, uma entrega",
    texto: "Domínio, e-mail, site, agenda e WhatsApp entram juntos. O cliente encontra o negócio e já marca horário.",
    resumo: "Não é só um site bonito. É a presença completa: encontrar, entender, agendar e falar no WhatsApp.",
    pontos: [
      "Domínio próprio no nome do negócio.",
      "E-mail profissional no mesmo domínio.",
      "Site responsivo com a cara do segmento.",
      "Agenda online e WhatsApp no número da empresa.",
    ],
    detalhe:
      "Ter só Instagram ou só um link genérico deixa o cliente perdido. No GuiX.net as cinco peças entram na mesma entrega: o endereço na internet, o e-mail sério, o site, a agenda e o WhatsApp. O cliente acha o negócio e já consegue marcar horário ou conversar.",
  },
  {
    slug: "visual-profissional",
    numero: "03",
    titulo: "Cara de empresa séria",
    texto: "Visual profissional do primeiro dia, com a identidade do seu segmento — não um cartão improvisado no Instagram.",
    resumo: "Primeira impressão conta. O site chega com visual de empresa, alinhado ao tipo de negócio — não um perfil improvisado.",
    pontos: [
      "Layout moderno, pensado para celular.",
      "Identidade do nicho: barbearia, salão, clínica e outros.",
      "Textos e estrutura preparados a partir do seu negócio.",
      "Exemplos públicos para você ver o padrão antes de contratar.",
    ],
    detalhe:
      "Muita gente ainda apresenta o negócio só no Instagram Stories. O GuiX.net entrega uma página com cara profissional desde o primeiro dia: tipografia, hierarquia, botões de agenda e WhatsApp. O cliente sente empresa séria — sem precisar virar designer.",
  },
  {
    slug: "painel",
    numero: "04",
    titulo: "Painel na sua mão",
    texto: "Depois da publicação você altera horários, serviços e textos sozinho. Sem abrir chamado para cada mudança.",
    resumo: "Publicar não é o fim. O painel fica com você para ajustar o dia a dia do negócio sem depender de agência.",
    pontos: [
      "Horários, serviços e textos editáveis.",
      "Sem chamado para cada ajuste pequeno.",
      "O site continua no ar enquanto você atualiza.",
      "Controle real depois da entrega.",
    ],
    detalhe:
      "O pior de muita presença digital é ficar refém de alguém para mudar um horário. No GuiX.net, depois da publicação o painel é seu: você altera o que o negócio muda toda semana — serviços, textos, grade — sem reabrir um projeto caro.",
  },
  {
    slug: "pagamento-unico",
    numero: "05",
    titulo: "Um pagamento, sem mensalidade de site",
    texto: "Você paga a estrutura e assume o controle. Sem surpresa de cobrança mensal só para manter a página no ar.",
    resumo: "Você paga a estrutura uma vez. Não há mensalidade de site cobrada pelo GuiX.net para manter a página no ar.",
    pontos: [
      "Completa, Avançada ou Personalizada — pagamento da estrutura, sem mensalidade de site.",
      "Sem mensalidade de site pelo GuiX.net.",
      "PIX, boleto ou cartão em até 12x via Asaas.",
      "O primeiro ano do domínio já entra na compra inicial.",
    ],
    detalhe:
      "Muita solução vende barato e prende em mensalidade. O GuiX.net cobra a estrutura: você paga, publica e assume o controle. Não existe mensalidade de site conosco. Depois do primeiro ano, a renovação do domínio pode ser com o time GuiX.net ou direto no provedor — os detalhes estão no FAQ e no suporte.",
  },
  {
    slug: "ia",
    numero: "06",
    titulo: "IA no ritmo do negócio",
    texto: "Automação e IA montam a base. Se preferir gente no lugar da IA, a equipe configura com taxa clara na contratação.",
    resumo: "IA e automação aceleram a montagem. Se quiser configuração humana, a opção existe com taxa clara na contratação.",
    pontos: [
      "IA prepara textos, estrutura, agenda e WhatsApp.",
      "Caminho padrão: mais rápido e incluso no plano.",
      "Opção de equipe sem IA: + R$ 200,00 na contratação.",
      "Você escolhe o modo na hora de contratar.",
    ],
    detalhe:
      "A IA não substitui o seu negócio — ela organiza a base a partir do que você enviou. Por isso a entrega é rápida. Se preferir que a nossa equipe configure sem IA, basta escolher essa opção na contratação, com a taxa de R$ 200,00 informada de forma clara.",
  },
];

export function diferencialPorSlug(slug: string) {
  return diferenciais.find((item) => item.slug === slug);
}
