import { checklistDadosPublicacao } from "@/lib/cliente/jornada";
import { contato, linkWhatsapp } from "@/lib/contato";
import { formatarReais } from "@/lib/dinheiro";
import { marca } from "@/lib/marca";
import { siteBase, type PedidoCompra } from "@/lib/pedidos/compra";
import type { JobAprovado } from "@/lib/prototipos/ops";

export type ResultadoEmail = {
  ok: boolean;
  motivo?: string;
  para: string[];
  assunto?: string;
};

type Anexo = { filename: string; content: string };

function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailValido(raw: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim().toLowerCase());
}

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] || "olá";
}

function rotuloForma(forma: string, parcelas: number) {
  if (forma === "PIX") return "PIX";
  if (forma === "BOLETO") return "Boleto";
  if (forma === "CREDIT_CARD") return parcelas > 1 ? `Cartão em ${parcelas}x` : "Cartão";
  return forma;
}

function linkPagamento(pedido: PedidoCompra) {
  return pedido.asaas?.invoiceUrl || pedido.asaas?.bankSlipUrl || "";
}

/** Remetente + envio Resend compartilhado pelos e-mails institucionais GuiX. */
export async function enviarResend(opts: {
  para: string[];
  assunto: string;
  texto: string;
  html: string;
  anexos?: Anexo[];
}): Promise<ResultadoEmail> {
  const key = process.env.RESEND_API_KEY?.trim() || "";
  const para = opts.para.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!key) return { ok: false, motivo: "RESEND_API_KEY ausente", para };
  if (!para.length) return { ok: false, motivo: "Sem destinatários", para };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "GuiX.net <noreply@guix.net.br>",
        to: para,
        subject: opts.assunto,
        text: opts.texto,
        html: opts.html,
        ...(opts.anexos?.length ? { attachments: opts.anexos } : {}),
      }),
    });
    if (!res.ok) return { ok: false, motivo: (await res.text()).slice(0, 220), para, assunto: opts.assunto };
    return { ok: true, para, assunto: opts.assunto };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "Falha e-mail", para, assunto: opts.assunto };
  }
}

function layout(opts: {
  eyebrow: string;
  titulo: string;
  corpoHtml: string;
  rodapeExtra?: string;
}) {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#0f172a;max-width:560px;margin:0 auto">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#ea580c;font-weight:600">${escapar(opts.eyebrow)}</p>
      <h1 style="margin:0 0 16px;font-size:22px;letter-spacing:-0.03em">${escapar(opts.titulo)}</h1>
      ${opts.corpoHtml}
      <p style="margin:22px 0 0;font-size:14px">Com carinho,<br/><strong>Equipe ${escapar(marca.nome)}</strong></p>
      <p style="margin:10px 0 0;font-size:12px;color:#94a3b8">${escapar(siteBase())}${opts.rodapeExtra ? ` · ${opts.rodapeExtra}` : ""}</p>
    </div>
  `.trim();
}

function blocoContato(wa: string) {
  return `
    <p style="margin:0 0 6px;font-size:14px;color:#475569">
      Dúvidas: WhatsApp <a href="${escapar(wa)}" style="color:#ea580c">${escapar(contato.whatsappExibicao)}</a>
      · <a href="mailto:${escapar(contato.email)}" style="color:#ea580c">${escapar(contato.email)}</a>
    </p>
  `;
}

function cta(href: string, label: string) {
  if (!href) return "";
  return `
    <p style="margin:0 0 18px">
      <a href="${escapar(href)}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:999px">${escapar(label)}</a>
    </p>
  `;
}

function resumoPedidoHtml(pedido: PedidoCompra) {
  return `
    <div style="border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:0 0 18px;background:#f8fafc">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#64748b">Resumo</p>
      <p style="margin:0 0 6px"><strong>Plano:</strong> ${escapar(pedido.planoNome)}</p>
      <p style="margin:0 0 6px"><strong>Nicho:</strong> ${escapar(pedido.nichoNome)}</p>
      <p style="margin:0 0 6px"><strong>Valor:</strong> ${escapar(formatarReais(pedido.centavos))}${
        pedido.cupomCodigo ? ` · cupom ${escapar(pedido.cupomCodigo)}` : ""
      }</p>
      <p style="margin:0 0 6px"><strong>Forma:</strong> ${escapar(rotuloForma(pedido.forma, pedido.parcelas))}</p>
      <p style="margin:0"><strong>Pedido:</strong> ${escapar(pedido.id)}</p>
    </div>
  `;
}

function resumoPedidoTexto(pedido: PedidoCompra) {
  return [
    `Resumo`,
    `· Plano: ${pedido.planoNome}`,
    `· Negócio / nicho: ${pedido.nichoNome}`,
    `· Valor: ${formatarReais(pedido.centavos)}${pedido.cupomCodigo ? ` (cupom ${pedido.cupomCodigo})` : ""}`,
    `· Forma: ${rotuloForma(pedido.forma, pedido.parcelas)}`,
    `· Pedido: ${pedido.id}`,
  ].join("\n");
}

function rodapeTexto(wa: string) {
  return [
    `WhatsApp: ${contato.whatsappExibicao} — ${wa}`,
    `E-mail: ${contato.email}`,
    ``,
    `Se precisar de qualquer ajuste, é só responder este e-mail ou chamar no WhatsApp.`,
    ``,
    `Com carinho,`,
    `Equipe ${marca.nome}`,
    siteBase(),
  ].join("\n");
}

async function enviarParaCliente(email: string, assunto: string, texto: string, html: string) {
  const para = email.trim().toLowerCase();
  if (!emailValido(para)) {
    return { ok: false as const, motivo: "E-mail do cliente inválido", para: [] as string[], assunto };
  }
  return enviarResend({ para: [para], assunto, texto, html });
}

/* ── Cobrança gerada (aguardando pagamento) ── */

export function montarEmailCobrancaCriada(pedido: PedidoCompra) {
  const nome = primeiroNome(pedido.cliente.nome);
  const pagar = linkPagamento(pedido);
  const wa = linkWhatsapp(
    `Olá, gerei a cobrança ${pedido.id} do ${pedido.planoNome} e preciso de ajuda para concluir o pagamento.`,
  );
  const forma = rotuloForma(pedido.forma, pedido.parcelas);

  const texto = [
    `Olá, ${nome}.`,
    ``,
    `Recebemos o seu pedido do ${pedido.planoNome} no ${marca.nome}. Falta só concluir o pagamento para liberarmos a publicação.`,
    ``,
    resumoPedidoTexto(pedido),
    ``,
    pagar ? `Pagar agora (${forma}): ${pagar}` : `Abra o link de pagamento que aparece na tela de contratação.`,
    pedido.asaas?.bankSlipUrl && pedido.asaas.bankSlipUrl !== pagar
      ? `Boleto: ${pedido.asaas.bankSlipUrl}`
      : "",
    ``,
    `O prazo de publicação (até 24 horas) começa depois do pagamento e da confirmação de todos os dados do negócio.`,
    ``,
    rodapeTexto(wa),
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Pedido recebido — aguardando pagamento",
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        Recebemos o seu pedido do <strong>${escapar(pedido.planoNome)}</strong>.
        Falta só concluir o pagamento para liberarmos a publicação do <strong>${escapar(pedido.nichoNome)}</strong>.
      </p>
      ${resumoPedidoHtml(pedido)}
      ${cta(pagar, forma === "PIX" ? "Abrir PIX / fatura" : forma.startsWith("Boleto") ? "Abrir boleto" : "Concluir pagamento")}
      <p style="margin:0 0 18px;color:#475569;font-size:14px">
        O prazo de publicação (até 24 horas) começa depois do pagamento e da confirmação de todos os dados do negócio.
      </p>
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Pedido recebido — conclua o pagamento · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClienteCobrancaCriada(pedido: PedidoCompra) {
  const { assunto, texto, html } = montarEmailCobrancaCriada(pedido);
  return enviarParaCliente(pedido.cliente.email, assunto, texto, html);
}

/* ── Pagamento confirmado ── */

export function montarEmailPagamentoConfirmado(pedido: PedidoCompra) {
  const nome = primeiroNome(pedido.cliente.nome);
  const contaUrl =
    pedido.links?.conta ||
    (pedido.previewId ? `${siteBase()}/conta/${pedido.previewId}` : `${siteBase()}/contratar/retorno?cobranca=${pedido.id}`);
  const wa = linkWhatsapp(
    `Olá, meu pagamento do ${pedido.planoNome} foi confirmado (cobrança ${pedido.id}). Quero alinhar os dados para a publicação.`,
  );

  const texto = [
    `Olá, ${nome}.`,
    ``,
    `Recebemos e confirmamos o pagamento do seu ${pedido.planoNome} no ${marca.nome}. Obrigado pela confiança — é um prazer ter o ${pedido.nichoNome} conosco.`,
    ``,
    resumoPedidoTexto(pedido),
    ``,
    `Prazo de publicação`,
    `Com todos os dados do negócio confirmados, domínio, e-mail profissional, site, agenda e WhatsApp entram no ar em até 24 horas.`,
    `O prazo só começa quando esses dados forem confirmados pela nossa equipe.`,
    ``,
    `Para acelerar, confira na área do cliente:`,
    ...checklistDadosPublicacao().map((i) => `· ${i.titulo}`),
    ``,
    `Próximos passos`,
    `1. Abra a área do cliente e confira o checklist.`,
    `2. Envie o que faltar pelo WhatsApp ou respondendo este e-mail.`,
    `3. Você recebe o acesso quando o site estiver no ar.`,
    ``,
    `Área do cliente: ${contaUrl}`,
    ``,
    rodapeTexto(wa),
  ].join("\n");

  const checklistHtml = checklistDadosPublicacao()
    .map((i) => `<li style="margin-bottom:4px">${escapar(i.titulo)}</li>`)
    .join("");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Pagamento confirmado",
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        Recebemos e confirmamos o pagamento do seu <strong>${escapar(pedido.planoNome)}</strong>.
        Obrigado pela confiança — é um prazer ter o <strong>${escapar(pedido.nichoNome)}</strong> conosco.
      </p>
      ${resumoPedidoHtml(pedido)}
      <h2 style="margin:0 0 8px;font-size:16px">Prazo de publicação</h2>
      <p style="margin:0 0 10px">
        Com <strong>todos os dados confirmados</strong>, domínio, e-mail profissional, site, agenda e WhatsApp
        entram no ar em <strong>até 24 horas</strong>.
      </p>
      <p style="margin:0 0 12px;color:#475569;font-size:14px">
        O prazo só começa quando esses dados forem confirmados pela nossa equipe. Acelere conferindo:
      </p>
      <ul style="margin:0 0 18px;padding-left:18px;color:#334155;font-size:14px">${checklistHtml}</ul>
      <h2 style="margin:0 0 8px;font-size:16px">Próximos passos</h2>
      <ol style="margin:0 0 18px;padding-left:18px;color:#334155">
        <li style="margin-bottom:6px">Abra a área do cliente e confira o acompanhamento.</li>
        <li style="margin-bottom:6px">Envie o que faltar pelo WhatsApp ou respondendo este e-mail.</li>
        <li>Você recebe o acesso quando o site estiver no ar.</li>
      </ol>
      ${cta(contaUrl, "Abrir área do cliente")}
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Pagamento confirmado — ${pedido.planoNome} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClientePagamentoConfirmado(pedido: PedidoCompra) {
  const { assunto, texto, html } = montarEmailPagamentoConfirmado(pedido);
  return enviarParaCliente(pedido.cliente.email, assunto, texto, html);
}

/* ── Pagamento em atraso ── */

export function montarEmailPagamentoEmAtraso(pedido: PedidoCompra) {
  const nome = primeiroNome(pedido.cliente.nome);
  const pagar = linkPagamento(pedido);
  const wa = linkWhatsapp(
    `Olá, minha cobrança ${pedido.id} do ${pedido.planoNome} está em atraso. Quero regularizar o pagamento.`,
  );

  const texto = [
    `Olá, ${nome}.`,
    ``,
    `Ainda não identificamos o pagamento do seu ${pedido.planoNome} (${pedido.id}).`,
    `Se já pagou, pode desconsiderar — a compensação às vezes leva algumas horas.`,
    ``,
    resumoPedidoTexto(pedido),
    ``,
    pagar ? `Regularizar agora: ${pagar}` : `Use o link de pagamento da tela de contratação ou fale conosco.`,
    ``,
    `Assim que o pagamento for confirmado, seguimos com a publicação em até 24 horas após a confirmação dos dados.`,
    ``,
    rodapeTexto(wa),
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Pagamento pendente",
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        Ainda não identificamos o pagamento do seu <strong>${escapar(pedido.planoNome)}</strong>.
        Se já pagou, pode desconsiderar — a compensação às vezes leva algumas horas.
      </p>
      ${resumoPedidoHtml(pedido)}
      ${cta(pagar, "Regularizar pagamento")}
      <p style="margin:0 0 18px;color:#475569;font-size:14px">
        Assim que o pagamento for confirmado, seguimos com a publicação em até 24 horas após a confirmação dos dados.
      </p>
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Pagamento pendente — ${pedido.planoNome} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClientePagamentoEmAtraso(pedido: PedidoCompra) {
  const { assunto, texto, html } = montarEmailPagamentoEmAtraso(pedido);
  return enviarParaCliente(pedido.cliente.email, assunto, texto, html);
}

/* ── Cobrança cancelada / estornada ── */

export function montarEmailPagamentoCancelado(pedido: PedidoCompra, motivo: "cancelado" | "estornado" = "cancelado") {
  const nome = primeiroNome(pedido.cliente.nome);
  const wa = linkWhatsapp(
    `Olá, sobre a cobrança ${pedido.id} do ${pedido.planoNome} (${motivo}). Quero entender os próximos passos.`,
  );
  const titulo = motivo === "estornado" ? "Pagamento estornado" : "Cobrança cancelada";
  const frase =
    motivo === "estornado"
      ? `O pagamento do seu ${pedido.planoNome} foi estornado.`
      : `A cobrança do seu ${pedido.planoNome} foi cancelada.`;

  const texto = [
    `Olá, ${nome}.`,
    ``,
    frase,
    `Se isso não era o esperado, fale conosco que reabrimos o pedido ou geramos uma nova cobrança.`,
    ``,
    resumoPedidoTexto(pedido),
    ``,
    `Contratar novamente: ${siteBase()}/contratar`,
    ``,
    rodapeTexto(wa),
  ].join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo,
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        ${escapar(frase)}
        Se isso não era o esperado, fale conosco que reabrimos o pedido ou geramos uma nova cobrança.
      </p>
      ${resumoPedidoHtml(pedido)}
      ${cta(`${siteBase()}/contratar`, "Abrir contratação")}
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `${titulo} — ${pedido.planoNome} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClientePagamentoCancelado(
  pedido: PedidoCompra,
  motivo: "cancelado" | "estornado" = "cancelado",
) {
  const { assunto, texto, html } = montarEmailPagamentoCancelado(pedido, motivo);
  return enviarParaCliente(pedido.cliente.email, assunto, texto, html);
}

/* ── Protótipo aprovado ── */

export function montarEmailPrototipoAprovado(opts: {
  nomeNegocio: string;
  token: string;
  contaUrl: string;
  visualizarUrl: string;
  contratarUrl: string;
  extratoUrl?: string;
  emailCliente?: string;
}) {
  const nome = opts.nomeNegocio.trim() || "seu negócio";
  const wa = linkWhatsapp(
    `Olá, meu protótipo de ${nome} foi aprovado (token ${opts.token}). Quero seguir para a contratação.`,
  );

  const texto = [
    `Olá.`,
    ``,
    `O protótipo do ${nome} foi aprovado no ${marca.nome}. Guardamos o acesso na sua área do cliente.`,
    ``,
    `Token de acesso: ${opts.token}`,
    ``,
    `Área do cliente: ${opts.contaUrl}`,
    `Ver o site de teste: ${opts.visualizarUrl}`,
    opts.extratoUrl ? `Extrato / PDF: ${opts.extratoUrl}` : "",
    `Contratar e publicar: ${opts.contratarUrl}`,
    ``,
    `Na contratação entram domínio no nome do negócio, e-mail profissional, site, agenda e WhatsApp — publicados em até 24 horas após a confirmação de todos os dados.`,
    ``,
    `Guarde este e-mail: o token abre a área do cliente e o preview.`,
    ``,
    rodapeTexto(wa),
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Protótipo aprovado",
    corpoHtml: `
      <p style="margin:0 0 14px">
        O protótipo do <strong>${escapar(nome)}</strong> foi aprovado.
        Guardamos o acesso na sua área do cliente.
      </p>
      <div style="border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:0 0 18px;background:#f8fafc">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#64748b">Acesso</p>
        <p style="margin:0 0 6px"><strong>Token:</strong> <code style="font-size:14px">${escapar(opts.token)}</code></p>
        <p style="margin:0;color:#64748b;font-size:13px">Guarde este código — ele abre a área do cliente e o preview.</p>
      </div>
      ${cta(opts.contaUrl, "Abrir área do cliente")}
      <p style="margin:0 0 18px;font-size:14px">
        <a href="${escapar(opts.visualizarUrl)}" style="color:#ea580c">Ver site de teste</a>
        · <a href="${escapar(opts.contratarUrl)}" style="color:#ea580c">Contratar e publicar</a>
        ${opts.extratoUrl ? ` · <a href="${escapar(opts.extratoUrl)}" style="color:#ea580c">Extrato</a>` : ""}
      </p>
      <p style="margin:0 0 18px;color:#475569;font-size:14px">
        Na contratação entram domínio, e-mail profissional, site, agenda e WhatsApp — no ar em até 24 horas após a confirmação de todos os dados.
      </p>
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Protótipo aprovado — ${nome} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClientePrototipoAprovado(opts: {
  email: string;
  nomeNegocio: string;
  token: string;
  contaUrl: string;
  visualizarUrl: string;
  contratarUrl: string;
  extratoUrl?: string;
}) {
  const { assunto, texto, html } = montarEmailPrototipoAprovado(opts);
  return enviarParaCliente(opts.email, assunto, texto, html);
}

/* ── Fila de publicação (curto, 1× após pagamento) ── */

export function montarEmailFilaPublicacao(opts: {
  nomeCliente?: string;
  nomeNegocio: string;
  contaUrl: string;
}) {
  const nome = primeiroNome(opts.nomeCliente || opts.nomeNegocio);
  const negocio = opts.nomeNegocio.trim() || "seu negócio";
  const wa = linkWhatsapp(
    `Olá, meu pagamento do ${negocio} entrou. Quero confirmar os dados para a publicação.`,
  );
  const itens = checklistDadosPublicacao();

  const texto = [
    `Olá, ${nome}.`,
    ``,
    `Seu ${negocio} entrou na fila de publicação do ${marca.nome}.`,
    `A equipe já foi avisada. Em até 24 horas após a confirmação dos dados, domínio, e-mail, site, agenda e WhatsApp entram no ar.`,
    ``,
    `Para não atrasar, confira ou envie:`,
    ...itens.map((i) => `· ${i.titulo}`),
    ``,
    `Acompanhe tudo aqui: ${opts.contaUrl}`,
    ``,
    rodapeTexto(wa),
  ].join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Você está na fila de publicação",
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        Seu <strong>${escapar(negocio)}</strong> entrou na fila de publicação. A equipe já foi avisada.
      </p>
      <p style="margin:0 0 14px">
        Em <strong>até 24 horas</strong> após a confirmação dos dados, domínio, e-mail profissional, site, agenda e WhatsApp entram no ar.
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#475569">Para não atrasar, confira ou envie:</p>
      <ul style="margin:0 0 18px;padding-left:18px;color:#334155;font-size:14px">
        ${itens.map((i) => `<li style="margin-bottom:4px">${escapar(i.titulo)}</li>`).join("")}
      </ul>
      ${cta(opts.contaUrl, "Acompanhar na área do cliente")}
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Na fila de publicação — ${negocio} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClienteFilaPublicacao(job: JobAprovado) {
  const email = (job.contatoCliente?.email || job.email || "").trim();
  const { assunto, texto, html } = montarEmailFilaPublicacao({
    nomeNegocio: job.nome,
    contaUrl: job.contaUrl,
  });
  return enviarParaCliente(email, assunto, texto, html);
}

/* ── Em integração (equipe configurando) ── */

export function montarEmailEmIntegracao(opts: {
  nomeCliente?: string;
  nomeNegocio: string;
  contaUrl: string;
}) {
  const nome = primeiroNome(opts.nomeCliente || opts.nomeNegocio);
  const negocio = opts.nomeNegocio.trim() || "seu negócio";
  const wa = linkWhatsapp(
    `Olá, vi que a integração do ${negocio} está em andamento. Posso enviar ou confirmar algum dado?`,
  );

  const texto = [
    `Olá, ${nome}.`,
    ``,
    `Boa notícia: a equipe ${marca.nome} já está configurando o ${negocio}.`,
    ``,
    `Neste momento cuidamos de domínio, e-mail profissional, site, agenda e WhatsApp.`,
    `Se faltar algum dado (horários, serviços, endereço, fotos ou preferências), respondemos este e-mail ou falamos no WhatsApp — o prazo de 24 horas conta a partir da confirmação de tudo.`,
    ``,
    `Área do cliente: ${opts.contaUrl}`,
    ``,
    rodapeTexto(wa),
  ].join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Estamos configurando o seu site",
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        Boa notícia: a equipe já está configurando o <strong>${escapar(negocio)}</strong>.
      </p>
      <p style="margin:0 0 14px">
        Neste momento cuidamos de domínio, e-mail profissional, site, agenda e WhatsApp.
      </p>
      <p style="margin:0 0 18px;color:#475569;font-size:14px">
        Se faltar algum dado (horários, serviços, endereço, fotos ou preferências), responda este e-mail ou fale no WhatsApp —
        o prazo de 24 horas conta a partir da confirmação de tudo.
      </p>
      ${cta(opts.contaUrl, "Abrir área do cliente")}
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Configuração em andamento — ${negocio} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClienteEmIntegracao(job: JobAprovado) {
  const email = (job.contatoCliente?.email || job.email || "").trim();
  const { assunto, texto, html } = montarEmailEmIntegracao({
    nomeNegocio: job.nome,
    contaUrl: job.contaUrl,
  });
  return enviarParaCliente(email, assunto, texto, html);
}

/* ── Site publicado ── */

export function montarEmailSitePublicado(opts: {
  nomeCliente?: string;
  nomeNegocio: string;
  contaUrl: string;
  visualizarUrl?: string;
  dominioUrl?: string;
}) {
  const nome = primeiroNome(opts.nomeCliente || opts.nomeNegocio);
  const negocio = opts.nomeNegocio.trim() || "seu negócio";
  const siteUrl = opts.dominioUrl || opts.visualizarUrl || opts.contaUrl;
  const wa = linkWhatsapp(
    `Olá, o site do ${negocio} foi publicado. Quero alinhar um ajuste ou o acesso ao painel.`,
  );

  const texto = [
    `Olá, ${nome}.`,
    ``,
    `O ${negocio} está no ar com o ${marca.nome}. Obrigado pela parceria.`,
    ``,
    `O que já está ativo`,
    `· Site publicado`,
    `· Domínio e e-mail profissional (conforme o plano)`,
    `· Agenda online e WhatsApp integrados`,
    ``,
    siteUrl ? `Acessar: ${siteUrl}` : "",
    `Área do cliente / painel: ${opts.contaUrl}`,
    ``,
    `Nos primeiros dias, revise textos, horários e fotos. Qualquer ajuste fino, é só chamar.`,
    ``,
    rodapeTexto(wa),
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = layout({
    eyebrow: marca.nome,
    titulo: "Seu site está no ar",
    corpoHtml: `
      <p style="margin:0 0 14px">Olá, <strong>${escapar(nome)}</strong>.</p>
      <p style="margin:0 0 14px">
        O <strong>${escapar(negocio)}</strong> está no ar. Obrigado pela parceria.
      </p>
      <div style="border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:0 0 18px;background:#f8fafc">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#64748b">No ar</p>
        <p style="margin:0 0 6px">Site publicado</p>
        <p style="margin:0 0 6px">Domínio e e-mail profissional (conforme o plano)</p>
        <p style="margin:0">Agenda online e WhatsApp integrados</p>
      </div>
      ${cta(siteUrl, "Abrir o site")}
      <p style="margin:0 0 18px;font-size:14px">
        <a href="${escapar(opts.contaUrl)}" style="color:#ea580c">Área do cliente / painel</a>
      </p>
      <p style="margin:0 0 18px;color:#475569;font-size:14px">
        Nos primeiros dias, revise textos, horários e fotos. Qualquer ajuste fino, é só chamar.
      </p>
      ${blocoContato(wa)}
    `,
  });

  return {
    assunto: `Site no ar — ${negocio} · ${marca.nome}`,
    texto,
    html,
  };
}

export async function avisarClienteSitePublicado(job: JobAprovado) {
  const email = (job.contatoCliente?.email || job.email || "").trim();
  const { assunto, texto, html } = montarEmailSitePublicado({
    nomeNegocio: job.nome,
    contaUrl: job.contaUrl,
    visualizarUrl: job.visualizarUrl,
  });
  return enviarParaCliente(email, assunto, texto, html);
}
