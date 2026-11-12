import { NextRequest, NextResponse } from "next/server";
import {
  buscarLeadPorTelefone,
  listarLeads,
  normalizarTelefone,
} from "@/lib/prospeccao/store";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const tokenEsperado = (process.env.PROSPECCAO_IA_TOKEN || "").trim();
  if (!tokenEsperado) return true;
  const h = req.headers.get("x-prospeccao-token") || "";
  const q = req.nextUrl.searchParams.get("token") || "";
  return h === tokenEsperado || q === tokenEsperado;
}

/**
 * GET /api/painel/prospeccao/ia
 *   ?telefone=...  → retorna o lead daquele número
 *   ?listar=1      → retorna todos os leads
 *
 * API interna simples para a IA da Meta consultar histórico de contatos.
 */
export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ erro: "Token inválido." }, { status: 401 });
  }

  const listar = req.nextUrl.searchParams.get("listar");
  if (listar === "1" || listar === "true") {
    const todos = await listarLeads(2000);
    const resumido = todos.map((l) => ({
      id: l.id,
      nome: l.nome,
      telefone: l.telefone,
      cidade: l.cidade,
      nicho: l.nicho,
      status: l.status,
      data_ultimo_contato: l.data_ultimo_contato,
      conta_whatsapp: l.conta_whatsapp,
      modelo_usado: l.modelo_usado,
      observacoes: l.observacoes,
    }));
    return NextResponse.json({ ok: true, leads: resumido, total: resumido.length });
  }

  const telefone = req.nextUrl.searchParams.get("telefone") || "";
  if (!telefone) {
    return NextResponse.json(
      { erro: "Informe ?telefone= ou ?listar=1" },
      { status: 400 },
    );
  }

  const telNorm = normalizarTelefone(telefone);
  const lead = await buscarLeadPorTelefone(telNorm);
  if (!lead) {
    return NextResponse.json({
      ok: true,
      lead: null,
      mensagem: "Nenhum lead com este telefone.",
    });
  }

  return NextResponse.json({
    ok: true,
    lead: {
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      cidade: lead.cidade,
      nicho: lead.nicho,
      status: lead.status,
      data_ultimo_contato: lead.data_ultimo_contato,
      conta_whatsapp: lead.conta_whatsapp,
      modelo_usado: lead.modelo_usado,
      observacoes: lead.observacoes,
    },
  });
}
