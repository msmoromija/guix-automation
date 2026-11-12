export type ProdutoItem = {
  slug: string;
  icone: "dominio" | "email" | "site" | "agenda" | "whatsapp";
  titulo: string;
  texto: string;
  resumo: string;
  pontos: string[];
  detalhe: string;
};

export const produtos: ProdutoItem[] = [
  {
    slug: "dominio",
    icone: "dominio",
    titulo: "Domínio próprio",
    texto: "O endereço do seu negócio na internet, com o nome que você escolher.",
    resumo: "Seu site entra no ar com um endereço profissional, no nome do negócio — não em um link genérico de plataforma.",
    pontos: [
      "O domínio fica no nome do negócio.",
      "O endereço acompanha a marca que você escolher, dentro das regras de disponibilidade.",
      "Entra junto com o site na publicação, em até 24 horas depois das informações completas.",
      "O cliente digita o nome do negócio e chega direto na página certa.",
    ],
    detalhe:
      "Sem domínio próprio, o negócio parece provisório. Com o GuiX.net, o endereço faz parte da entrega: o site não fica escondido atrás de um subdomínio de terceiro. Você escolhe o nome; nós configuramos e publicamos junto com o restante da presença.",
  },
  {
    slug: "email",
    icone: "email",
    titulo: "E-mail profissional",
    texto: "Até 5 contas no seu domínio (contato@, financeiro@ etc.), configuradas por nós. Cara de empresa desde o primeiro dia.",
    resumo: "Até 5 caixas no mesmo domínio do site, configuradas por nós, para o cliente reconhecer a empresa na primeira mensagem.",
    pontos: [
      "Até 5 endereços no domínio do negócio, como contato@seunegocio.com.br.",
      "Combina com o site e reforça confiança na hora do agendamento.",
      "Serve para atendimento, confirmações e comunicação do dia a dia.",
      "Entra na mesma entrega da presença digital, sem contratações separadas.",
    ],
    detalhe:
      "E-mail gratuito de consumidor passa a impressão errada. O e-mail profissional usa o domínio do negócio e aparece alinhado ao site. Assim, quando o cliente marca horário ou tira dúvida, a conversa já começa com cara de empresa séria.",
  },
  {
    slug: "site",
    icone: "site",
    titulo: "Site responsivo",
    texto: "Site moderno, rápido e adaptado para celular, com a identidade do seu negócio.",
    resumo: "Uma página clara no celular e no computador, com a cara do seu segmento, pronta para agendar e chamar no WhatsApp.",
    pontos: [
      "Layout moderno, pensado primeiro para celular.",
      "Identidade visual do nicho: cores, textos e estrutura do seu tipo de negócio.",
      "Páginas essenciais: apresentação, serviços, equipe, dúvidas e contato.",
      "Depois da publicação, você altera horários, serviços e textos pelo painel.",
    ],
    detalhe:
      "O site não é um cartão virtual estático. Ele apresenta o negócio, mostra o que você oferece e leva o cliente a agendar ou chamar no WhatsApp. A estrutura já vem pronta para o segmento; a IA e o sistema montam textos e organização a partir das informações que você envia.",
  },
  {
    slug: "agenda",
    icone: "agenda",
    titulo: "Agenda online",
    texto: "Seus clientes agendam horários sozinhos, 24 horas por dia.",
    resumo: "O cliente escolhe serviço, profissional e horário sem ligar e sem esperar a recepção responder.",
    pontos: [
      "Agendamento aberto o dia todo, inclusive fora do expediente.",
      "Serviços, duração e profissionais organizados na mesma agenda.",
      "Horários respeitam a grade que você definir no painel.",
      "A confirmação segue no WhatsApp do negócio.",
    ],
    detalhe:
      "A agenda online tira a fila da recepção e o vai-e-volta de mensagens só para marcar horário. O cliente vê o que está disponível, reserva e recebe a confirmação no WhatsApp. Você continua no controle: muda horários, serviços e bloqueios pelo painel, sem depender de agência.",
  },
  {
    slug: "whatsapp",
    icone: "whatsapp",
    titulo: "WhatsApp integrado",
    texto: "Confirmações e comunicação direta no número da empresa.",
    resumo: "O número do negócio recebe o cliente no canal que ele já usa, com confirmação do agendamento e conversa direta.",
    pontos: [
      "Botões de WhatsApp no site, no número da empresa.",
      "Confirmação do agendamento pelo mesmo canal.",
      "O cliente fala com quem atende de verdade, sem app novo.",
      "Menos mensagem perdida: o contato já chega contextualizado pelo site.",
    ],
    detalhe:
      "WhatsApp é onde o cliente já está. Em vez de inventar outro sistema de mensagem, o GuiX.net liga o site e a agenda ao número da empresa. Quem agenda recebe a confirmação ali; quem prefere conversar antes clica e abre o chat direto.",
  },
];

export function produtoPorSlug(slug: string) {
  return produtos.find((item) => item.slug === slug);
}
