import { NextRequest, NextResponse } from "next/server";
import { senhaCuponsConfere } from "@/lib/cupons/auth";
import {
  gerarCodigoSugestao,
  gravarCupom,
  listarCupons,
  lerCupom,
  normalizarCodigo,
  type Cupom,
  type TipoCupom,
} from "@/lib/cupons/store";
import type { PlanoId } from "@/lib/planos";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-cupons-senha") || req.headers.get("x-painel-token") || "";
  return senhaCuponsConfere(bearer) || senhaCuponsConfere(q) || senhaCuponsConfere(x);
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const itens = await listarCupons(100);
  return NextResponse.json({ ok: true, itens, sugestao: gerarCodigoSugestao() });
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const codigo = normalizarCodigo(String(body.codigo || gerarCodigoSugestao()));
  if (codigo.length < 4) {
    return NextResponse.json({ erro: "Código com pelo menos 4 caracteres." }, { status: 400 });
  }
  const existente = await lerCupom(codigo);
  if (existente) {
    return NextResponse.json({ erro: "Já existe um cupom com este código. Gere outro." }, { status: 409 });
  }

  const tipo: TipoCupom = body.tipo === "percentual" ? "percentual" : "fixo";
  const valorCentavos =
    tipo === "fixo"
      ? Math.round(Number(body.valorReais != null ? body.valorReais : (body.valorCentavos || 0) / 100) * 100)
      : 0;
  const percentual = tipo === "percentual" ? Math.round(Number(body.percentual || 0)) : 0;

  if (tipo === "fixo" && (valorCentavos < 100 || valorCentavos > 500_000)) {
    return NextResponse.json({ erro: "Desconto fixo entre R$ 1,00 e R$ 5.000,00." }, { status: 400 });
  }
  if (tipo === "percentual" && (percentual < 1 || percentual > 90)) {
    return NextResponse.json({ erro: "Percentual entre 1% e 90%." }, { status: 400 });
  }

  let usosMaximos: number | null = null;
  if (body.usosMaximos !== "" && body.usosMaximos != null) {
    const n = Number(body.usosMaximos);
    if (!Number.isInteger(n) || n < 1 || n > 10_000) {
      return NextResponse.json({ erro: "Usos máximos inválidos." }, { status: 400 });
    }
    usosMaximos = n;
  }

  let validoAte: string | null = null;
  if (body.validoAte) {
    const d = new Date(String(body.validoAte));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ erro: "Data de validade inválida." }, { status: 400 });
    }
    validoAte = d.toISOString();
  }

  let planos: PlanoId[] | null = null;
  if (Array.isArray(body.planos) && body.planos.length) {
    const filtrados = (body.planos as string[]).filter(
      (p): p is PlanoId => p === "simples" || p === "avancado",
    );
    planos = filtrados.length ? filtrados : null;
  }

  const cupom: Cupom = {
    codigo,
    tipo,
    valorCentavos,
    percentual,
    ativo: body.ativo === false ? false : true,
    usosMaximos,
    usos: 0,
    validoAte,
    planos,
    nota: String(body.nota || "").slice(0, 200),
    criadoPor: String(body.criadoPor || "comercial").slice(0, 80),
    criadoEm: new Date().toISOString(),
    usosLog: [],
  };

  const salvo = await gravarCupom(cupom);
  return NextResponse.json({ ok: true, cupom: salvo });
}

export async function PATCH(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const codigo = normalizarCodigo(String(body.codigo || ""));
  const cupom = await lerCupom(codigo);
  if (!cupom) return NextResponse.json({ erro: "Cupom não encontrado." }, { status: 404 });

  if (typeof body.ativo === "boolean") cupom.ativo = body.ativo;
  if (body.nota != null) cupom.nota = String(body.nota).slice(0, 200);
  if (body.usosMaximos === null) cupom.usosMaximos = null;
  else if (body.usosMaximos != null && body.usosMaximos !== "") {
    const n = Number(body.usosMaximos);
    if (Number.isInteger(n) && n >= cupom.usos) cupom.usosMaximos = n;
  }

  const salvo = await gravarCupom(cupom);
  return NextResponse.json({ ok: true, cupom: salvo });
}
