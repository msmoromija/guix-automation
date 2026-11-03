import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { montarPacoteZip } from "@/lib/prototipos/pacote-zip";
import { googleFontsHref, tipoPorId } from "@/lib/estudio/visual";
import {
  gravarPedido,
  linksDoPrototipo,
  linkWhatsappPedido,
  snapshotPacoteJson,
  snapshotPacoteZip,
  type PedidoCompra,
} from "@/lib/pedidos/compra";

/**
 * Grava pedido no índice, tenta snapshot do ZIP+JSON no R2 e devolve link WhatsApp
 * (fallback enquanto Resend não propaga).
 */
export async function prepararEntregaPedido(pedido: PedidoCompra) {
  let atual = { ...pedido };
  const avisos: string[] = [];
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");

  if (atual.temPrototipo && atual.previewId) {
    try {
      const token = sanitizarToken(atual.previewToken || atual.previewId);
      const pacote = await lerPacote(token);
      if (pacote) {
        const { buffer, avisos: midiaAvisos, manifesto } = await montarPacoteZip(pacote);
        const snapZip = await snapshotPacoteZip(atual.id, buffer);
        const visual = pacote.visual || null;
        const tipo = visual ? tipoPorId(visual.tipografiaId) : null;
        const completo = {
          versaoPacote: "1.0",
          pedidoId: atual.id,
          geradoEm: new Date().toISOString(),
          meta: {
            token: pacote.token,
            nicho: pacote.nicho,
            nome: pacote.nome,
            cidade: pacote.cidade || "",
            whatsapp: pacote.whatsapp || "",
            email: pacote.email || "",
            slogan: pacote.slogan || "",
            status: pacote.status || "rascunho",
            criadoEm: pacote.criadoEm,
            expiraEm: pacote.expiraEm,
          },
          site: pacote.site,
          visual: visual || {},
          fonts: visual
            ? {
                tipografiaId: visual.tipografiaId,
                font_heading: tipo?.font_heading,
                font_body: tipo?.font_body,
                googleFontsCss: googleFontsHref(visual),
              }
            : {},
          manifesto,
          compra: {
            id: atual.id,
            status: atual.status,
            plano: atual.planoNome,
            nicho: atual.nichoNome,
            valorCentavos: atual.centavos,
            cliente: atual.cliente,
            cupom: atual.cupomCodigo || null,
            pagoEm: atual.pagoEm || null,
          },
        };
        const snapJson = await snapshotPacoteJson(atual.id, completo);
        atual = {
          ...atual,
          pacoteZipKey: snapZip.key,
          pacoteZipBytes: snapZip.bytes,
          pacoteJsonKey: snapJson.key,
          links: {
            ...linksDoPrototipo(token, atual.id),
            ...atual.links,
            pacoteZipPainel: `${base}/api/painel/pedidos/${encodeURIComponent(atual.id)}/pacote.zip`,
            completo: `${base}/api/painel/pedidos/${encodeURIComponent(atual.id)}/completo.json`,
          },
        };
        avisos.push(...midiaAvisos);
      } else {
        avisos.push("Protótipo não encontrado ou expirado ao montar o ZIP.");
      }
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : "Falha ao montar ZIP");
      console.error("snapshot zip", e);
    }
  }

  // Sem ZIP completo: grava/atualiza o JSON mínimo do pedido (inclui status pago)
  try {
    const precisaJsonMinimo = !atual.pacoteJsonKey || (atual.status === "pago" && !atual.pacoteZipKey);
    if (precisaJsonMinimo) {
      const snap = await snapshotPacoteJson(atual.id, {
        versaoPacote: "1.0",
        pedido: atual,
        aviso: atual.temPrototipo
          ? "Protótipo indisponível no momento do snapshot."
          : "Compra sem protótipo — montar site com os dados do pedido.",
      });
      atual = {
        ...atual,
        pacoteJsonKey: snap.key,
        links: {
          ...atual.links,
          completo: `${base}/api/painel/pedidos/${encodeURIComponent(atual.id)}/completo.json`,
        },
      };
    }
  } catch (e) {
    avisos.push(e instanceof Error ? e.message : "Falha ao gravar JSON do pedido");
  }

  await gravarPedido(atual);
  const whatsappUrl = linkWhatsappPedido(atual);
  return { pedido: atual, whatsappUrl, avisos };
}
