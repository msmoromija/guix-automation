import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import { buscarGoogle, ehCelularBr, type LugarEncontrado } from "@/lib/prospeccao/buscar";
import {
  chaveApiEfetiva,
  gravarUltimaBusca,
  hojeIso,
  lerConfig,
  listarLeadsPorTelefones,
  normalizarTelefone,
  registrarBusca,
} from "@/lib/prospeccao/store";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

/**
 * POST /api/painel/prospeccao/buscar
 * body: { nicho: string, cidade: string, soComTelefone?: boolean, excluirContatados?: boolean, excluirRecontato?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nichoSlug = String(body.nicho || "").trim();
  const cidade = String(body.cidade || "").trim();
  const soComTelefone = body.soComTelefone !== false;
  const excluirContatados = body.excluirContatados === true;
  const excluirRecontato = body.excluirRecontato === true;

  if (!nichoSlug) return NextResponse.json({ erro: "Informe o nicho." }, { status: 400 });
  if (!cidade) return NextResponse.json({ erro: "Informe a cidade." }, { status: 400 });

  const config = await lerConfig();
  const nicho = config.nichos.find((n) => n.slug === nichoSlug);
  if (!nicho) return NextResponse.json({ erro: "Nicho não cadastrado nas configurações." }, { status: 400 });

  let lugares: LugarEncontrado[] = [];
  let erroBusca: string | null = null;
  let paginasUsadas = 0;
  try {
    const r = await buscarGoogle({
      chave: chaveApiEfetiva(config),
      endpoint: config.api.endpoint_busca,
      nicho,
      cidade,
      paginas: 3,
      pageSize: 20,
    });
    lugares = r.lugares;
    paginasUsadas = r.paginas;
  } catch (e) {
    erroBusca = e instanceof Error ? e.message : "Falha na busca.";
  }

  if (erroBusca) {
    return NextResponse.json(
      { ok: false, erro: erroBusca, resultados: [], total: 0 },
      { status: 502 },
    );
  }

  // Consumo da cota mensal (conta as requisições efetivamente feitas à Google)
  const uso = await registrarBusca(Math.max(1, paginasUsadas)).catch(() => null);

  // Filtro: apenas celulares brasileiros (após o DDD, o primeiro dígito é 9)
  if (soComTelefone) {
    lugares = lugares.filter((l) => ehCelularBr(l.telefone));
  }

  // Remove números repetidos (mesmo telefone pode vir de filiais/endereços diferentes)
  const vistos = new Set<string>();
  lugares = lugares.filter((l) => {
    const tel = normalizarTelefone(l.telefone);
    if (!tel) return true;
    if (vistos.has(tel)) return false;
    vistos.add(tel);
    return true;
  });

  // Carrega leads existentes por telefone
  const telefones = lugares.map((l) => normalizarTelefone(l.telefone)).filter(Boolean);
  const existentes = await listarLeadsPorTelefones(telefones);

  const periodoMs = config.periodo_recontato_dias * 86400_000;
  const agora = Date.now();

  const resultados = lugares.map((l) => {
    const telNorm = normalizarTelefone(l.telefone);
    const existente = telNorm ? existentes.get(telNorm) : null;
    const contatadoRecentemente =
      existente?.data_ultimo_contato &&
      agora - new Date(existente.data_ultimo_contato).getTime() < periodoMs;
    const statusAtual = existente?.status || "novo";
    return {
      ...l,
      telefone_normalizado: telNorm,
      lead_id: existente?.id || null,
      status: statusAtual,
      ja_contatado: Boolean(existente),
      contatado_recentemente: Boolean(contatadoRecentemente),
    };
  });

  let filtrados = resultados;
  if (excluirContatados) {
    filtrados = filtrados.filter((r) => !r.ja_contatado);
  }
  if (excluirRecontato) {
    filtrados = filtrados.filter((r) => !r.contatado_recentemente);
  }

  // Guarda a busca para o painel restaurar sem gastar cota (localStorage + R2)
  await gravarUltimaBusca({
    em: new Date().toISOString(),
    nicho: nichoSlug,
    cidade,
    filtros: { soComTelefone, soNovos: excluirContatados, naoContatados: excluirRecontato },
    totalBruto: resultados.length,
    resultados: filtrados,
  }).catch(() => {
    /* a busca não falha se o backup não puder ser gravado */
  });

  return NextResponse.json({
    ok: true,
    resultados: filtrados,
    total: filtrados.length,
    total_bruto: resultados.length,
    hoje: hojeIso(),
    uso,
  });
}
