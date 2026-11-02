import { NextRequest, NextResponse } from "next/server";
import { autorizarCliente } from "@/lib/media/auth";
import { listarPrefixo, metadadosObjeto, urlPublica } from "@/lib/media/r2";
import { prefixoInbox, prefixoPublicado } from "@/lib/media/isolamento";

export const runtime = "nodejs";

/** Lista somente imagens do cliente autenticado (inbox + publicadas). */
export async function GET(req: NextRequest) {
  const clienteId = autorizarCliente(req);
  if (!clienteId) {
    return NextResponse.json(
      { erro: "não autorizado — informe x-painel-token e x-cliente-id" },
      { status: 401 },
    );
  }

  const categoria = req.nextUrl.searchParams.get("categoria") || undefined;
  const escopo = req.nextUrl.searchParams.get("escopo") || "todos"; // inbox | publicado | todos

  try {
    const prefixes: string[] = [];
    if (escopo === "inbox" || escopo === "todos") {
      prefixes.push(prefixoInbox(clienteId, categoria || undefined));
    }
    if (escopo === "publicado" || escopo === "todos") {
      prefixes.push(prefixoPublicado(clienteId, categoria || undefined));
    }

    const itens = [];
    for (const prefix of prefixes) {
      const lista = await listarPrefixo(prefix, 200);
      for (const item of lista) {
        let status = "pendente";
        let motivo = "";
        let cat = categoria || "";
        let alt = "";
        try {
          const meta = await metadadosObjeto(item.key);
          status = meta.metadata.status || status;
          motivo = meta.metadata.motivo || "";
          cat = meta.metadata.categoria || cat;
          alt = meta.metadata.alt || "";
        } catch {
          /* ignore head failures */
        }
        itens.push({
          key: item.key,
          url: urlPublica(item.key),
          size: item.size,
          status,
          motivo: motivo || undefined,
          categoria: cat || undefined,
          alt: alt || undefined,
        });
      }
    }

    return NextResponse.json({ clienteId, itens });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
