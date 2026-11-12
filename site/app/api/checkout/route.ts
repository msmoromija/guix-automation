import { contato } from "@/lib/contato";
import { AsaasIndisponivel, criarCobranca } from "@/lib/asaas";
import { validarDocumento, normalizarTelefoneBr } from "@/lib/documento";
import { calcularTotal, MAX_PARCELAS, nomeDoNicho, planoPorId, type Configuracao, type PlanoId } from "@/lib/planos";
import type { FormaPagamento } from "@/lib/cobranca";
import { avisarCompra } from "@/lib/automacao/aviso-compra";
import { linksDoPrototipo, type PedidoCompra } from "@/lib/pedidos/compra";
import { prepararEntregaPedido } from "@/lib/pedidos/preparar-entrega";

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

export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return Response.json({ erro: "Envie os dados do pedido em JSON." }, { status: 400 });
  }

  const plano = corpo.plano === "avancado" ? "avancado" : corpo.plano === "simples" ? "simples" : null;
  const configuracao: Configuracao | null = corpo.configuracao === "equipe" ? "equipe" : corpo.configuracao === "ia" ? "ia" : null;
  const forma = typeof corpo.forma === "string" ? formas[corpo.forma] : undefined;
  const nichoId = texto(corpo.nicho, 40);
  const nome = texto(corpo.nome, 80);
  const email = texto(corpo.email, 120).toLowerCase();
  const telefone = normalizarTelefoneBr(texto(corpo.telefone, 24));
  const documento = validarDocumento(texto(corpo.documento, 20));
  const parcelas = Number(corpo.parcelas);

  if (!plano || !configuracao || !forma) {
    return Response.json({ erro: "Escolha o plano, a configuração e a forma de pagamento." }, { status: 400 });
  }
  const nichoNome = nomeDoNicho(plano as PlanoId, nichoId);
  if (!nichoNome) return Response.json({ erro: "Escolha o tipo de negócio." }, { status: 400 });
  if (nome.length < 3) return Response.json({ erro: "Informe o nome de quem está contratando." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  if (!telefone) return Response.json({ erro: "Informe um telefone com DDD." }, { status: 400 });
  if (!documento) return Response.json({ erro: "Informe um CPF ou CNPJ válido. Ele aparece na cobrança." }, { status: 400 });
  if (forma === "CREDIT_CARD" && (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > MAX_PARCELAS)) {
    return Response.json({ erro: "Escolha de 1 a 12 parcelas no cartão." }, { status: 400 });
  }

  const planoNome = planoPorId(plano)?.nome ?? "GuiX.net";
  const subtotalCentavos = calcularTotal(plano, configuracao);
  let centavos = subtotalCentavos;
  let descontoCentavos = 0;
  let cupomCodigo: string | null = null;
  const codigoCupomRaw = texto(corpo.cupom, 24);
  if (codigoCupomRaw) {
    const { lerCupom, normalizarCodigo, validarCupomParaTotal } = await import("@/lib/cupons/store");
    const resultado = validarCupomParaTotal(
      await lerCupom(normalizarCodigo(codigoCupomRaw)),
      subtotalCentavos,
      plano,
    );
    if (!resultado.ok) {
      return Response.json({ erro: resultado.erro }, { status: 400 });
    }
    centavos = resultado.totalCentavos;
    descontoCentavos = resultado.descontoCentavos;
    cupomCodigo = resultado.cupom.codigo;
  }
  const descricao = (
    `GuiX.net ${planoNome} — ${nichoNome}. ${configuracao === "equipe" ? "Configuração pela equipe." : "Configuração com IA."}` +
    (cupomCodigo ? ` Cupom ${cupomCodigo} (−${(descontoCentavos / 100).toFixed(2)}).` : "")
  ).slice(0, 500);
  const previewId = texto(corpo.previewId, 32);
  const previewToken = texto(corpo.previewToken, 80);
  if (previewId && !previewToken) {
    return Response.json({ erro: "Token do protótipo ausente." }, { status: 400 });
  }
  if (previewId && previewToken) {
    try {
      const { autenticarPreview, espelharPrototipoNoRegistry } = await import("@/lib/previews/store");
      let meta = await autenticarPreview(previewId, previewToken);
      if (!meta) {
        // Bruto: permite contratar mesmo após o TTL de 72h do rascunho grátis.
        const { lerPacoteBruto, sanitizarToken } = await import("@/lib/prototipos/cofre");
        const tok = sanitizarToken(previewToken);
        const pacote = await lerPacoteBruto(tok);
        if (pacote && pacote.token === sanitizarToken(previewId)) {
          meta = await espelharPrototipoNoRegistry({
            token: pacote.token,
            nicho: pacote.nicho,
            nome: pacote.nome,
            cidade: pacote.cidade,
            whatsapp: pacote.whatsapp,
            email: pacote.email,
            expiraEm: pacote.expiraEm,
          });
        }
      }
      if (!meta) {
        return Response.json({ erro: "Protótipo inválido para esta cobrança." }, { status: 403 });
      }
    } catch {
      return Response.json({ erro: "Não foi possível validar o protótipo." }, { status: 503 });
    }
  }

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
      referencia: (previewId
        ? `pv:${previewId}:${plano}:${nichoId}`
        : `guix-${plano}-${nichoId}-${Date.now().toString(36)}`
      ).slice(0, 50),
    });
    if (previewId && previewToken) {
      try {
        const { vincularCobranca } = await import("@/lib/previews/store");
        await vincularCobranca(previewId, cobranca.id);
      } catch {
        /* cobrança já existe; o webhook ainda consegue marcar pelo externalReference */
      }
    }
    if (cupomCodigo && descontoCentavos > 0) {
      try {
        const { consumirCupom } = await import("@/lib/cupons/store");
        await consumirCupom({
          codigo: cupomCodigo,
          cobrancaId: cobranca.id,
          email,
          descontoCentavos,
        });
      } catch (e) {
        console.error("consumir cupom", e);
      }
    }

    const pedidoBase: PedidoCompra = {
      id: cobranca.id,
      criadoEm: new Date().toISOString(),
      status: "aguardando",
      plano,
      planoNome,
      nichoId,
      nichoNome,
      configuracao,
      centavos,
      subtotalCentavos,
      descontoCentavos: descontoCentavos || undefined,
      cupomCodigo,
      forma,
      parcelas: forma === "CREDIT_CARD" ? parcelas : 1,
      descricao,
      cliente: { nome, email, telefone, documento },
      temPrototipo: Boolean(previewId && previewToken),
      previewId: previewId || null,
      previewToken: previewToken || null,
      links: previewId ? linksDoPrototipo(previewId, cobranca.id) : undefined,
      asaas: {
        invoiceUrl: cobranca.invoiceUrl,
        bankSlipUrl: cobranca.bankSlipUrl,
      },
    };

    let aviso: unknown = null;
    let entrega: unknown = null;
    try {
      const prep = await prepararEntregaPedido(pedidoBase);
      entrega = {
        painelPedidos: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "")}/painel/pedidos`,
        whatsappUrl: prep.whatsappUrl,
        temZip: Boolean(prep.pedido.pacoteZipKey),
        avisos: prep.avisos,
      };
      try {
        const ops = await avisarCompra({ pedido: prep.pedido, evento: "cobranca_criada" });
        let cliente: unknown = null;
        try {
          const { avisarClienteCobrancaCriada } = await import("@/lib/automacao/emails-institucionais");
          cliente = await avisarClienteCobrancaCriada(prep.pedido);
        } catch (e) {
          console.error("email cliente cobrança", e);
          cliente = { ok: false, motivo: e instanceof Error ? e.message : "falha" };
        }
        aviso = { ops, cliente };
      } catch (e) {
        aviso = { ok: false, motivo: e instanceof Error ? e.message : "e-mail indisponível (use o painel)" };
      }
    } catch (e) {
      console.error("entrega pedido", e);
      entrega = { ok: false, motivo: e instanceof Error ? e.message : "falha" };
    }

    return Response.json({
      cobranca,
      previewId: previewId || null,
      preview: previewId && previewToken
        ? {
            id: previewId,
            url: `/p/${previewId}?t=${previewToken}`,
            downloadUrl: `/api/prototipo/${previewId}/site.json?t=${previewToken}`,
          }
        : null,
      aviso,
      entrega,
    });
  } catch (erro) {
    if (erro instanceof AsaasIndisponivel) {
      return Response.json(
        {
          erro: `O pagamento online ainda está sendo ligado. Chame no WhatsApp ${contato.whatsappExibicao} e enviamos o PIX, o boleto ou o link do cartão.`,
        },
        { status: 503 },
      );
    }
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível gerar a cobrança.";
    return Response.json({ erro: mensagem }, { status: 502 });
  }
}
