import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import {
  chaveApiEfetiva,
  enviosHoje,
  gravarConfig,
  lerConfig,
  lerContadores,
  lerUso,
  listarLeads,
} from "@/lib/prospeccao/store";
import type { ConfigProspecção } from "@/lib/prospeccao/tipos";

export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.nextUrl.searchParams.get("senha") || req.nextUrl.searchParams.get("token") || "";
  const x = req.headers.get("x-painel-token") || "";
  return senhaComercialConfere(bearer) || senhaComercialConfere(q) || senhaComercialConfere(x);
}

/**
 * GET /api/painel/prospeccao?token=...
 * Retorna configuração, leads e contadores diários.
 */
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const [config, leads, contadores, uso] = await Promise.all([
    lerConfig(),
    listarLeads(500),
    lerContadores(),
    lerUso(),
  ]);

  const contasComContagem = config.contas.map((c) => ({
    ...c,
    enviados_hoje: enviosHoje(contadores, c.id),
  }));

  // Não devolve a chave da API em texto puro para o cliente
  const configPublica = {
    ...config,
    api: { ...config.api, chave: chaveApiEfetiva(config) ? "••••••••" : "" },
  };

  return NextResponse.json({
    ok: true,
    leads,
    config: configPublica,
    contas: contasComContagem,
    contadores,
    uso,
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

  const cfg: ConfigProspecção = {
    ...atual,
    api,
    contas: Array.isArray(body.contas) ? body.contas : atual.contas,
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
  return NextResponse.json({ ok: true, config: salva });
}
