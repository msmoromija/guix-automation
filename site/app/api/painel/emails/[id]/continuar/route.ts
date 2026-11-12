import { after, NextRequest, NextResponse } from "next/server";
import { acessoEmailsAutorizado } from "@/lib/emails/acesso";
import { provisionarEmails } from "@/lib/emails/provisionar";
import { gravarExecucao, lerExecucao, marcarFalhaExecucao } from "@/lib/emails/store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!acessoEmailsAutorizado(req)) {
    return NextResponse.json({ erro: "Acesso não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const execucao = await lerExecucao(id);
  if (!execucao) return NextResponse.json({ erro: "Execução não encontrada." }, { status: 404 });

  const falhaAnterior = execucao.status === "erro";
  if (!falhaAnterior) {
    return NextResponse.json({ erro: "Somente execuções com falha podem ser reiniciadas manualmente." }, { status: 409 });
  }

  execucao.status = "em_configuracao";
  execucao.concluidoEm = null;
  execucao.erro = null;
  await gravarExecucao(execucao);

  after(async () => {
    await provisionarEmails({
      id: execucao.id,
      projetoId: execucao.projetoId,
      cliente: execucao.cliente,
      dominio: execucao.dominio,
      contas: execucao.contas,
      usuario: execucao.usuario,
    }).catch(async (erro) => {
      console.error("continuar provisionamento de emails", erro);
      await marcarFalhaExecucao(execucao.id, erro);
    });
  });

  return NextResponse.json({ ok: true, execucao }, { status: 202 });
}
