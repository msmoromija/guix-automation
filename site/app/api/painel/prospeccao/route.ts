import { NextRequest, NextResponse } from "next/server";
import { senhaComercialConfere } from "@/lib/cupons/auth";
import {
  chaveApiEfetiva,
  contaPublica,
  contarEnviosHoje,
  gravarConfig,
  lerConfig,
  lerUso,
  listarEnvios,
  listarLeads,
  listarMensagens,
  listarSessoesBusca,
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

/**
 * GET /api/painel/prospeccao?token=...
 * Retorna configuração, leads, contadores diários, log de envios e a última busca.
 */
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const [config, leads, envios, uso, sessoesBusca, mensagens] = await Promise.all([
    lerConfig(),
    listarLeads(500),
    listarEnvios(200),
    lerUso(),
    listarSessoesBusca(),
    listarMensagens(200),
  ]);

  // Contadores diários derivados do log de envios (fonte única da verdade).
  // Os tokens das contas nunca saem daqui (contaPublica remove).
  const contasComContagem = config.contas.map((c) => ({
    ...contaPublica(c),
    enviados_hoje: contarEnviosHoje(envios, c.id),
  }));

  // Não devolve a chave da API em texto puro para o cliente
  const configPublica = {
    ...config,
    api: { ...config.api, chave: chaveApiEfetiva(config) ? "••••••••" : "" },
    contas: config.contas.map(contaPublica),
  };

  return NextResponse.json({
    ok: true,
    leads,
    config: configPublica,
    contas: contasComContagem,
    envios,
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
