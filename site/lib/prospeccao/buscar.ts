import type { NichoProspecção } from "./tipos";

export type LugarEncontrado = {
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
  categoria: string;
  external_id: string;
  latitude?: number;
  longitude?: number;
};

type GooglePlace = {
  id: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
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
  paginas?: number;
  pageSize?: number;
}): Promise<{ lugares: LugarEncontrado[]; paginas: number }> {
  const { chave, nicho, cidade, paginas = 3, pageSize = 20 } = opts;
  const endpoint = opts.endpoint?.trim() || GOOGLE_TEXT_SEARCH;
  if (!chave) throw new Error("API Key da Google Places não configurada.");

  const termo = nicho.termos_busca[0] || nicho.nome;
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
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return { lugares: [...encontrados.values()], paginas: paginasUsadas };
}
