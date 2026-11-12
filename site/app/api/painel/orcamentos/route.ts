import { NextRequest, NextResponse } from "next/server";
import { senhaCuponsConfere } from "@/lib/cupons/auth";
import {
  gravarOrcamento,
  listarOrcamentos,
  novoIdOrcamento,
  totalOrcamento,
  urlOrcamento,
  type Orcamento,
} from "@/lib/orcamentos/store";

export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const itens = await listarOrcamentos(100);
  return NextResponse.json({
    ok: true,
    itens: itens.map((o) => ({ ...o, totalCentavos: totalOrcamento(o), url: urlOrcamento(o.id) })),
  });
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const titulo = texto(body.titulo, 120) || "Presença Personalizada";
  const descricao = texto(body.descricao, 14000);
  const prazo = texto(body.prazo, 120);
  const clienteNome = texto(body.clienteNome, 120);
  const dominio = texto(body.dominio, 253)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
  const criadoPor = texto(body.criadoPor, 40) || "comercial";
  const notaInterna = texto(body.notaInterna, 500);

  if (
    dominio &&
    (dominio.length > 253 ||
      dominio.split(".").length < 2 ||
      !/^[a-z0-9.-]+$/.test(dominio) ||
      !/^[a-z]{2,}$/.test(dominio.split(".").at(-1) || "") ||
      dominio.split(".").some((parte) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(parte)))
  ) {
    return NextResponse.json({ erro: "Informe um domínio válido (ex.: cliente.com.br)." }, { status: 400 });
  }

  const valorReais = Number(body.valorReais != null ? body.valorReais : (body.valorCentavos || 0) / 100);
  const descontoReais = Number(body.descontoReais != null ? body.descontoReais : (body.descontoCentavos || 0) / 100);
  const valorCentavos = Math.round(valorReais * 100);
  const descontoCentavos = Math.round(descontoReais * 100);

  if (descricao.length < 20) {
    return NextResponse.json({ erro: "Descreva o escopo (pelo menos 20 caracteres)." }, { status: 400 });
  }
  if (prazo.length < 3) {
    return NextResponse.json({ erro: "Informe o prazo de elaboração (ex.: até 24 horas)." }, { status: 400 });
  }
  if (!Number.isFinite(valorCentavos) || valorCentavos < 50_000 || valorCentavos > 5_000_000) {
    return NextResponse.json({ erro: "Valor padrão entre R$ 500,00 e R$ 50.000,00." }, { status: 400 });
  }
  if (!Number.isFinite(descontoCentavos) || descontoCentavos < 0 || descontoCentavos >= valorCentavos) {
    return NextResponse.json({ erro: "Desconto deve ser menor que o valor padrão." }, { status: 400 });
  }
  const total = valorCentavos - descontoCentavos;
  if (total < 10_000) {
    return NextResponse.json({ erro: "Total a pagar deve ser pelo menos R$ 100,00." }, { status: 400 });
  }

  const agora = new Date().toISOString();
  const orcamento: Orcamento = {
    id: novoIdOrcamento(),
    criadoEm: agora,
    atualizadoEm: agora,
    status: "aberto",
    titulo,
    descricao,
    prazo,
    valorCentavos,
    descontoCentavos,
    clienteNome,
    dominio: dominio || null,
    criadoPor,
    notaInterna,
  };

  const salvo = await gravarOrcamento(orcamento);
  return NextResponse.json({
    ok: true,
    orcamento: { ...salvo, totalCentavos: totalOrcamento(salvo), url: urlOrcamento(salvo.id) },
  });
}
