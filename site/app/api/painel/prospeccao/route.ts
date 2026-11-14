import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import {
  chaveApiEfetiva,
  cidadesDeEnvios,
  cidadesDeLeads,
  contaPublica,
  contarEnvios,
  contarEnviosHojeConta,
  contarLeads,
  contarLeadsOcultos,
  gravarConfig,
  lerConfig,
  lerUso,
  listarEnviosPainel,
  listarLeadsPainel,
  listarMensagens,
  listarSessoesBusca,
  type FiltrosEnvios,
  type FiltrosLeads,
} from "@/lib/prospeccao/store";
import { embeddedSignupConfigurado, metaAppId, metaConfigId, metaConfigurado } from "@/lib/prospeccao/whatsapp";
import type { ConfigProspecção, ContaWhatsApp } from "@/lib/prospeccao/tipos";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

/** Lê um inteiro da query, dentro dos limites [min, max]. */
function numeroQuery(valor: string | null, padrao: number, min: number, max: number): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/**
 * GET /api/painel/prospeccao?token=...
 *
 * O histórico de leads e o de envios são paginados/filtrados no SERVIDOR
 * (query no banco) — assim o painel continua leve mesmo com milhares de buscas,
 * leads e envios. As sessões de busca vêm sem os resultados (carregados sob
 * demanda pela rota /busca) e com o total de leads de cada par nicho+cidade.
 *
 * Query (todas opcionais):
 *   leads_pagina, leads_por_pagina, leads_nicho, leads_cidade, leads_status,
 *   leads_texto, incluir_ocultos
 *   envios_pagina, envios_por_pagina, envios_nicho, envios_cidade
 */
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const t = (nome: string) => (p.get(nome) || "").trim();
  const incluirOcultos = p.get("incluir_ocultos") === "1" || p.get("incluir_ocultos") === "true";

  const filtrosLeads: FiltrosLeads = {
    nicho: t("leads_nicho") || undefined,
    cidade: t("leads_cidade") || undefined,
    status: t("leads_status") || undefined,
    texto: t("leads_texto") || undefined,
    incluirOcultos,
  };
  const leadsPorPagina = numeroQuery(p.get("leads_por_pagina"), 25, 1, 200);
  const leadsPagina = numeroQuery(p.get("leads_pagina"), 1, 1, 1_000_000);

  const filtrosEnvios: FiltrosEnvios = {
    nicho: t("envios_nicho") || undefined,
    cidade: t("envios_cidade") || undefined,
  };
  const enviosPorPagina = numeroQuery(p.get("envios_por_pagina"), 15, 1, 100);
  const enviosPagina = numeroQuery(p.get("envios_pagina"), 1, 1, 1_000_000);

  const [
    config,
    leads,
    leadsTotal,
    leadsOcultos,
    leadsCidades,
    envios,
    enviosTotal,
    enviosCidades,
    mensagens,
    sessoesBusca,
    uso,
  ] = await Promise.all([
    lerConfig(),
    listarLeadsPainel(filtrosLeads, leadsPorPagina, (leadsPagina - 1) * leadsPorPagina),
    contarLeads(filtrosLeads),
    contarLeadsOcultos(filtrosLeads),
    cidadesDeLeads(),
    listarEnviosPainel(filtrosEnvios, enviosPorPagina, (enviosPagina - 1) * enviosPorPagina),
    contarEnvios(filtrosEnvios),
    cidadesDeEnvios(),
    listarMensagens(200),
    listarSessoesBusca(),
    lerUso(),
  ]);

  // Contadores diários derivados do log de envios (fonte única da verdade).
  // Os tokens das contas nunca saem daqui (contaPublica remove).
  const contasComContagem = await Promise.all(
    config.contas.map(async (c) => ({
      ...contaPublica(c),
      enviados_hoje: await contarEnviosHojeConta(c.id),
    })),
  );

  // Não devolve a chave da API em texto puro para o cliente
  const configPublica = {
    ...config,
    api: { ...config.api, chave: chaveApiEfetiva(config) ? "••••••••" : "" },
    contas: config.contas.map(contaPublica),
  };

  return NextResponse.json({
    ok: true,
    leads,
    leads_total: leadsTotal,
    leads_ocultos: leadsOcultos,
    leads_cidades: leadsCidades,
    config: configPublica,
    contas: contasComContagem,
    envios,
    envios_total: enviosTotal,
    envios_cidades: enviosCidades,
    mensagens,
    sessoes_busca: sessoesBusca,
    uso,
    // Prontidão da integração Meta (app_id/config_id são públicos; o secret não).
    meta: {
      configurado: metaConfigurado(),
      embedded_signup: embeddedSignupConfigurado(),
      app_id: metaAppId(),
      config_id: metaConfigId(),
    },
    hoje: new Date().toISOString(),
  });
}

/**
 * PATCH /api/painel/prospeccao — atualiza configuração.
 */
export async function PATCH(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const atual = await lerConfig();

  const api = { ...atual.api };
  if (typeof body.api === "object" && body.api) {
    if (typeof body.api.provedor === "string") api.provedor = body.api.provedor;
    if (typeof body.api.endpoint_busca === "string") api.endpoint_busca = body.api.endpoint_busca;
    if (typeof body.api.endpoint_detalhes === "string") api.endpoint_detalhes = body.api.endpoint_detalhes;
    // Só atualiza a chave se não for o placeholder; permite limpar enviando ""
    if (typeof body.api.chave === "string" && body.api.chave !== "••••••••") {
      api.chave = body.api.chave.trim();
    }
  }

  // Mescla as contas preservando campos de conexão/token que o cliente não envia.
  const contasEntrada: Partial<ContaWhatsApp>[] = Array.isArray(body.contas)
    ? body.contas
    : atual.contas;
  const contas: ContaWhatsApp[] = contasEntrada.map((c) => {
    const antiga = atual.contas.find((a) => a.id === c.id);
    const token = antiga?.token ?? null;
    const phone_number_id =
      c.phone_number_id !== undefined ? c.phone_number_id : antiga?.phone_number_id ?? null;
    return {
      id: String(c.id || ""),
      nome: String(c.nome || ""),
      limite_diario: Number(c.limite_diario),
      provedor: c.provedor ?? antiga?.provedor ?? "manual",
      phone_number_id,
      display_phone_number:
        c.display_phone_number !== undefined
          ? c.display_phone_number
          : antiga?.display_phone_number ?? null,
      waba_id: c.waba_id !== undefined ? c.waba_id : antiga?.waba_id ?? null,
      status_conexao:
        c.status_conexao ??
        antiga?.status_conexao ??
        (token && phone_number_id ? "conectada" : "desconectada"),
      conectada_em: c.conectada_em ?? antiga?.conectada_em ?? null,
      token,
    };
  });

  const cfg: ConfigProspecção = {
    ...atual,
    api,
    contas,
    nichos: Array.isArray(body.nichos) ? body.nichos : atual.nichos,
    templates: Array.isArray(body.templates) ? body.templates : atual.templates,
    template_ativo: typeof body.template_ativo === "string" ? body.template_ativo : atual.template_ativo,
    periodo_recontato_dias:
      typeof body.periodo_recontato_dias === "number"
        ? Math.max(1, Math.min(365, body.periodo_recontato_dias))
        : atual.periodo_recontato_dias,
    remetente:
      typeof body.remetente === "string" && body.remetente.trim()
        ? body.remetente.trim().slice(0, 80)
        : atual.remetente,
  };

  // Valida campos básicos
  if (!Array.isArray(cfg.contas) || cfg.contas.length === 0) {
    return NextResponse.json({ erro: "Cadastre pelo menos uma conta WhatsApp." }, { status: 400 });
  }
  for (const c of cfg.contas) {
    if (!c.id || !c.nome) {
      return NextResponse.json({ erro: "Conta sem id ou nome." }, { status: 400 });
    }
    if (!Number.isInteger(c.limite_diario) || c.limite_diario < 1 || c.limite_diario > 500) {
      return NextResponse.json({ erro: "Limite diário inválido (1–500)." }, { status: 400 });
    }
  }
  for (const n of cfg.nichos) {
    if (!n.slug || !n.nome || !n.modelo_url) {
      return NextResponse.json({ erro: "Nicho incompleto (slug, nome, modelo_url)." }, { status: 400 });
    }
  }

  const salva = await gravarConfig(cfg);
  return NextResponse.json({
    ok: true,
    config: {
      ...salva,
      api: { ...salva.api, chave: chaveApiEfetiva(salva) ? "••••••••" : "" },
      contas: salva.contas.map(contaPublica),
    },
  });
}
