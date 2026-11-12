/**
 * DNS + e-mail routing via Cloudflare.
 * Usa CF_API_TOKEN (Zone.DNS Edit + opcional Email Routing).
 * Descobre a zona pelo domínio usando o token com Zone Read + DNS Edit.
 */
import { resolveTxt } from "dns/promises";
import { mesclarSpf } from "./spf";

export type ResultadoDns = {
  ok: boolean;
  registros: string[];
  passos: string[];
  avisos: string[];
};

function token() {
  return (process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "").trim();
}

export function cloudflareDnsConfigurado() {
  return Boolean(token());
}

export async function txtPublicoPresente(nome: string, valor: string) {
  try {
    const registros = await resolveTxt(nome);
    return registros.some((partes) => partes.join("").trim() === valor);
  } catch {
    return false;
  }
}

/** Localiza a zona ativa mais específica que contém o domínio. */
export async function cloudflareZonaCorrespondeAoDominio(dominio: string) {
  const alvo = dominio.toLowerCase().replace(/\.$/, "");
  if (!token()) return { ok: false, aviso: "CF_API_TOKEN ausente.", zona: "", zoneId: "" };

  const partes = alvo.split(".");
  for (let i = 0; i < partes.length - 1; i += 1) {
    const candidato = partes.slice(i).join(".");
    if (candidato.split(".").some((parte) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(parte))) continue;

    const resposta = await cf(`/zones?name=${encodeURIComponent(candidato)}&per_page=50`);
    if (!resposta.ok) {
      return {
        ok: false,
        aviso: `Cloudflare não permitiu buscar zonas para ${candidato} (HTTP ${resposta.status}). Verifique Zone Read e DNS Edit no token.`,
        zona: "",
        zoneId: "",
      };
    }
    const json = (await resposta.json()) as {
      result?: { id?: string; name?: string; status?: string }[];
    };
    const zona = json.result?.find((item) => item.name?.toLowerCase().replace(/\.$/, "") === candidato);
    if (!zona) continue;
    if (!zona.id || zona.status !== "active") {
      return {
        ok: false,
        aviso: `A zona Cloudflare ${candidato} existe, mas não está ativa ou não retornou um Zone ID.`,
        zona: candidato,
        zoneId: "",
      };
    }
    return { ok: true, zona: candidato, zoneId: zona.id };
  }
  return {
    ok: false,
    aviso: `Nenhuma zona ativa para ${alvo} foi encontrada na conta Cloudflare autorizada.`,
    zona: "",
    zoneId: "",
  };
}

async function cf(path: string, init?: RequestInit) {
  const t = token();
  if (!t) throw new Error("CF_API_TOKEN ausente");
  return fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

/** CNAME apex/www → Vercel (cname.vercel-dns.com). */
export async function provisionarDnsVercel(opts: {
  dominio: string;
  /** Default cname.vercel-dns.com */
  alvo?: string;
}): Promise<ResultadoDns> {
  const passos: string[] = [];
  const avisos: string[] = [];
  const registros: string[] = [];
  if (!token()) {
    return {
      ok: false,
      registros,
      passos,
      avisos: ["CF_API_TOKEN ausente."],
    };
  }

  const dominio = opts.dominio.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const zona = await cloudflareZonaCorrespondeAoDominio(dominio);
  if (!zona.ok) return { ok: false, registros, passos, avisos: [zona.aviso || "Zona Cloudflare não encontrada."] };
  const zid = zona.zoneId;
  const alvo = opts.alvo || "cname.vercel-dns.com";
  const nomes = [dominio, dominio.startsWith("www.") ? dominio : `www.${dominio}`];

  for (const name of [...new Set(nomes)]) {
    // lista existentes
    const list = await cf(
      `/zones/${zid}/dns_records?type=CNAME&name=${encodeURIComponent(name)}`,
    );
    if (!list.ok) {
      avisos.push(`list ${name}: HTTP ${list.status}`);
      continue;
    }
    const data = (await list.json()) as { result?: { id: string; content: string }[] };
    const existing = data.result?.[0];
    if (existing) {
      const up = await cf(`/zones/${zid}/dns_records/${existing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          type: "CNAME",
          name,
          content: alvo,
          ttl: 1,
          proxied: false,
        }),
      });
      if (up.ok) {
        passos.push(`dns:update:${name}`);
        registros.push(`${name} → ${alvo}`);
      } else {
        avisos.push(`update ${name}: ${(await up.text()).slice(0, 120)}`);
      }
    } else {
      const cr = await cf(`/zones/${zid}/dns_records`, {
        method: "POST",
        body: JSON.stringify({
          type: "CNAME",
          name,
          content: alvo,
          ttl: 1,
          proxied: false,
        }),
      });
      if (cr.ok) {
        passos.push(`dns:create:${name}`);
        registros.push(`${name} → ${alvo}`);
      } else {
        avisos.push(`create ${name}: ${(await cr.text()).slice(0, 120)}`);
      }
    }
  }

  return { ok: registros.length > 0, registros, passos, avisos };
}

/**
 * Tenta habilitar Email Routing (catch-all → caixa GuiX ops).
 * Se a API não permitir, só registra aviso — mailbox profissional completo
 * (Google/Zoho/Microsoft) continua manual.
 */
export async function provisionarEmailRouting(opts: {
  dominio: string;
  destino: string;
}): Promise<ResultadoDns> {
  const passos: string[] = [];
  const avisos: string[] = [];
  const registros: string[] = [];
  if (!token()) {
    return {
      ok: false,
      registros,
      passos,
      avisos: ["CF_API_TOKEN ausente — e-mail profissional fica manual (Zoho/Google)."],
    };
  }
  const zona = await cloudflareZonaCorrespondeAoDominio(opts.dominio);
  if (!zona.ok) return { ok: false, registros, passos, avisos: [zona.aviso || "Zona Cloudflare não encontrada."] };
  const zid = zona.zoneId;

  const enable = await cf(`/zones/${zid}/email/routing/enable`, { method: "POST", body: "{}" });
  if (!enable.ok) {
    avisos.push(
      `Email Routing não habilitado via API (${enable.status}). Configure MX no painel Cloudflare ou provedor (Zoho/Google).`,
    );
    return { ok: false, registros, passos, avisos };
  }
  passos.push("email:routing_enable");

  const rule = await cf(`/zones/${zid}/email/routing/rules`, {
    method: "POST",
    body: JSON.stringify({
      name: `guix-catchall-${opts.dominio}`,
      enabled: true,
      matchers: [{ type: "all" }],
      actions: [{ type: "forward", value: [opts.destino] }],
    }),
  });
  if (rule.ok) {
    passos.push("email:catchall_forward");
    registros.push(`*@${opts.dominio} → ${opts.destino}`);
  } else {
    avisos.push(`regra e-mail: ${(await rule.text()).slice(0, 160)}`);
  }

  return { ok: passos.includes("email:catchall_forward"), registros, passos, avisos };
}

/**
 * Cria ou atualiza um registro DNS na zona do Cloudflare (TXT/MX/CNAME).
 * Descobre a zona pelo nome do registro, a menos que zoneId seja fornecido.
 */
export async function gravarRegistroDns(opts: {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  content: string;
  zoneId?: string;
  priority?: number;
  ttl?: number;
  proxied?: boolean;
}): Promise<{ ok: boolean; acao?: string; aviso?: string }> {
  let zid = opts.zoneId;
  if (!zid) {
    const descoberta = await cloudflareZonaCorrespondeAoDominio(opts.name);
    if (!descoberta.ok) return { ok: false, aviso: descoberta.aviso };
    zid = descoberta.zoneId;
  }
  if (!token() || !zid) return { ok: false, aviso: "CF_API_TOKEN ou uma zona Cloudflare correspondente são necessários." };

  const list = await cf(
    `/zones/${zid}/dns_records?type=${opts.type}&name=${encodeURIComponent(opts.name)}`,
  );
  if (!list.ok) return { ok: false, aviso: `list ${opts.name}: HTTP ${list.status}` };
  const data = (await list.json()) as { result?: { id: string; content: string }[] };
  const registros = data.result || [];
  if (opts.type === "TXT" && opts.content.trim().toLowerCase().startsWith("v=spf1")) {
    const existentesSpf = registros.filter((r) => r.content.trim().toLowerCase().startsWith("v=spf1"));
    if (existentesSpf.length > 1) {
      return { ok: false, aviso: `Há ${existentesSpf.length} registros SPF em ${opts.name}; corrigir a duplicidade antes de continuar.` };
    }
    if (existentesSpf.length === 1) {
      const existenteSpf = existentesSpf[0];
      const combinado = mesclarSpf(existenteSpf.content, opts.content);
      if (combinado === existenteSpf.content.trim()) return { ok: true, acao: "unchanged" };
      const corpo = { type: "TXT", name: opts.name, content: combinado, ttl: opts.ttl ?? 1 };
      const up = await cf(`/zones/${zid}/dns_records/${existenteSpf.id}`, {
        method: "PUT",
        body: JSON.stringify(corpo),
      });
      return up.ok
        ? { ok: true, acao: "spf-merged" }
        : { ok: false, aviso: `update SPF ${opts.name} HTTP ${up.status}: ${(await up.text()).slice(0, 140)}` };
    }
  }
  const existente = registros.find((r) => {
    if (opts.type === "MX") {
      return r.content.replace(/\.$/, "").toLowerCase() === opts.content.replace(/\.$/, "").toLowerCase();
    }
    return r.content === opts.content;
  });

  const corpo: Record<string, unknown> = {
    type: opts.type,
    name: opts.name,
    content: opts.content,
    ttl: opts.ttl ?? 1,
  };
  if (opts.type === "MX") corpo.priority = opts.priority ?? 10;
  if (opts.type === "CNAME") corpo.proxied = opts.proxied ?? false;

  if (existente) {
    const up = await cf(`/zones/${zid}/dns_records/${existente.id}`, {
      method: "PUT",
      body: JSON.stringify(corpo),
    });
    if (up.ok) return { ok: true, acao: "update" };
    return { ok: false, aviso: `update ${opts.name} HTTP ${up.status}: ${(await up.text()).slice(0, 140)}` };
  }

  const cr = await cf(`/zones/${zid}/dns_records`, { method: "POST", body: JSON.stringify(corpo) });
  if (cr.ok) return { ok: true, acao: "create" };
  return { ok: false, aviso: `create ${opts.name} HTTP ${cr.status}: ${(await cr.text()).slice(0, 140)}` };
}

export async function listarRegistrosDns(opts: {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  zoneId?: string;
}): Promise<{ ok: boolean; registros: { id: string; content: string; priority?: number }[]; aviso?: string }> {
  let zid = opts.zoneId;
  if (!zid) {
    const descoberta = await cloudflareZonaCorrespondeAoDominio(opts.name);
    if (!descoberta.ok) return { ok: false, registros: [], aviso: descoberta.aviso };
    zid = descoberta.zoneId;
  }
  const resposta = await cf(
    `/zones/${zid}/dns_records?type=${opts.type}&name=${encodeURIComponent(opts.name)}&per_page=100`,
  );
  if (!resposta.ok) {
    return { ok: false, registros: [], aviso: `list ${opts.name}: HTTP ${resposta.status}` };
  }
  const json = (await resposta.json()) as {
    result?: { id: string; content: string; priority?: number }[];
  };
  return { ok: true, registros: json.result || [] };
}
