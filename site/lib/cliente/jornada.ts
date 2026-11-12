import { linkWhatsapp } from "@/lib/contato";

/** Status internos do pacote / job → rótulo amigável. */
export function rotuloStatusCliente(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "rascunho") return "Rascunho (teste)";
  if (s === "aprovado") return "Aprovado — falta contratar";
  if (s === "pago") return "Pago — na fila de publicação";
  if (s === "em_integracao") return "Publicação em andamento";
  if (s === "publicado") return "No ar";
  if (s === "aguardando") return "Aguardando pagamento";
  if (s === "cancelado") return "Cancelado";
  return status || "Em andamento";
}

export function fasePosVenda(status: string): "pre" | "pago" | "integracao" | "publicado" {
  const s = (status || "").toLowerCase();
  if (s === "publicado") return "publicado";
  if (s === "em_integracao") return "integracao";
  if (s === "pago") return "pago";
  return "pre";
}

export function ehPosPagamento(status: string) {
  const f = fasePosVenda(status);
  return f === "pago" || f === "integracao" || f === "publicado";
}

export type ItemChecklistDados = {
  id: string;
  titulo: string;
  detalhe: string;
};

/** O que o cliente precisa confirmar para o prazo de 24h começar de verdade. */
export function checklistDadosPublicacao(): ItemChecklistDados[] {
  return [
    {
      id: "negocio",
      titulo: "Nome e contatos do negócio",
      detalhe: "Razão social ou nome fantasia, WhatsApp e e-mail que vão no site.",
    },
    {
      id: "endereco",
      titulo: "Endereço e horários",
      detalhe: "Rua, bairro, cidade e expediente (dias e pausas).",
    },
    {
      id: "servicos",
      titulo: "Serviços e preços",
      detalhe: "Lista do que você oferece, duração e valores (ou “sob consulta”).",
    },
    {
      id: "dominio",
      titulo: "Domínio desejado",
      detalhe: "Ex.: seunegocio.com.br — ou diga se prefere que indiquemos opções.",
    },
    {
      id: "email",
      titulo: "E-mail profissional",
      detalhe: "Ex.: contato@seunegocio.com.br — quem deve receber as mensagens.",
    },
    {
      id: "visual",
      titulo: "Logo e fotos finais",
      detalhe: "Confirme se o visual do protótipo está ok ou envie arquivos melhores.",
    },
  ];
}

export type PassoTimeline = {
  id: string;
  titulo: string;
  detalhe: string;
  estado: "feito" | "atual" | "proximo";
};

export function timelinePublicacao(status: string): PassoTimeline[] {
  const fase = fasePosVenda(status);
  const ordem = ["pago", "dados", "publicando", "ar"] as const;
  let atualIdx = 0;
  if (fase === "pago") atualIdx = 1;
  if (fase === "integracao") atualIdx = 2;
  if (fase === "publicado") atualIdx = 3;

  const base: Omit<PassoTimeline, "estado">[] = [
    {
      id: "pago",
      titulo: "Pagamento confirmado",
      detalhe: "Recebemos sua contratação.",
    },
    {
      id: "dados",
      titulo: "Confirmar dados do negócio",
      detalhe: "Domínio, e-mail, horários e contatos — o prazo de 24h começa aqui.",
    },
    {
      id: "publicando",
      titulo: "Publicação pela equipe",
      detalhe: "Domínio, e-mail profissional, site, agenda e WhatsApp.",
    },
    {
      id: "ar",
      titulo: "Site no ar",
      detalhe: "Você recebe o acesso ao painel e o endereço definitivo.",
    },
  ];

  return base.map((p, i) => ({
    ...p,
    estado: i < atualIdx ? "feito" : i === atualIdx ? "atual" : "proximo",
  }));
}

export function mensagemWaDadosPendentes(opts: { nomeNegocio: string; token?: string }) {
  const linhas = [
    `Olá, paguei o GuiX.net (${opts.nomeNegocio}).`,
    opts.token ? `Token: ${opts.token}` : "",
    ``,
    `Quero confirmar os dados para a publicação (domínio, e-mail, horários e contatos).`,
  ].filter(Boolean);
  return linkWhatsapp(linhas.join("\n"));
}
