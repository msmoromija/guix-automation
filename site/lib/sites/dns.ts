/**
 * Fachada de DNS agnóstica de provedor.
 * Descobre onde o domínio realmente vive (Vercel DNS ou Cloudflare) e roteia
 * leitura/escrita de registros para o provedor correto.
 */
import {
  cloudflareDnsConfigurado,
  cloudflareZonaCorrespondeAoDominio,
  gravarRegistroDns as gravarCloudflare,
  listarRegistrosDns as listarCloudflare,
} from "./cloudflare-dns";
import {
  gravarRegistroDnsVercel,
  listarRegistrosDnsVercel,
  vercelDnsConfigurado,
  vercelZonaCorrespondeAoDominio,
} from "./vercel-dns";

export type ZonaDns =
  | { ok: true; provedor: "vercel" | "cloudflare"; zona: string; zoneId?: string }
  | { ok: false; aviso: string };

export function dnsConfigurado() {
  return cloudflareDnsConfigurado() || vercelDnsConfigurado();
}

/** Localiza a zona autorizada que contém o nome, priorizando o Vercel DNS quando aplicável. */
export async function descobrirZonaDns(dominio: string): Promise<ZonaDns> {
  const alvo = dominio.toLowerCase().replace(/\.$/, "");
  if (vercelDnsConfigurado()) {
    const vercel = await vercelZonaCorrespondeAoDominio(alvo);
    if (vercel.ok) return { ok: true, provedor: "vercel", zona: vercel.zona };
  }
  if (cloudflareDnsConfigurado()) {
    const cloudflare = await cloudflareZonaCorrespondeAoDominio(alvo);
    if (cloudflare.ok) return { ok: true, provedor: "cloudflare", zona: cloudflare.zona, zoneId: cloudflare.zoneId };
    return { ok: false, aviso: cloudflare.aviso || "Zona DNS não encontrada." };
  }
  return { ok: false, aviso: "Nenhum provedor de DNS autorizado (Vercel ou Cloudflare) está configurado." };
}

export async function gravarRegistroDnsGenerico(opts: {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  content: string;
  zona?: ZonaDns;
  priority?: number;
  ttl?: number;
}): Promise<{ ok: boolean; acao?: string; aviso?: string }> {
  const zona = opts.zona && opts.zona.ok ? opts.zona : await descobrirZonaDns(opts.name);
  if (!zona.ok) return { ok: false, aviso: zona.aviso };
  if (zona.provedor === "vercel") {
    return gravarRegistroDnsVercel({
      type: opts.type,
      name: opts.name,
      content: opts.content,
      zona: zona.zona,
      priority: opts.priority,
      ttl: opts.ttl,
    });
  }
  return gravarCloudflare({
    type: opts.type,
    name: opts.name,
    content: opts.content,
    zoneId: zona.zoneId,
    priority: opts.priority,
    ttl: opts.ttl,
  });
}

export async function listarRegistrosDnsGenerico(opts: {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  zona?: ZonaDns;
}): Promise<{ ok: boolean; registros: { id: string; content: string; priority?: number }[]; aviso?: string }> {
  const zona = opts.zona && opts.zona.ok ? opts.zona : await descobrirZonaDns(opts.name);
  if (!zona.ok) return { ok: false, registros: [], aviso: zona.aviso };
  if (zona.provedor === "vercel") {
    return listarRegistrosDnsVercel({ type: opts.type, name: opts.name, zona: zona.zona });
  }
  return listarCloudflare({ type: opts.type, name: opts.name, zoneId: zona.zoneId });
}
