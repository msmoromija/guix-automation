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
    titulo: "Você monta no estúdio",
    texto: "Você ajusta nome, visual, WhatsApp e serviços e já vê o site pronto do lado.",
    resumo: "No estúdio você personaliza o modelo do ofício. O preview mostra o site na hora, sem pagar ainda.",
    pontos: [
      "Nome, segmento, endereço e tom dos textos.",
      "Cores, fotos e logo (biblioteca ou arquivo).",
      "WhatsApp, horário, serviços e equipe.",
      "Preview ao vivo — no celular use “Ver o site”.",
    ],
    detalhe:
      "Você não precisa escrever o site do zero. Entra em Prototipar, ajusta o essencial e vê o resultado à direita. Ainda não há domínio publicado: isso vem depois da compra.",
  },
  {
    slug: "configuracao",
    numero: "02",
    titulo: "Salva o protótipo e gera o token",
    texto: "O botão Salvar cria o arquivo, o token e o link de teste.",
    resumo: "Salvar protótipo grava o site, cria um token único e um link /visualizar para enviar ao cliente (~3 dias).",
    pontos: [
      "Clique em “Salvar protótipo e gerar link”.",
      "Na área do cliente aparecem token, link do site e link da área.",
      "Copie ou mande no WhatsApp — sem token o rascunho não abre.",
      "Dá para reabrir depois em /visualizar colando o token.",
    ],
    detalhe:
      "Este é o “salvar” do GuiX. O protótipo não é o site no domínio: é a prova com link compartilhável. Guarde o token e os links da área do cliente.",
  },
  {
    slug: "publicacao",
    numero: "03",
    titulo: "Compra e publicamos com domínio",
    texto: "PIX, boleto ou cartão. Domínio, e-mail e site entram juntos.",
    resumo: "Na contratação você paga a estrutura. Com dados completos, em até 24 horas saem domínio, e-mail, site, agenda e WhatsApp.",
    pontos: [
      "Botão “Quero comprar e publicar” (ou /contratar).",
      "Plano Completa, Avançada ou Personalizada.",
      "Domínio próprio e e-mail profissional inclusos.",
      "Primeiro ano do domínio já entra na compra.",
    ],
    detalhe:
      "Se você já salvou um protótipo, o checkout leva o token no pedido. A publicação de verdade só começa após o pagamento e as informações completas.",
  },
  {
    slug: "controle",
    numero: "04",
    titulo: "Você assume o controle",
    texto: "Altera horários, serviços e conteúdos pelo painel.",
    resumo: "Depois da publicação o painel fica com você. No protótipo, a área do cliente já antecipa agenda e admin.",
    pontos: [
      "Horários, serviços e textos no painel.",
      "Sem depender de agência para o dia a dia.",
      "Um pagamento pela estrutura, sem mensalidade de site.",
      "Renovação anual do domínio à parte, após o primeiro ano.",
    ],
    detalhe:
      "Publicar é o começo. O painel acompanha o negócio: troca horário, inclui serviço, ajusta texto — com a estrutura já pronta.",
  },
];

export function passoPorSlug(slug: string) {
  return passos.find((item) => item.slug === slug);
}
