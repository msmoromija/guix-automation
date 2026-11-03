import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { lerPacoteJsonPedido, lerPedido, snapshotPacoteJson } from "@/lib/pedidos/compra";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { googleFontsHref, tipoPorId } from "@/lib/estudio/visual";

export const runtime = "nodejs";
export const maxDuration = 60;

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-cupons-senha") || req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const { id } = await ctx.params;
  const cobrancaId = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

  let buffer = await lerPacoteJsonPedido(cobrancaId);
  if (!buffer) {
    const pedido = await lerPedido(cobrancaId);
    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    }
    let corpo: unknown = { versaoPacote: "1.0", pedido };
    if (pedido.previewId) {
      try {
        const token = sanitizarToken(pedido.previewToken || pedido.previewId);
        const pacote = await lerPacote(token);
        if (pacote) {
          const visual = pacote.visual || null;
          const tipo = visual ? tipoPorId(visual.tipografiaId) : null;
          corpo = {
            versaoPacote: "1.0",
            pedidoId: pedido.id,
            geradoEm: new Date().toISOString(),
            meta: {
              token: pacote.token,
              nicho: pacote.nicho,
              nome: pacote.nome,
              cidade: pacote.cidade || "",
              whatsapp: pacote.whatsapp || "",
              email: pacote.email || "",
              status: pacote.status || "rascunho",
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
            compra: {
              id: pedido.id,
              status: pedido.status,
              plano: pedido.planoNome,
              nicho: pedido.nichoNome,
              valorCentavos: pedido.centavos,
              cliente: pedido.cliente,
              cupom: pedido.cupomCodigo || null,
            },
          };
        }
      } catch (e) {
        console.error("rebuild json", e);
      }
    }
    buffer = Buffer.from(JSON.stringify(corpo, null, 2));
    await snapshotPacoteJson(cobrancaId, corpo).catch(() => undefined);
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="guix-pedido-${cobrancaId}-completo.json"`,
      "Cache-Control": "private, no-store",
      "Content-Length": String(buffer.length),
    },
  });
}
