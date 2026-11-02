import { NextRequest, NextResponse } from "next/server";
import { listarAgendamentosSite, sanitizarSiteIdPublico } from "@/lib/agendamentos/cofre";
import { rotuloStatus } from "@/lib/agendamentos/tipos";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Lista solicitações do site — autenticado pelo token do protótipo. */
export async function GET(req: NextRequest) {
  const siteId = sanitizarSiteIdPublico(String(req.nextUrl.searchParams.get("siteId") || ""));
  const token = sanitizarToken(String(req.nextUrl.searchParams.get("t") || ""));
  if (!siteId || !token) {
    return NextResponse.json({ erro: "Informe siteId e token." }, { status: 400 });
  }
  const pacote = await lerPacote(token);
  if (!pacote || pacote.token !== siteId) {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  try {
    const lista = await listarAgendamentosSite(siteId, 100);
    return NextResponse.json({
      ok: true,
      itens: lista.map((ag) => ({
        id: ag.id,
        status: ag.status,
        statusRotulo: rotuloStatus(ag.status),
        servico: ag.servico,
        profissional: ag.profissional,
        data: ag.data,
        hora: ag.hora,
        nomeCompleto: ag.nomeCompleto,
        email: ag.email,
        telefone: ag.telefone,
        criadoEm: ag.criadoEm,
        respostaNota: ag.respostaNota,
        manageToken: ag.manageToken,
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, itens: [] });
  }
}
