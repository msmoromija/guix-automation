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

type FoursquarePlace = {
  fsq_place_id: string;
  name: string;
  location?: {
    address?: string;
    locality?: string;
    region?: string;
    country?: string;
    cross_street?: string;
    formatted_address?: string;
  };
  tel?: string;
  categories?: Array<{ fsq_category_id?: string; name: string; short_name?: string }>;
  latitude?: number;
  longitude?: number;
};

/** Versão da Places API (novo host places-api.foursquare.com). */
const FSQ_API_VERSION = "2025-06-17";

/**
 * Busca lugares na Foursquare Places API.
 * Documentação: https://docs.foursquare.com/fsq-developers-places/reference/place-search
 *
 * A API antiga (api.foursquare.com/v3) foi descontinuada; agora usa o host
 * places-api.foursquare.com, autenticação via `Bearer <SERVICE_KEY>` e o
 * header de versão `X-Places-Api-Version`.
 */
export async function buscarFoursquare(opts: {
  chave: string;
  endpoint: string;
  nicho: NichoProspecção;
  cidade: string;
  limite?: number;
}): Promise<LugarEncontrado[]> {
  const { chave, endpoint, nicho, cidade, limite = 50 } = opts;
  if (!chave) throw new Error("API Key da Foursquare não configurada.");

  const query = nicho.termos_busca[0] || nicho.nome;
  const params = new URLSearchParams({
    query,
    near: cidade,
    limit: String(limite),
  });
  if (nicho.categorias_foursquare?.length) {
    params.set("categories", nicho.categorias_foursquare.join(","));
  }

  const url = `${endpoint}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${chave}`,
      Accept: "application/json",
      "X-Places-Api-Version": FSQ_API_VERSION,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`Foursquare ${res.status}: ${texto.slice(0, 300)}`);
  }

  const data = (await res.json()) as { results?: FoursquarePlace[] };
  const resultados = data.results || [];

  return resultados.map((p) => {
    const endereco =
      p.location?.formatted_address ||
      [p.location?.address, p.location?.locality, p.location?.region]
        .filter(Boolean)
        .join(", ");
    const categoria =
      p.categories?.map((c) => c.name).join(", ") || nicho.nome;
    return {
      nome: p.name,
      telefone: p.tel || "",
      endereco,
      cidade: p.location?.locality || cidade,
      categoria,
      external_id: p.fsq_place_id,
      latitude: p.latitude,
      longitude: p.longitude,
    };
  });
}
