import { NextRequest, NextResponse } from "next/server";
import { acessoEmailsAutorizado } from "@/lib/emails/acesso";
import { lerExecucao } from "@/lib/emails/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!acessoEmailsAutorizado(req)) return NextResponse.json({ erro: "Acesso não autorizado." }, { status: 401 });
  const { id } = await params;
  const execucao = await lerExecucao(id);
  if (!execucao) return NextResponse.json({ erro: "Execução não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, execucao });
}
