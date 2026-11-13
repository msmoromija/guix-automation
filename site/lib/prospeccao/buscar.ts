import type { NichoProspecção } from "./tipos";

export type LugarEncontrado = {
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
  categoria: string;
  external_id: string;
  /** Site institucional informado pelo Google Places. */
  site?: string;
  latitude?: number;
  longitude?: number;
};

type GooglePlace = {
  id: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  primaryTypeDisplayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
};

/** Endpoint do Text Search da Places API (New). */
const GOOGLE_TEXT_SEARCH = "https://places.googleapis.com/v1/places:searchText";

/** Campos retornados pela API — reduz custo e payload. */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.primaryTypeDisplayName",
  "places.location",
  "places.addressComponents",
  "nextPageToken",
].join(",");

export function somenteDigitos(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

/**
 * Verifica se o telefone é um celular brasileiro.
 * Regra: após o DDD (2 dígitos), o primeiro dígito do número deve ser 9.
 * Aceita formatos com e sem o código do país (55).
 */
export function ehCelularBr(raw: string): boolean {
  let d = somenteDigitos(raw);
  // Remove o código do país (55) quando presente: 55 + DDD + número (12 ou 13 dígitos).
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return false;
  return d[2] === "9";
}

function extrairCidade(p: GooglePlace, fallback: string): string {
  const comps = p.addressComponents || [];
  const municipio = comps.find((c) => c.types?.includes("administrative_area_level_2"));
  const localidade = comps.find((c) => c.types?.includes("locality"));
  return municipio?.longText || localidade?.longText || fallback;
}

async function mensagemErroGoogle(res: Response): Promise<string> {
  const texto = await res.text().catch(() => "");
  let detalhe = texto.slice(0, 300);
  try {
    const j = JSON.parse(texto) as { error?: { message?: string } };
    if (j?.error?.message) detalhe = j.error.message;
  } catch {
    /* mantém o texto cru */
  }
  switch (res.status) {
    case 400:
      return `Google Places: requisição inválida. Verifique o termo de busca e a cidade (${detalhe}).`;
    case 401:
    case 403:
      return `Google Places: chave inválida, sem permissão ou API/cobrança não habilitada (${detalhe}).`;
    case 429:
      return `Google Places: cota de requisições excedida (${detalhe}). Aguarde ou aumente a cota no Google Cloud.`;
    default:
      return `Google Places ${res.status}: ${detalhe}`;
  }
}

/**
 * Busca lugares na Google Places API (New) — Text Search (Enterprise).
 * Pagina automaticamente até `paginas` páginas de `pageSize` (máx. 20) resultados.
 * Documentação: https://developers.google.com/maps/documentation/places/web-service/text-search
 */
export async function buscarGoogle(opts: {
  chave: string;
  endpoint?: string;
  nicho: NichoProspecção;
  cidade: string;
  /** Termo de busca específico (permite variar o termo a cada nova busca). */
  termo?: string;
  paginas?: number;
  pageSize?: number;
}): Promise<{ lugares: LugarEncontrado[]; paginas: number }> {
  const { chave, nicho, cidade, paginas = 3, pageSize = 20 } = opts;
  const endpoint = opts.endpoint?.trim() || GOOGLE_TEXT_SEARCH;
  if (!chave) throw new Error("API Key da Google Places não configurada.");

  const termo = opts.termo?.trim() || nicho.termos_busca[0] || nicho.nome;
  const textQuery = `${termo} em ${cidade}`;

  const encontrados = new Map<string, LugarEncontrado>();
  let pageToken: string | undefined = undefined;
  let paginasUsadas = 0;
  const maxPaginas = Math.max(1, Math.min(5, paginas));
  const tamanho = Math.max(1, Math.min(20, pageSize));

  for (let pagina = 0; pagina < maxPaginas; pagina++) {
    const corpo: Record<string, unknown> = {
      textQuery,
      pageSize: tamanho,
      languageCode: "pt-BR",
      regionCode: "BR",
    };
    if (pageToken) corpo.pageToken = pageToken;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(corpo),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(await mensagemErroGoogle(res));
    paginasUsadas++;

    const data = (await res.json()) as GoogleTextSearchResponse;
    const lugares = data.places || [];

    for (const p of lugares) {
      if (!p.id || encontrados.has(p.id)) continue;
      const telefone = p.nationalPhoneNumber || p.internationalPhoneNumber || "";
      encontrados.set(p.id, {
        nome: p.displayName?.text || "(sem nome)",
        telefone,
        endereco: p.formattedAddress || "",
        cidade: extrairCidade(p, cidade),
        categoria: p.primaryTypeDisplayName?.text || nicho.nome,
        external_id: p.id,
        site: p.websiteUri || undefined,
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return { lugares: [...encontrados.values()], paginas: paginasUsadas };
}

const RE_EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/** E-mails genéricos de fornecedores de template — não são do negócio. */
const EMAIL_IGNORAR = /@(example\.(com|org)|sentry\.io|wixpress\.com|godaddy\.com|shopify\.com|wordpress\.(com|org)|localhost)$/i;

/**
 * Tenta extrair o e-mail de contato do site institucional (best-effort).
 * Não inventa dados: se não encontrar, retorna null. Dá preferência ao
 * endereço declarado em link `mailto:` e ignora e-mails de placeholder.
 */
export async function extrairEmailDoSite(
  site: string,
  timeoutMs = 2500,
): Promise<string | null> {
  if (!site) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(site, {
      signal: ctrl.signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GuiX-Prospeccao/1.0)" },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 300_000);

    const candidatos: string[] = [];
    const mailto = html.match(/mailto:([^"'?>\s]+)/gi) || [];
    for (const m of mailto) candidatos.push(m.replace(/^mailto:/i, ""));
    const comArroba = html.match(new RegExp(RE_EMAIL.source, "gi")) || [];
    candidatos.push(...comArroba);

    for (const bruto of candidatos) {
      let limpo = bruto.trim().toLowerCase();
      try {
        limpo = decodeURIComponent(limpo);
      } catch {
        /* mantém como está */
      }
      const achado = limpo.match(RE_EMAIL);
      if (!achado) continue;
      const email = achado[0];
      if (EMAIL_IGNORAR.test(email)) continue;
      if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(email)) continue;
      return email;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
