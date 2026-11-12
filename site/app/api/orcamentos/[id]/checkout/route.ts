import { contato } from "@/lib/contato";
import { AsaasIndisponivel, criarCobranca } from "@/lib/asaas";
import { avisarCompra } from "@/lib/automacao/aviso-compra";
import { validarDocumento, normalizarTelefoneBr } from "@/lib/documento";
import { MAX_PARCELAS } from "@/lib/planos";
import type { FormaPagamento } from "@/lib/cobranca";
import { gravarPedido, type PedidoCompra } from "@/lib/pedidos/compra";
import { textoContratoOrcamento } from "@/lib/orcamentos/contrato";
import { gravarOrcamento, lerOrcamento, totalOrcamento } from "@/lib/orcamentos/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const formas: Record<string, FormaPagamento> = {
  pix: "PIX",
  boleto: "BOLETO",
  cartao: "CREDIT_CARD",
};

function texto(valor: unknown, maximo: number) {
  if (typeof valor !== "string") return "";
  return valor.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, maximo);
}

export async function POST(requisicao: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const orcamento = await lerOrcamento(String(id || "").trim());
  if (!orcamento) {
    return Response.json({ erro: "Orçamento não encontrado." }, { status: 404 });
  }
  if (orcamento.status === "pago") {
    return Response.json({ erro: "Este orçamento já foi pago." }, { status: 409 });
  }
  if (orcamento.status === "cancelado") {
    return Response.json({ erro: "Este orçamento foi cancelado. Peça um novo link ao comercial." }, { status: 410 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return Response.json({ erro: "Envie os dados do pagamento em JSON." }, { status: 400 });
  }

  if (corpo.aceite !== true) {
    return Response.json({ erro: "É preciso ler e aceitar o contrato para pagar." }, { status: 400 });
  }

  const forma = typeof corpo.forma === "string" ? formas[corpo.forma] : undefined;
  const nome = texto(corpo.nome, 80);
  const email = texto(corpo.email, 120).toLowerCase();
  const telefone = normalizarTelefoneBr(texto(corpo.telefone, 24));
  const documento = validarDocumento(texto(corpo.documento, 20));
  const parcelas = Number(corpo.parcelas);

  if (!forma) return Response.json({ erro: "Escolha PIX, boleto ou cartão." }, { status: 400 });
  if (nome.length < 3) return Response.json({ erro: "Informe o nome de quem está contratando." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ erro: "Informe um e-mail válido — a confirmação chega nele." }, { status: 400 });
  }
  if (!telefone) return Response.json({ erro: "Informe um telefone com DDD." }, { status: 400 });
  if (!documento) return Response.json({ erro: "Informe um CPF ou CNPJ válido." }, { status: 400 });
  if (forma === "CREDIT_CARD" && (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > MAX_PARCELAS)) {
    return Response.json({ erro: "Escolha de 1 a 12 parcelas no cartão." }, { status: 400 });
  }

  const centavos = totalOrcamento(orcamento);
  if (centavos < 10_000) {
    return Response.json({ erro: "Valor do orçamento inválido. Fale com o comercial." }, { status: 400 });
  }

  const descricao = (
    `GuiX.net Presença Personalizada — ${orcamento.titulo}` +
    (orcamento.descontoCentavos > 0 ? ` (desc. R$ ${(orcamento.descontoCentavos / 100).toFixed(2)})` : "") +
    ` · orç. ${orcamento.id}`
  ).slice(0, 500);

  try {
    const cobranca = await criarCobranca({
      nome,
      email,
      cpfCnpj: documento,
      telefone,
      forma,
      parcelas: forma === "CREDIT_CARD" ? parcelas : 1,
      centavos,
      descricao,
      referencia: `or:${orcamento.id}:${Date.now().toString(36)}`.slice(0, 50),
    });

    const pedido: PedidoCompra = {
      id: cobranca.id,
      criadoEm: new Date().toISOString(),
      status: "aguardando",
      plano: "personalizado",
      planoNome: "Presença Personalizada",
      nichoId: "personalizado",
      nichoNome: orcamento.clienteNome || orcamento.titulo || "Sob medida",
      configuracao: "equipe",
      centavos,
      subtotalCentavos: orcamento.valorCentavos,
      descontoCentavos: orcamento.descontoCentavos || undefined,
      cupomCodigo: null,
      forma,
      parcelas: forma === "CREDIT_CARD" ? parcelas : 1,
      descricao,
      cliente: { nome, email, telefone, documento },
      temPrototipo: false,
      previewId: null,
      previewToken: null,
      orcamentoId: orcamento.id,
      asaas: {
        invoiceUrl: cobranca.invoiceUrl,
        bankSlipUrl: cobranca.bankSlipUrl,
      },
    };

    await gravarPedido(pedido);
    await gravarOrcamento({
      ...orcamento,
      status: "aguardando_pagamento",
      cobrancaId: cobranca.id,
      clienteNome: orcamento.clienteNome || nome,
    });

    let aviso: unknown = null;
    try {
      const ops = await avisarCompra({ pedido, evento: "cobranca_criada" });
      let cliente: unknown = null;
      try {
        const { avisarClienteCobrancaCriada } = await import("@/lib/automacao/emails-institucionais");
        cliente = await avisarClienteCobrancaCriada(pedido);
      } catch (e) {
        cliente = { ok: false, motivo: e instanceof Error ? e.message : "falha" };
      }
      // cópia explícita do contrato para a equipe (já está em destinatariosOps)
      try {
        const { enviarResend } = await import("@/lib/automacao/emails-institucionais");
        const { destinatariosOps } = await import("@/lib/pedidos/compra");
        const contrato = textoContratoOrcamento(orcamento);
        await enviarResend({
          para: destinatariosOps(),
          assunto: `[Orçamento] Cobrança gerada · ${orcamento.id} · ${nome}`,
          texto: `Cobrança ${cobranca.id}\nCliente ${nome} <${email}>\nTotal R$ ${(centavos / 100).toFixed(2)}\n\n${contrato}`,
          html: `<p>Cobrança <strong>${cobranca.id}</strong> gerada para o orçamento <strong>${orcamento.id}</strong>.</p>
            <p>${nome} · ${email} · ${telefone}</p>
            <p>Total: <strong>R$ ${(centavos / 100).toFixed(2)}</strong></p>
            <pre style="white-space:pre-wrap;font-size:12px;background:#f8fafc;padding:12px;border-radius:8px">${contrato
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")}</pre>`,
        });
      } catch (e) {
        console.error("email contrato orçamento", e);
      }
      aviso = { ops, cliente };
    } catch (e) {
      aviso = { ok: false, motivo: e instanceof Error ? e.message : "e-mail indisponível" };
    }

    return Response.json({ cobranca, orcamentoId: orcamento.id, aviso });
  } catch (erro) {
    if (erro instanceof AsaasIndisponivel) {
      return Response.json(
        {
          erro: `O pagamento online ainda está sendo ligado. Chame no WhatsApp ${contato.whatsappExibicao}.`,
        },
        { status: 503 },
      );
    }
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível gerar a cobrança.";
    return Response.json({ erro: mensagem }, { status: 502 });
  }
}
