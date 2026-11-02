import { NextRequest, NextResponse } from "next/server";
import { autorizarCliente } from "@/lib/media/auth";
import { gerarSiteCliente } from "@/lib/automacao/gerar-site";
import type { EntradaAutomacao } from "@/lib/automacao/tipos";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Gera site.json completo para o cliente autenticado (isolado por x-cliente-id). */
export async function POST(req: NextRequest) {
  const clienteIdHeader = autorizarCliente(req);
  if (!clienteIdHeader) {
    return NextResponse.json(
      { erro: "não autorizado — informe x-painel-token e x-cliente-id" },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as Partial<EntradaAutomacao> & { gravarPacote?: boolean };
    const entrada: EntradaAutomacao = {
      clienteId: clienteIdHeader, // header vence body
      nicho: (body.nicho || "generico") as Nicho,
      nome: String(body.nome || "").trim(),
      slogan: body.slogan,
      cidade: body.cidade,
      estado: body.estado,
      bairro: body.bairro,
      logradouro: body.logradouro,
      numero: body.numero,
      cep: body.cep,
      telefone: body.telefone,
      whatsapp: body.whatsapp,
      email: body.email,
      cnpj: body.cnpj,
      servicos: body.servicos,
      tom: body.tom,
      imagensCliente: body.imagensCliente,
    };

    if (!entrada.nome) {
      return NextResponse.json({ erro: "nome obrigatório" }, { status: 400 });
    }

    const resultado = await gerarSiteCliente(entrada, {
      gravarPacote: Boolean(body.gravarPacote),
    });

    return NextResponse.json({
      ok: true,
      clienteId: resultado.clienteId,
      avisos: resultado.avisos,
      imagens: resultado.imagens,
      site: resultado.site,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    const status = msg.includes("inválido") ? 422 : 500;
    return NextResponse.json({ erro: msg }, { status });
  }
}
