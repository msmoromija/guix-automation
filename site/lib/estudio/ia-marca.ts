import type { Nicho } from "@/lib/media/tipos";
import { emblemasDoNicho } from "./emblemas";
import { CORES_LOGO, FONTES_LOGO, LAYOUTS_LOGO, LOTE_IA_LOGO, hexOk, type LayoutLogo, type SpecLogo } from "./logo-spec";
import { nomeMarcaLimpo as limparNome } from "./simbolos";

function apiKey() {
  return process.env.OPENAI_API_KEY || "";
}

function padraoLote(nicho: string, evitar: SpecLogo[]): SpecLogo[] {
  const marcas = emblemasDoNicho(nicho).filter((i) => !evitar.some((e) => e.emblema === i.id));
  const layouts = LAYOUTS_LOGO.map((l) => l.id).filter((l) => !evitar.some((e) => e.layout === l && e.origem === "ia"));
  const out: SpecLogo[] = [];
  for (let i = 0; i < LOTE_IA_LOGO; i++) {
    const layout = (layouts[i] || LAYOUTS_LOGO[i % LAYOUTS_LOGO.length].id) as LayoutLogo;
    const emblema = layout === "wordmark" ? undefined : marcas[i % Math.max(1, marcas.length)]?.id || emblemasDoNicho(nicho)[0]?.id;
    const cor = CORES_LOGO[(i + 1) % CORES_LOGO.length].hex;
    out.push({
      id: `ia-${Date.now().toString(36)}-${i}`,
      origem: "ia",
      icone: "",
      emblema,
      layout,
      fonteId: FONTES_LOGO[(i + 2) % FONTES_LOGO.length].id,
      corIcone: cor,
      corAcento: cor,
    });
  }
  return out;
}

function sanitizarLote(raw: unknown, nicho: string, evitar: SpecLogo[]): SpecLogo[] {
  const permitidos = new Set(emblemasDoNicho(nicho).map((e) => e.id));
  const layouts = new Set(LAYOUTS_LOGO.map((l) => l.id));
  const fontes = new Set(FONTES_LOGO.map((f) => f.id));
  const arr = Array.isArray(raw) ? raw : [];
  const out: SpecLogo[] = [];
  const usados = new Set(evitar.map((e) => `${e.emblema || e.icone}|${e.layout}|${e.fonteId}`));
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    let emblema = String(rec.emblema || rec.icone || rec.icon || "");
    if (emblema && !permitidos.has(emblema)) {
      const hit = emblemasDoNicho(nicho).find((i) => i.id.toLowerCase() === emblema.toLowerCase() || i.nome.toLowerCase() === emblema.toLowerCase());
      emblema = hit?.id || "";
    }
    let layout = String(rec.layout || "lado") as LayoutLogo;
    if (!layouts.has(layout)) layout = "lado";
    if (layout === "wordmark") emblema = "";
    if (layout !== "wordmark" && !emblema) emblema = emblemasDoNicho(nicho)[0]?.id || "tesoura-disco";
    let fonteId = String(rec.fonteId || rec.fonte || "georgia");
    if (!fontes.has(fonteId)) fonteId = "georgia";
    const chave = `${emblema}|${layout}|${fonteId}`;
    if (usados.has(chave)) continue;
    usados.add(chave);
    const cor = hexOk(String(rec.corIcone || "")) ? String(rec.corIcone) : CORES_LOGO[out.length % CORES_LOGO.length].hex;
    out.push({
      id: `ia-${Date.now().toString(36)}-${out.length}`,
      origem: "ia",
      icone: "",
      emblema: emblema || undefined,
      layout,
      fonteId,
      corIcone: cor,
      corAcento: hexOk(String(rec.corAcento || "")) ? String(rec.corAcento) : cor,
      corNome: hexOk(String(rec.corNome || "")) ? String(rec.corNome) : undefined,
    });
    if (out.length >= LOTE_IA_LOGO) break;
  }
  if (out.length < LOTE_IA_LOGO) {
    for (const extra of padraoLote(nicho, [...evitar, ...out])) {
      if (out.length >= LOTE_IA_LOGO) break;
      out.push({ ...extra, id: `ia-${Date.now().toString(36)}-${out.length}` });
    }
  }
  return out.slice(0, LOTE_IA_LOGO);
}

export async function gerarLoteLogos(opts: {
  nome: string;
  nicho: Nicho;
  evitar?: SpecLogo[];
}): Promise<SpecLogo[]> {
  const evitar = opts.evitar || [];
  const key = apiKey();
  const marcas = emblemasDoNicho(opts.nicho)
    .map((i) => `${i.id} (${i.nome})`)
    .join(", ");
  const fontes = FONTES_LOGO.map((f) => f.id).join(", ");
  const layouts = LAYOUTS_LOGO.map((l) => l.id).join(", ");

  if (!key) return padraoLote(opts.nicho, evitar);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Você é diretor de arte. Monte 5 logomarcas distintas para o ofício. Responda só JSON {"propostas":[{"emblema":"tesoura-disco","layout":"lado","fonteId":"georgia","corIcone":"#C6A15B","corAcento":"#1A1614"}]}. Use SOMENTE os ids de emblema da lista. Nunca Lucide, caduceu ou símbolo de outro ramo. Varie emblema, fonte, layout e cor.',
        },
        {
          role: "user",
          content: `Negócio "${limparNome(opts.nome)}", ofício ${opts.nicho}.
Emblemas: ${marcas}.
Layouts: ${layouts}.
Fontes: ${fontes}.
Já usados: ${evitar.map((e) => `${e.emblema || e.icone}/${e.layout}/${e.fonteId}`).join(", ") || "nenhum"}.
Entregue 5 propostas novas.`,
        },
      ],
    }),
  });
  if (!res.ok) return padraoLote(opts.nicho, evitar);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}") as { propostas?: unknown };
    return sanitizarLote(parsed.propostas, opts.nicho, evitar);
  } catch {
    return padraoLote(opts.nicho, evitar);
  }
}
