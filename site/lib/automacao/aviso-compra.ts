import { formatarReais } from "@/lib/dinheiro";
import {
  destinatariosOps,
  lerPedido,
  marcarPedidoPago,
  siteBase,
  type PedidoCompra,
} from "@/lib/pedidos/compra";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";

export type EventoAvisoCompra = "cobranca_criada" | "pagamento_confirmado";

type Anexo = { filename: string; content: string };

async function enviarResend(opts: {
  assunto: string;
  texto: string;
  html: string;
  anexos?: Anexo[];
}) {
  const key = process.env.RESEND_API_KEY?.trim() || "";
  const para = destinatariosOps();
  if (!key) return { ok: false as const, motivo: "RESEND_API_KEY ausente", para };
  if (!para.length) return { ok: false as const, motivo: "Sem destinatários ops", para };
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
    if (!res.ok) return { ok: false as const, motivo: (await res.text()).slice(0, 220), para };
    return { ok: true as const, para };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha e-mail", para };
  }
}

function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function montarCorpo(pedido: PedidoCompra, evento: EventoAvisoCompra, extras: string[] = []) {
  const titulo =
    evento === "pagamento_confirmado"
      ? "PAGAMENTO CONFIRMADO — iniciar atendimento"
      : "NOVA COBRANÇA GERADA — aguardando pagamento";
  const linhas = [
    titulo,
    ``,
    `Cobrança Asaas: ${pedido.id}`,
    `Status interno: ${pedido.status}`,
    `Criado em: ${pedido.criadoEm}`,
    pedido.pagoEm ? `Pago em: ${pedido.pagoEm}` : "",
    ``,
    `— Pedido —`,
    `Plano: ${pedido.planoNome} (${pedido.plano})`,
    `Nicho: ${pedido.nichoNome} (${pedido.nichoId})`,
    `Configuração: ${pedido.configuracao === "equipe" ? "Pela equipe (+ taxa)" : "Com IA"}`,
    `Valor: ${formatarReais(pedido.centavos)}`,
    pedido.descontoCentavos
      ? `Cupom: ${pedido.cupomCodigo || "—"} (−${formatarReais(pedido.descontoCentavos)}; subtotal ${formatarReais(pedido.subtotalCentavos || pedido.centavos + pedido.descontoCentavos)})`
      : "",
    `Forma: ${pedido.forma}${pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ""}`,
    `Descrição Asaas: ${pedido.descricao}`,
    ``,
    `— Cliente —`,
    `Nome: ${pedido.cliente.nome}`,
    `E-mail: ${pedido.cliente.email}`,
    `WhatsApp: ${pedido.cliente.telefone}`,
    `CPF/CNPJ: ${pedido.cliente.documento}`,
    ``,
    `— Protótipo —`,
    pedido.temPrototipo
      ? `SIM — token ${pedido.previewId}`
      : `NÃO — cliente comprou sem protótipo montado. Montar site do zero com os dados do pedido.`,
    pedido.links?.visualizar ? `Ver: ${pedido.links.visualizar}` : "",
    pedido.links?.pacoteZip ? `Pacote ZIP (json+imagens+logo): ${pedido.links.pacoteZip}` : "",
    pedido.links?.completo ? `JSON completo: ${pedido.links.completo}` : "",
    pedido.links?.download ? `site.json (schema): ${pedido.links.download}` : "",
    pedido.links?.conta ? `Área do cliente: ${pedido.links.conta}` : "",
    pedido.asaas?.invoiceUrl ? `Fatura Asaas: ${pedido.asaas.invoiceUrl}` : "",
    pedido.asaas?.bankSlipUrl ? `Boleto: ${pedido.asaas.bankSlipUrl}` : "",
    ``,
    `— Próximos passos —`,
    pedido.temPrototipo
      ? `1. Baixar o ZIP do pacote (site + visual + assets) e publicar no domínio`
      : `1. Coletar fotos, textos e preferências (não há protótipo)`,
    `2. Domínio + e-mail profissional`,
    `3. Publicar e marcar no painel`,
    `Painel: ${siteBase()}/painel/aprovacoes`,
    ``,
    ...extras,
  ].filter((l) => l !== undefined) as string[];

  const texto = linhas.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">${escapar(titulo)}</h2>
      <p><strong>Cobrança:</strong> ${escapar(pedido.id)} · <strong>Status:</strong> ${escapar(pedido.status)}</p>
      <h3>Pedido</h3>
      <ul>
        <li><strong>Plano:</strong> ${escapar(pedido.planoNome)} (${escapar(pedido.plano)})</li>
        <li><strong>Nicho:</strong> ${escapar(pedido.nichoNome)}</li>
        <li><strong>Configuração:</strong> ${pedido.configuracao === "equipe" ? "Pela equipe" : "Com IA"}</li>
        <li><strong>Valor:</strong> ${escapar(formatarReais(pedido.centavos))}</li>
        ${
          pedido.descontoCentavos
            ? `<li><strong>Cupom:</strong> ${escapar(pedido.cupomCodigo || "")} (−${escapar(formatarReais(pedido.descontoCentavos))})</li>`
            : ""
        }
        <li><strong>Forma:</strong> ${escapar(pedido.forma)}${pedido.parcelas > 1 ? ` · ${pedido.parcelas}x` : ""}</li>
      </ul>
      <h3>Cliente</h3>
      <ul>
        <li>${escapar(pedido.cliente.nome)}</li>
        <li>${escapar(pedido.cliente.email)}</li>
        <li>WhatsApp ${escapar(pedido.cliente.telefone)}</li>
        <li>CPF/CNPJ ${escapar(pedido.cliente.documento)}</li>
      </ul>
      <h3>Protótipo</h3>
      <p>${
        pedido.temPrototipo
          ? `Sim — código <code>${escapar(pedido.previewId || "")}</code>.${
              pedido.links?.pacoteZip
                ? ` <a href="${escapar(pedido.links.pacoteZip)}">Baixar pacote ZIP</a>`
                : ""
            }${
              pedido.links?.completo
                ? ` · <a href="${escapar(pedido.links.completo)}">JSON completo</a>`
                : ""
            }`
          : "Não montado — atender montando o site com os dados da compra."
      }</p>
      ${
        pedido.links?.visualizar
          ? `<p><a href="${escapar(pedido.links.visualizar)}">Abrir preview</a> · <a href="${escapar(pedido.links.conta || "#")}">Área do cliente</a></p>`
          : ""
      }
      <p style="color:#64748b;font-size:13px">Registro em R2: pedidos/${escapar(pedido.id)}.json</p>
    </div>
  `.trim();

  return { texto, html };
}

async function anexosDoPrototipo(pedido: PedidoCompra): Promise<Anexo[]> {
  const anexos: Anexo[] = [
    {
      filename: `pedido-${pedido.id}.json`,
      content: Buffer.from(JSON.stringify(pedido, null, 2), "utf8").toString("base64"),
    },
  ];
  if (!pedido.temPrototipo || !pedido.previewId) return anexos;
  const token = sanitizarToken(pedido.previewToken || pedido.previewId);
  try {
    const pacote = await lerPacote(token);
    if (!pacote?.site) return anexos;

    const json = JSON.stringify(
      {
        token: pacote.token,
        nicho: pacote.nicho,
        nome: pacote.nome,
        cidade: pacote.cidade,
        whatsapp: pacote.whatsapp,
        email: pacote.email,
        visual: pacote.visual,
        slogan: pacote.slogan,
        site: pacote.site,
        pacoteZipUrl: pedido.links?.pacoteZip || "",
      },
      null,
      2,
    );
    anexos.push({
      filename: `guix-${token}-completo.json`,
      content: Buffer.from(json, "utf8").toString("base64"),
    });

    try {
      const { montarPacoteZip } = await import("@/lib/prototipos/pacote-zip");
      const { buffer } = await montarPacoteZip(pacote);
      // Resend ~40MB; deixa folga e só anexa ZIP leve/médio
      if (buffer.length < 12_000_000) {
        anexos.push({
          filename: `guix-${token}-pacote.zip`,
          content: buffer.toString("base64"),
        });
      }
    } catch (e) {
      console.error("anexo zip", e);
    }
  } catch {
    /* só o pedido */
  }
  return anexos;
}

/** Avisa a equipe GuiX sobre cobrança nova ou pagamento confirmado. */
export async function avisarCompra(opts: {
  pedido: PedidoCompra;
  evento: EventoAvisoCompra;
  extras?: string[];
}) {
  const { texto, html } = montarCorpo(opts.pedido, opts.evento, opts.extras);
  const anexos =
    opts.evento === "pagamento_confirmado"
      ? await anexosDoPrototipo(opts.pedido)
      : [
          {
            filename: `pedido-${opts.pedido.id}.json`,
            content: Buffer.from(JSON.stringify(opts.pedido, null, 2), "utf8").toString("base64"),
          },
        ];
  const prefixo = opts.evento === "pagamento_confirmado" ? "[Pago]" : "[Cobrança]";
  const assunto = `${prefixo} ${opts.pedido.planoNome} — ${opts.pedido.cliente.nome} (${opts.pedido.nichoNome})`;
  const mail = await enviarResend({ assunto, texto, html, anexos });
  return { ...mail, assunto };
}

/** No webhook: marca pedido pago (grava no R2) e dispara e-mail de rastreio. */
export async function avisarPagamentoConfirmado(cobrancaId: string, fallback?: PedidoCompra | null) {
  const { gravarPedido } = await import("@/lib/pedidos/compra");
  let atualizado = await marcarPedidoPago(cobrancaId);
  if (!atualizado && fallback) {
    atualizado = {
      ...fallback,
      id: cobrancaId,
      status: "pago",
      pagoEm: fallback.pagoEm || new Date().toISOString(),
    };
    await gravarPedido(atualizado);
  }
  if (!atualizado) {
    atualizado = await lerPedido(cobrancaId);
  }
  if (!atualizado) {
    return {
      ok: false as const,
      motivo: "Pedido não encontrado para esta cobrança",
      cobrancaId,
    };
  }
  const pedido: PedidoCompra = {
    ...atualizado,
    status: "pago",
    pagoEm: atualizado.pagoEm || new Date().toISOString(),
  };
  if (pedido.status !== atualizado.status || !atualizado.pagoEm) {
    await gravarPedido(pedido);
  }
  const mail = await avisarCompra({ pedido, evento: "pagamento_confirmado" });
  return { ok: mail.ok, mail, pedido };
}
