import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { listarPedidos, linkWhatsappPedido } from "@/lib/pedidos/compra";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-cupons-senha") || req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const itens = await listarPedidos(100);
  return NextResponse.json({
    ok: true,
    itens: itens.map((p) => ({
      ...p,
      whatsappUrl: linkWhatsappPedido(p),
      temZip: Boolean(p.pacoteZipKey),
      temJson: Boolean(p.pacoteJsonKey),
    })),
  });
}
