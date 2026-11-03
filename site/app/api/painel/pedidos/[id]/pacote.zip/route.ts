import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { lerPacoteZipPedido, lerPedido, snapshotPacoteZip } from "@/lib/pedidos/compra";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { montarPacoteZip } from "@/lib/prototipos/pacote-zip";

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

  let buffer = await lerPacoteZipPedido(cobrancaId);
  if (!buffer) {
    const pedido = await lerPedido(cobrancaId);
    if (pedido?.previewId) {
      try {
        const token = sanitizarToken(pedido.previewToken || pedido.previewId);
        const pacote = await lerPacote(token);
        if (pacote) {
          const { buffer: zip } = await montarPacoteZip(pacote);
          buffer = zip;
          await snapshotPacoteZip(cobrancaId, zip).catch(() => undefined);
        }
      } catch (e) {
        console.error("rebuild zip", e);
      }
    }
  }

  if (!buffer) {
    return NextResponse.json(
      { erro: "ZIP não disponível. Pedido sem protótipo ou pacote ainda não gerado." },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="guix-pedido-${cobrancaId}-pacote.zip"`,
      "Cache-Control": "private, no-store",
      "Content-Length": String(buffer.length),
    },
  });
}
