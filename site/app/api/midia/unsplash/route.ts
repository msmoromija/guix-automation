import { NextRequest, NextResponse } from "next/server";
import { autorizarCliente, autorizarPainel } from "@/lib/media/auth";
import { buscarUnsplash, espelharUnsplashNoR2 } from "@/lib/media/unsplash";
import type { CategoriaImagem, Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!autorizarPainel(req)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) {
    return NextResponse.json({ erro: "informe q" }, { status: 400 });
  }
  try {
    const fotos = await buscarUnsplash(q);
    return NextResponse.json({ fotos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}

/** Seleciona foto Unsplash → baixa → grava no R2 do CLIENTE (isolado) com crédito. */
export async function POST(req: NextRequest) {
  const clienteId = autorizarCliente(req);
  if (!clienteId) {
    return NextResponse.json(
      { erro: "não autorizado — informe x-painel-token e x-cliente-id" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const foto = body.foto;
    const nicho = (body.nicho || "generico") as Nicho;
    const categoria = (body.categoria || "hero") as CategoriaImagem;

    if (!foto?.id || !foto?.url_download) {
      return NextResponse.json({ erro: "foto inválida" }, { status: 400 });
    }

    const resultado = await espelharUnsplashNoR2({
      foto,
      nicho,
      categoria,
      clienteId,
    });

    if (resultado.status === "negada") {
      return NextResponse.json(
        {
          ok: false,
          status: "negada",
          motivo: resultado.motivo,
          r2_key: resultado.key,
          origem: "unsplash",
          credito: resultado.credito,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: "aprovada",
      src: resultado.url,
      r2_key: resultado.key,
      origem: "unsplash",
      credito: resultado.credito,
      alt: resultado.alt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
