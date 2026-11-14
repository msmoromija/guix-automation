import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import {
  buscarGoogle,
  ehCelularBr,
  extrairEmailDoSite,
  type LugarEncontrado,
} from "@/lib/prospeccao/buscar";
import {
  buscarSessaoBusca,
  chaveApiEfetiva,
  hojeIso,
  idsJaExibidos,
  lerConfig,
  listarLeadsPorTelefones,
  normalizarTelefone,
  novoIdLead,
  registrarBusca,
  registrarExecucaoBusca,
  resultadosDaExecucao,
  salvarLeads,
} from "@/lib/prospeccao/store";
import type { Lead, ResultadoBusca } from "@/lib/prospeccao/tipos";

export const runtime = "nodejs";

/** Quantos sites são consultados em paralelo ao procurar o e-mail. */
const CONCORRENCIA_EMAIL = 8;

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

/** Procura o e-mail de contato nos sites, em lotes, sem derrubar a busca. */
async function buscarEmails(lugares: LugarEncontrado[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const comSite = lugares.filter((l) => l.site);
  if (!comSite.length) return mapa;
  for (let i = 0; i < comSite.length; i += CONCORRENCIA_EMAIL) {
    const lote = comSite.slice(i, i + CONCORRENCIA_EMAIL);
    const achados = await Promise.all(
      lote.map(async (l) => ({
        id: l.external_id,
        email: await extrairEmailDoSite(l.site as string).catch(() => null),
      })),
    );
    for (const a of achados) if (a.email) mapa.set(a.id, a.email);
  }
  return mapa;
}

/**
 * GET /api/painel/prospeccao/buscar?execucao=<id>
 *
 * Reabre uma "Busca N" do histórico. Carrega os resultados arquivados daquela
 * execução (que fica no banco) e recalcula o status ATUAL de cada lead — sem
 * gastar cota da Google. É o que permite ter milhares de buscas sem baixar
 * tudo de uma vez no painel.
 */
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const execucaoId = (req.nextUrl.searchParams.get("execucao") || "").trim();
  if (!execucaoId) {
    return NextResponse.json({ erro: "Informe ?execucao=<id>." }, { status: 400 });
  }

  const { execucao, nicho, cidade, resultados } = await resultadosDaExecucao(execucaoId);
  if (!execucao) {
    return NextResponse.json({ erro: "Busca não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    execucao,
    nicho,
    cidade,
    resultados,
    total: resultados.length,
  });
}

/**
 * POST /api/painel/prospeccao/buscar
 * body: { nicho: string, cidade: string, soComTelefone?: boolean, excluirContatados?: boolean, excluirRecontato?: boolean }
 *
 * Paginação por cidade: repetir a mesma busca (nicho+cidade) devolve os
 * PRÓXIMOS resultados — os já exibidos em buscas anteriores ficam de fora e
 * cada execução é registrada como "Busca 1", "Busca 2"… no histórico.
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

  // Sessão anterior deste par nicho+cidade — define o número da busca, o
  // termo usado (varia a cada execução) e o que já foi exibido.
  const sessaoAnterior = await buscarSessaoBusca(nichoSlug, cidade);
  const numeroBusca = (sessaoAnterior?.buscas.length || 0) + 1;
  const termos = nicho.termos_busca.length ? nicho.termos_busca : [nicho.nome];
  const termo = termos[(numeroBusca - 1) % termos.length];
  const jaExibidos = await idsJaExibidos(nichoSlug, cidade);

  let lugares: LugarEncontrado[] = [];
  let erroBusca: string | null = null;
  let paginasUsadas = 0;
  try {
    const r = await buscarGoogle({
      chave: chaveApiEfetiva(config),
      endpoint: config.api.endpoint_busca,
      nicho,
      cidade,
      termo,
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

  const totalEncontrado = lugares.length;

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

  // Paginação por cidade: descarta o que já apareceu em buscas anteriores.
  const repetidos = lugares.filter((l) => jaExibidos.has(l.external_id)).length;
  lugares = lugares.filter((l) => !jaExibidos.has(l.external_id));

  // Carrega leads existentes por telefone
  const telefones = lugares.map((l) => normalizarTelefone(l.telefone)).filter(Boolean);
  const existentes = await listarLeadsPorTelefones(telefones);

  // E-mail de contato: só consulta o site quando ainda não temos o dado salvo.
  const faltandoEmail = lugares.filter((l) => {
    const existente = existentes.get(normalizarTelefone(l.telefone));
    return l.site && !existente?.email;
  });
  const emails = await buscarEmails(faltandoEmail).catch(() => new Map<string, string>());

  const periodoMs = config.periodo_recontato_dias * 86400_000;
  const agora = Date.now();

  const resultados: ResultadoBusca[] = lugares.map((l) => {
    const telNorm = normalizarTelefone(l.telefone);
    const existente = telNorm ? existentes.get(telNorm) : null;
    const contatadoRecentemente =
      existente?.data_ultimo_contato &&
      agora - new Date(existente.data_ultimo_contato).getTime() < periodoMs;
    const statusAtual = existente?.status || "novo";
    // "Já contatado" = recebeu mensagem alguma vez. Como agora todo resultado da
    // busca é salvo como lead, o filtro "Só novos" precisa olhar o contato (e não
    // a mera existência do lead), senão esconderia tudo na segunda busca.
    const jaContatado = Boolean(
      existente?.data_ultimo_contato ||
        existente?.status === "enviado" ||
        existente?.status === "respondeu",
    );
    return {
      nome: l.nome,
      telefone: l.telefone,
      telefone_normalizado: telNorm,
      endereco: l.endereco,
      cidade: l.cidade || cidade,
      categoria: l.categoria,
      site: l.site || existente?.site || null,
      email: emails.get(l.external_id) || existente?.email || null,
      external_id: l.external_id,
      lead_id: existente?.id || null,
      status: statusAtual,
      ja_contatado: jaContatado,
      contatado_recentemente: Boolean(contatadoRecentemente),
      data_ultimo_contato: existente?.data_ultimo_contato || null,
      congelado: Boolean(existente?.congelado),
      arquivado: Boolean(existente?.arquivado),
    };
  });

  let filtrados = resultados;
  if (excluirContatados) {
    filtrados = filtrados.filter((r) => !r.ja_contatado);
  }
  if (excluirRecontato) {
    filtrados = filtrados.filter((r) => !r.contatado_recentemente);
  }

  // Persiste os resultados novos como leads (a dedup por telefone foi feita
  // acima). Assim eles ficam no Histórico de leads e não se perdem em novas
  // buscas — é a base para o envio manual e o acompanhamento das respostas.
  const agoraIso = new Date().toISOString();
  const novosLeads: Lead[] = resultados
    .filter((r) => !r.lead_id && r.telefone_normalizado)
    .map((r) => ({
      id: novoIdLead(),
      nome: r.nome,
      telefone: r.telefone,
      cidade: r.cidade || cidade,
      nicho: nichoSlug,
      endereco: r.endereco,
      categoria: r.categoria,
      site: r.site,
      email: r.email,
      status: "novo",
      data_ultimo_contato: null,
      conta_whatsapp: null,
      modelo_usado: nicho.modelo_url,
      mensagem_gerada: null,
      observacoes: "",
      congelado: false,
      arquivado: false,
      external_id: r.external_id,
      fonte: "google",
      created_at: agoraIso,
      updated_at: agoraIso,
    }));
  const leadsSalvos = await salvarLeads(novosLeads).catch(() => 0);

  // Registra a execução no histórico: "Busca N" com o que foi exibido agora
  // (ids exibidos = nunca mais voltam nas próximas buscas da mesma cidade).
  await registrarExecucaoBusca({
    nicho: nichoSlug,
    cidade,
    termo,
    filtros: { soComTelefone, soNovos: excluirContatados, naoContatados: excluirRecontato },
    totalBruto: totalEncontrado,
    ids: filtrados.map((r) => r.external_id),
    resultados: filtrados,
  }).catch(() => {
    /* a busca não falha se o histórico não puder ser gravado */
  });

  const numero = numeroBusca;
  const esgotado = filtrados.length === 0 && repetidos > 0;
  const aviso = esgotado
    ? `Todos os resultados desta cidade já foram exibidos nas buscas anteriores (Busca ${numero}). Tente outra cidade ou outro nicho.`
    : filtrados.length === 0
      ? "Nenhum resultado novo para este termo nesta cidade."
      : null;

  return NextResponse.json({
    ok: true,
    resultados: filtrados,
    total: filtrados.length,
    total_bruto: totalEncontrado,
    repetidos,
    busca: { numero, termo, total_bruto: totalEncontrado },
    aviso,
    leads_salvos: leadsSalvos,
    hoje: hojeIso(),
    uso,
  });
}
