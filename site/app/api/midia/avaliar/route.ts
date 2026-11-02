import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { autorizarCliente } from "@/lib/media/auth";
import {
  apagarObjeto,
  baixarObjeto,
  chaveClientePublicado,
  enviarBuffer,
  metadadosObjeto,
  urlPublica,
} from "@/lib/media/r2";
import { assertChaveDoCliente, ehChaveCliente } from "@/lib/media/isolamento";
import type { CategoriaImagem, StatusMidia } from "@/lib/media/tipos";

export const runtime = "nodejs";

/**
 * Aprova ou nega manualmente uma imagem do próprio cliente.
 * Aprovar: copia para `publicado/{categoria}/` (ainda isolado).
 * Negar: atualiza metadado status=negada (não vaza para outros).
 */
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
    const key = String(body.r2_key || "");
    const decisao = String(body.decisao || "") as StatusMidia;
    const motivo = String(body.motivo || "").slice(0, 200);

    if (!ehChaveCliente(key)) {
      return NextResponse.json({ erro: "chave inválida" }, { status: 400 });
    }
    assertChaveDoCliente(key, clienteId);

    if (decisao !== "aprovada" && decisao !== "negada") {
      return NextResponse.json({ erro: "decisao deve ser aprovada|negada" }, { status: 400 });
    }

    const head = await metadadosObjeto(key);
    const meta = { ...head.metadata };
    const categoria = (meta.categoria || body.categoria || "hero") as CategoriaImagem;

    if (decisao === "negada") {
      const buf = await baixarObjeto(key);
      await enviarBuffer({
        key,
        body: buf,
        contentType: head.contentType,
        origem: (meta.origem as "upload" | "unsplash" | "biblioteca") || "upload",
        alt: meta.alt,
        tags: (meta.tags || "").split(",").filter(Boolean),
        status: "negada",
        clienteId,
        categoria,
        motivo: motivo || meta.motivo || "Reprovada",
        width: meta.width ? Number(meta.width) : undefined,
        height: meta.height ? Number(meta.height) : undefined,
      });
      return NextResponse.json({
        ok: true,
        status: "negada",
        r2_key: key,
        motivo: motivo || meta.motivo || "Reprovada",
      });
    }

    // Aprovar → publicar sob prefixo isolado do cliente
    const buf = await baixarObjeto(key);
    const nome = key.split("/").pop() || `${randomUUID()}.webp`;
    const dest = chaveClientePublicado(clienteId, categoria, nome);
    meta.status = "aprovada";
    delete meta.motivo;

    const enviado = await enviarBuffer({
      key: dest,
      body: buf,
      contentType: head.contentType,
      origem: (meta.origem as "upload" | "unsplash" | "biblioteca") || "upload",
      alt: meta.alt,
      tags: (meta.tags || "").split(",").filter(Boolean),
      status: "aprovada",
      clienteId,
      categoria,
      width: meta.width ? Number(meta.width) : undefined,
      height: meta.height ? Number(meta.height) : undefined,
      credito: meta.credito_fotografo
        ? {
            fotografo: meta.credito_fotografo,
            perfil_url: meta.credito_perfil || "",
            unsplash_url: meta.credito_unsplash || "",
            texto: meta.credito_texto || "",
          }
        : undefined,
    });

    // Remove da inbox se era inbox
    if (key.includes("/inbox/") && key !== dest) {
      try {
        await apagarObjeto(key);
      } catch {
        /* ok */
      }
    }

    return NextResponse.json({
      ok: true,
      status: "aprovada",
      r2_key: enviado.key,
      src: enviado.url || urlPublica(enviado.key),
      categoria,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    const status = msg.includes("acesso negado") ? 403 : 500;
    return NextResponse.json({ erro: msg }, { status });
  }
}
