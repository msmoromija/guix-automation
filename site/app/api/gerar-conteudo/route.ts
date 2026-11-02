import { NextRequest, NextResponse } from "next/server";
import { autorizarCliente, autorizarPainel } from "@/lib/media/auth";
import { gerarTextosSite } from "@/lib/media/openai";
import { resolverSugestoesBiblioteca } from "@/lib/media/resolver-imagens";
import type { CategoriaImagem, Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";

/**
 * Automação de textos + sugestão de imagens da biblioteca.
 * Com x-cliente-id, as sugestões ficam amarradas ao projeto (sem misturar uploads).
 */
export async function POST(req: NextRequest) {
  if (!autorizarPainel(req)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const nome = String(body.nome || "").trim();
    if (!nome) {
      return NextResponse.json({ erro: "nome obrigatório" }, { status: 400 });
    }

    const nicho = (body.nicho || "generico") as Nicho;
    const clienteId = autorizarCliente(req);

    const textos = await gerarTextosSite({
      nicho,
      nome,
      cidade: body.cidade,
      servicos: Array.isArray(body.servicos) ? body.servicos : undefined,
      tom: body.tom,
    });

    const sugestoes = (textos.imagens_sugeridas || []).map((s) => ({
      categoria: s.categoria as CategoriaImagem,
      tags: s.tags || [],
      motivo: s.motivo || "",
    }));

    const imagens = await resolverSugestoesBiblioteca({ nicho, sugestoes });

    return NextResponse.json({
      clienteId: clienteId || null,
      textos: {
        hero: textos.hero,
        sobre: textos.sobre,
        servicos: textos.servicos,
      },
      imagens_sugeridas: imagens,
      nota:
        "Uploads do cliente ficam em clientes/{id}/ e nunca entram nestas sugestões da biblioteca.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
