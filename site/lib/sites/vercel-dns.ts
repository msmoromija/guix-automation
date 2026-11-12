/**
 * DNS via Vercel (domains records API).
 * Requer VERCEL_TOKEN; quando o domínio pertence a um team, VERCEL_TEAM_ID (ou o Team
 * resolvido automaticamente pelo helper `vercelFetch`).
 * Endpoints: GET /v5/domains/{zona}/records · POST /v2/domains/{zona}/records
 *            PATCH /v1/domains/records/{id}
 */
import { vercelFetch } from "./vercel-api";
import { mesclarSpf } from "./spf";

type RegistroVercel = {
  id: string | number;
  name?: string;
  type?: string;
  value: string;
  ttl?: number;
  mxPriority?: number;
  priority?: number;
};

export function vercelDnsConfigurado() {
  return Boolean((process.env.VERCEL_TOKEN || "").trim());
}

/** Converte um nome absoluto (ex.: _vercel.cliente.com) em relativo ao apex (ex.: _vercel). */
function nomeRelativo(name: string, zona: string) {
  const alvo = name.toLowerCase().replace(/\.$/, "");
  const apex = zona.toLowerCase().replace(/\.$/, "");
  if (alvo === apex) return "";
  if (alvo.endsWith(`.${apex}`)) return alvo.slice(0, -(apex.length + 1));
  return alvo;
}

/**
 * Zona (apex) gerenciada pelo Vercel DNS que contém o nome informado.
 * Considera apenas domínios com serviceType "zeit.world" (DNS hospedado na Vercel).
 */
export async function vercelZonaCorrespondeAoDominio(
  nome: string,
): Promise<{ ok: boolean; zona: string; aviso?: string }> {
  if (!vercelDnsConfigurado()) return { ok: false, zona: "", aviso: "VERCEL_TOKEN ausente." };
  const alvo = nome.toLowerCase().replace(/\.$/, "");

  let resposta: Response;
  try {
    resposta = await vercelFetch("/v5/domains?limit=100");
  } catch (erro) {
    return { ok: false, zona: "", aviso: erro instanceof Error ? erro.message : "Falha ao consultar a Vercel." };
  }
  if (!resposta.ok) {
    return {
      ok: false,
      zona: "",
      aviso: `A Vercel não permitiu listar os domínios (HTTP ${resposta.status}). Confira o VERCEL_TOKEN e o VERCEL_TEAM_ID.`,
    };
  }

  const json = (await resposta.json().catch(() => ({}))) as {
    domains?: { name?: string; serviceType?: string }[];
  };
  const zona = (json.domains || [])
    .filter((item) => item.name && item.serviceType === "zeit.world")
    .map((item) => item.name!.toLowerCase())
    .filter((item) => alvo === item || alvo.endsWith(`.${item}`))
    .sort((a, b) => b.length - a.length)[0];

  if (!zona) return { ok: false, zona: "", aviso: `Nenhuma zona no Vercel DNS para ${alvo}.` };
  return { ok: true, zona };
}

async function listarTodos(zona: string): Promise<{ ok: boolean; registros: RegistroVercel[]; aviso?: string }> {
  const resposta = await vercelFetch(`/v5/domains/${encodeURIComponent(zona)}/records?limit=100`);
  if (!resposta.ok) {
    return { ok: false, registros: [], aviso: `list ${zona}: HTTP ${resposta.status}` };
  }
  const json = (await resposta.json().catch(() => ({}))) as { records?: RegistroVercel[] };
  return { ok: true, registros: json.records || [] };
}

export async function listarRegistrosDnsVercel(opts: {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  zona: string;
}): Promise<{ ok: boolean; registros: { id: string; content: string; priority?: number }[]; aviso?: string }> {
  const rel = nomeRelativo(opts.name, opts.zona);
  const todos = await listarTodos(opts.zona);
  if (!todos.ok) return { ok: false, registros: [], aviso: todos.aviso };
  const registros = todos.registros
    .filter((registro) => registro.type?.toUpperCase() === opts.type && (registro.name || "") === rel)
    .map((registro) => ({
      id: String(registro.id),
      content: registro.value,
      priority: registro.mxPriority ?? registro.priority,
    }));
  return { ok: true, registros };
}

export async function gravarRegistroDnsVercel(opts: {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  content: string;
  zona: string;
  priority?: number;
  ttl?: number;
}): Promise<{ ok: boolean; acao?: string; aviso?: string }> {
  const rel = nomeRelativo(opts.name, opts.zona);
  const todos = await listarTodos(opts.zona);
  if (!todos.ok) return { ok: false, aviso: todos.aviso };
  const doTipo = todos.registros.filter(
    (registro) => registro.type?.toUpperCase() === opts.type && (registro.name || "") === rel,
  );
  const ttl = opts.ttl && opts.ttl >= 60 ? opts.ttl : 60;

  if (opts.type === "TXT" && opts.content.trim().toLowerCase().startsWith("v=spf1")) {
    const spfs = doTipo.filter((registro) => registro.value.trim().toLowerCase().startsWith("v=spf1"));
    if (spfs.length > 1) {
      return {
        ok: false,
        aviso: `Há ${spfs.length} registros SPF em ${opts.name}; corrija a duplicidade antes de continuar.`,
      };
    }
    if (spfs.length === 1) {
      const existenteSpf = spfs[0];
      const combinado = mesclarSpf(existenteSpf.value, opts.content);
      if (combinado === existenteSpf.value.trim()) return { ok: true, acao: "unchanged" };
      const up = await vercelFetch(`/v1/domains/records/${encodeURIComponent(String(existenteSpf.id))}`, {
        method: "PATCH",
        body: JSON.stringify({ value: combinado, ttl }),
      });
      return up.ok
        ? { ok: true, acao: "spf-merged" }
        : { ok: false, aviso: `update SPF ${opts.name} HTTP ${up.status}: ${(await up.text()).slice(0, 140)}` };
    }
  }

  const existente = doTipo.find((registro) =>
    opts.type === "MX"
      ? registro.value.replace(/\.$/, "").toLowerCase() === opts.content.replace(/\.$/, "").toLowerCase()
      : registro.value === opts.content,
  );

  const corpo: Record<string, unknown> = { value: opts.content, ttl };
  if (opts.type === "MX") corpo.mxPriority = opts.priority ?? 10;

  if (existente) {
    const up = await vercelFetch(`/v1/domains/records/${encodeURIComponent(String(existente.id))}`, {
      method: "PATCH",
      body: JSON.stringify(corpo),
    });
    if (up.ok) return { ok: true, acao: "update" };
    return { ok: false, aviso: `update ${opts.name} HTTP ${up.status}: ${(await up.text()).slice(0, 140)}` };
  }

  const cr = await vercelFetch(`/v2/domains/${encodeURIComponent(opts.zona)}/records`, {
    method: "POST",
    body: JSON.stringify({ type: opts.type, name: rel, ...corpo }),
  });
  if (cr.ok) return { ok: true, acao: "create" };
  return { ok: false, aviso: `create ${opts.name} HTTP ${cr.status}: ${(await cr.text()).slice(0, 140)}` };
}
