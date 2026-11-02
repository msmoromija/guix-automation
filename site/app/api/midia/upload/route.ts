import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { autorizarCliente } from "@/lib/media/auth";
import { chaveClienteInbox, enviarBuffer } from "@/lib/media/r2";
import { enquadrarParaSlot } from "@/lib/media/processar-imagem";
import { avaliarParaSlot, filtrarArquivoBasico } from "@/lib/media/validar-imagem";
import type { CategoriaImagem } from "@/lib/media/tipos";
import { slotDaCategoria } from "@/lib/media/slots";

export const runtime = "nodejs";

/**
 * Upload próprio do cliente:
 * 1. Filtra MIME/tamanho
 * 2. Avalia resolução vs slot do banner
 * 3. Enquadra (cover) se aprovada
 * 4. Grava só em clientes/{id}/… (nunca na biblioteca compartilhada)
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
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    const alt = String(form.get("alt") || "Foto do negócio");
    const categoria = String(form.get("categoria") || "hero") as CategoriaImagem;

    if (!(arquivo instanceof File)) {
      return NextResponse.json({ erro: "arquivo obrigatório" }, { status: 400 });
    }
    if (!slotDaCategoria(categoria)) {
      return NextResponse.json({ erro: "categoria inválida" }, { status: 400 });
    }

    // clienteId do form é ignorado — só vale o header (anti-vazamento)
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const filtro = filtrarArquivoBasico({
      contentType: arquivo.type,
      nome: arquivo.name,
      bytes: bytes.byteLength,
    });
    if (!filtro.ok) {
      return NextResponse.json(
        { ok: false, status: "negada", motivo: filtro.motivo },
        { status: 422 },
      );
    }

    const avaliacao = await avaliarParaSlot(bytes, categoria);
    const nome = `${randomUUID()}.webp`;
    const key = chaveClienteInbox(clienteId, categoria, nome);

    if (!avaliacao.ok) {
      // Guarda original negado só para auditoria leve (sem publicar)
      await enviarBuffer({
        key,
        body: bytes,
        contentType: filtro.contentType,
        origem: "upload",
        alt,
        tags: ["upload", "negada", clienteId, categoria],
        status: "negada",
        clienteId,
        categoria,
        motivo: avaliacao.motivo,
        width: avaliacao.width,
        height: avaliacao.height,
      });

      return NextResponse.json(
        {
          ok: false,
          status: "negada",
          motivo: avaliacao.motivo,
          r2_key: key,
          width: avaliacao.width,
          height: avaliacao.height,
          slot: {
            label: avaliacao.slot.label,
            minW: avaliacao.slot.minW,
            minH: avaliacao.slot.minH,
            outW: avaliacao.slot.outW,
            outH: avaliacao.slot.outH,
          },
        },
        { status: 422 },
      );
    }

    const processada = await enquadrarParaSlot(bytes, avaliacao.slot);
    const enviado = await enviarBuffer({
      key,
      body: processada.buffer,
      contentType: processada.contentType,
      origem: "upload",
      alt,
      tags: ["upload", "aprovada", clienteId, categoria],
      status: "aprovada",
      clienteId,
      categoria,
      width: processada.width,
      height: processada.height,
    });

    return NextResponse.json({
      ok: true,
      status: "aprovada",
      src: enviado.url,
      r2_key: enviado.key,
      origem: "upload",
      alt,
      categoria,
      width: processada.width,
      height: processada.height,
      slot: avaliacao.slot.label,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
