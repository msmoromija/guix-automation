import { NextRequest, NextResponse } from "next/server";
import { senhaCuponsConfere } from "@/lib/cupons/auth";
import { corrigirElaboracaoOrcamento, gerarElaboracaoOrcamento } from "@/lib/orcamentos/elaborar";

export const runtime = "nodejs";
export const maxDuration = 60;

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-cupons-senha") || req.headers.get("x-painel-token") || "";
  return senhaCuponsConfere(bearer) || senhaCuponsConfere(q) || senhaCuponsConfere(x);
}

function texto(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  return v.normalize("NFC").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const modo = texto(body.modo, 20) || "gerar";

    if (modo === "corrigir") {
      const elaboracao = await corrigirElaboracaoOrcamento({
        textoAtual: texto(body.textoAtual || body.descricao, 14000),
        instrucao: texto(body.instrucao || body.pedido, 2000),
      });
      return NextResponse.json({ ok: true, elaboracao });
    }

    const elaboracao = await gerarElaboracaoOrcamento({
      mensagemCliente: texto(body.mensagemCliente || body.mensagem, 12000),
      titulo: texto(body.titulo, 120),
      clienteNome: texto(body.clienteNome, 120),
    });
    return NextResponse.json({ ok: true, elaboracao });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao montar a elaboração.";
    const status = /OPENAI_API_KEY|OpenAI/i.test(msg) ? 502 : 400;
    return NextResponse.json({ erro: msg.slice(0, 280) }, { status });
  }
}
