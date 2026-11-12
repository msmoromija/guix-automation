import { timingSafeEqual } from "crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { provisionarEmails } from "@/lib/emails/provisionar";
import {
  gravarExecucao,
  listarExecucoesPendentes,
  marcarFalhaExecucao,
} from "@/lib/emails/store";

export const runtime = "nodejs";
export const maxDuration = 300;

function cronAutorizado(req: NextRequest) {
  const segredo = process.env.CRON_SECRET?.trim();
  if (!segredo) return false;
  const recebido = req.headers.get("authorization") || "";
  const esperado = `Bearer ${segredo}`;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ erro: "CRON_SECRET não configurado." }, { status: 503 });
  }
  if (!cronAutorizado(req)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const pendente = (await listarExecucoesPendentes())
    .sort((a, b) => Date.parse(a.concluidoEm || "") - Date.parse(b.concluidoEm || ""))[0];

  if (!pendente) return NextResponse.json({ ok: true, retomada: null });

  // Marca a execução como ativa antes de agendar o trabalho, para que a próxima
  // rodada do cron não inicie novamente a mesma execução.
  pendente.concluidoEm = null;
  await gravarExecucao(pendente);

  after(async () => {
    await provisionarEmails({
      id: pendente.id,
      projetoId: pendente.projetoId,
      cliente: pendente.cliente,
      dominio: pendente.dominio,
      contas: pendente.contas,
      usuario: pendente.usuario,
    }).catch(async (erro) => {
      console.error("retomada cron de provisionamento de emails", erro);
      await marcarFalhaExecucao(pendente.id, erro);
    });
  });

  return NextResponse.json({ ok: true, retomada: pendente.id }, { status: 202 });
}
