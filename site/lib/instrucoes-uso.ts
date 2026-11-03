/** Passo a passo oficial: montar → salvar → token/link → comprar com domínio. */

export const passosUso = [
  {
    n: "1",
    titulo: "Montar o site no estúdio",
    texto:
      "Em /prototipar, preencha os passos: negócio, aparência, marca, contato (WhatsApp, endereço, serviços). O preview à direita (ou “Ver o site” no celular) mostra tudo na hora.",
  },
  {
    n: "2",
    titulo: "Salvar o protótipo",
    texto:
      "No último passo, clique em “Salvar protótipo e gerar link”. Isso é o salvar do GuiX: grava o arquivo do site e cria um token único. Ainda não publica no domínio.",
  },
  {
    n: "3",
    titulo: "Guardar o token e o link",
    texto:
      "Na área do cliente você vê o token, o link do site (/visualizar/…) e o link da área (/conta/…). Copie ou envie no WhatsApp. Sem o token, o rascunho não abre.",
  },
  {
    n: "4",
    titulo: "Cliente vê o site de teste",
    texto:
      "O link do site vale cerca de 3 dias. Dá para abrir em /visualizar ou colar o token em “Abrir o rascunho”. Não é o site publicado — é a prova do visual e da agenda.",
  },
  {
    n: "5",
    titulo: "Comprar e publicar com domínio",
    texto:
      "Quando fechar, use “Quero comprar e publicar”. Escolha o plano, pague com PIX, boleto ou cartão. Aí entram domínio próprio, e-mail profissional e a publicação em até 24 horas com os dados completos.",
  },
] as const;

export const textoTokenFaq =
  "O token é o código do seu protótipo (aparece na área do cliente depois de Salvar). Ele abre o site de teste em /visualizar/{token} e a área em /conta/{token}?t={token}. Guarde o token e os links: sem eles ninguém acessa o rascunho nem o arquivo site.json. O teste some em cerca de 3 dias se você não contratar.";

export const textoComoGerarFaq =
  "Entre em Prototipar, preencha nome, visual, marca e contato, e no fim clique em Salvar protótipo e gerar link. O sistema monta o site, cria o token e leva você à área do cliente, onde copia o link para enviar. Não precisa pagar para gerar o teste.";

export const textoComoComprarFaq =
  "Com o protótipo pronto, abra a área do cliente ou o preview e clique em Quero comprar e publicar (ou Contratar). Escolha Presença Completa, Avançada ou Personalizada, informe os dados e pague via Asaas (PIX, boleto ou cartão em até 12x). O pagamento libera domínio no nome do negócio, e-mail profissional e a publicação — o primeiro ano do domínio já entra na compra.";
