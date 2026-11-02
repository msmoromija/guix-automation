import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { autorizarPainel } from "@/lib/media/auth";
import { clienteR2, r2Config } from "@/lib/media/r2";
import {
  ehChaveBiblioteca,
  ehChaveCliente,
  lerClienteId,
  podeLerChaveCliente,
} from "@/lib/media/isolamento";

export const runtime = "nodejs";

/**
 * Proxy R2.
 * - Biblioteca (`imagens/…`): pública (cacheável)
 * - Cliente (`clientes/…`): só com assinatura HMAC ou painel+clienteId do dono
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await ctx.params;
  const key = parts.map(decodeURIComponent).join("/");

  if (!key || key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ erro: "chave inválida" }, { status: 400 });
  }

  if (ehChaveCliente(key)) {
    const ok = podeLerChaveCliente({
      key,
      clienteId: lerClienteId(req),
      painelOk: autorizarPainel(req),
      exp: req.nextUrl.searchParams.get("exp"),
      sig: req.nextUrl.searchParams.get("sig"),
    });
    if (!ok) {
      return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
    }
  } else if (!ehChaveBiblioteca(key)) {
    return NextResponse.json({ erro: "chave fora do escopo" }, { status: 400 });
  }

  try {
    const { bucket } = r2Config();
    const client = clienteR2();
    const out = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const bytes = await out.Body?.transformToByteArray();
    if (!bytes) {
      return NextResponse.json({ erro: "vazio" }, { status: 404 });
    }

    const privada = ehChaveCliente(key);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": out.ContentType || "application/octet-stream",
        "Cache-Control": privada
          ? "private, max-age=3600"
          : "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  }
}
