import type { EntradaAutomacao } from "./tipos";

const FICTICIO =
  /spring field|rua onde fica|animador de porta|lorem|placeholder|exemplo\.com|0000-0000|00\.000\.000\/0000-00|barbeariavilanorte|vila norte/i;

export function ehFicticio(v?: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return FICTICIO.test(s);
}

function limparString(v: unknown) {
  const s = String(v || "").trim();
  if (!s || ehFicticio(s)) return "";
  return s;
}

/** Tira identidade do modelo (Vila Norte etc.) para o rascunho não nascer com dados de outro. */
export function limparIdentidadeExemplo(site: Record<string, unknown>, entrada: EntradaAutomacao) {
  const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
  empresa.nome = entrada.nome;
  empresa.slogan = entrada.slogan || "";
  empresa.cnpj = entrada.cnpj || "";
  empresa.email = entrada.email || "";
  if (!entrada.telefone) {
    empresa.telefone = "";
    empresa.telefone_label = "";
  }
  if (!entrada.whatsapp) {
    empresa.whatsapp = "";
    empresa.whatsapp_label = "";
    empresa.whatsapp_mensagem = "";
  }
  empresa.endereco = {
    logradouro: entrada.logradouro || "",
    numero: entrada.numero || "",
    complemento: "",
    bairro: entrada.bairro || "",
    cidade: entrada.cidade || "",
    estado: entrada.estado || "",
    cep: entrada.cep || "",
    completo: "",
    mapa_embed_url: "",
  };
  const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
  empresa.redes = redes.map((r) => ({ ...r, url: "" }));
  site.empresa = empresa;

  const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
  if (!galeria.titulo || String(galeria.titulo) === "A casa") galeria.titulo = "O espaço";
  site.galeria = galeria;

  const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
  if (String(sobre.titulo || "") === "A casa") sobre.titulo = "Sobre";
  site.sobre = sobre;

  const equipe = { ...((site.profissionais as Record<string, unknown>) || {}) };
  if (Array.isArray(equipe.itens)) {
    equipe.itens = (equipe.itens as Record<string, unknown>[]).map((p) => {
      const foto = { ...((p.foto as Record<string, unknown>) || {}) };
      delete foto.src;
      return { ...p, foto };
    });
  }
  site.profissionais = equipe;

  return site;
}

const GRAFIA: Array<[RegExp, string]> = [
  [/\bclassico\b/gi, "clássico"],
  [/\bclassicos\b/gi, "clássicos"],
  [/\bmaquina\b/gi, "máquina"],
  [/\bmaquinas\b/gi, "máquinas"],
  [/\bnao\b/gi, "não"],
  [/\bvoce\b/gi, "você"],
];

function acentuar(s: string) {
  let out = s;
  for (const [re, to] of GRAFIA) out = out.replace(re, to);
  return out;
}

function aliviarHoraMarcada(s: string) {
  const hits = s.match(/hora marcada/gi) || [];
  if (hits.length <= 1) return s;
  let visto = 0;
  return s.replace(/hora marcada/gi, () => {
    visto += 1;
    return visto === 1 ? "hora marcada" : "horário combinado";
  });
}

function polir(s: string) {
  return aliviarHoraMarcada(acentuar(s)).replace(/\s{2,}/g, " ").trim();
}

function polirCampo(obj: Record<string, unknown>, chave: string) {
  if (typeof obj[chave] === "string") obj[chave] = polir(obj[chave] as string);
}

/** Textos do site: grafia e menos “hora marcada” repetido. */
export function polirTextosSite(site: Record<string, unknown>) {
  const hero = { ...((site.hero as Record<string, unknown>) || {}) };
  polirCampo(hero, "titulo");
  polirCampo(hero, "subtitulo");
  site.hero = hero;

  const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
  polirCampo(sobre, "titulo");
  if (Array.isArray(sobre.paragrafos)) sobre.paragrafos = (sobre.paragrafos as string[]).map(polir);
  site.sobre = sobre;

  const servicos = { ...((site.servicos as Record<string, unknown>) || {}) };
  polirCampo(servicos, "titulo");
  polirCampo(servicos, "subtitulo");
  if (Array.isArray(servicos.itens)) {
    servicos.itens = (servicos.itens as Record<string, unknown>[]).map((i) => {
      const n = { ...i };
      polirCampo(n, "nome");
      polirCampo(n, "descricao");
      return n;
    });
  }
  site.servicos = servicos;

  const faq = { ...((site.faq as Record<string, unknown>) || {}) };
  if (Array.isArray(faq.itens)) {
    faq.itens = (faq.itens as Record<string, unknown>[]).map((i) => {
      const n = { ...i };
      polirCampo(n, "pergunta");
      polirCampo(n, "resposta");
      return n;
    });
  }
  site.faq = faq;

  const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
  polirCampo(empresa, "slogan");
  const end = { ...((empresa.endereco as Record<string, unknown>) || {}) };
  if (ehFicticio(String(end.completo || "")) || ehFicticio(String(end.logradouro || ""))) {
    end.completo = [end.logradouro, end.numero].filter((x) => x && !ehFicticio(String(x))).join(", ");
    if (ehFicticio(String(end.logradouro || ""))) end.logradouro = "";
  }
  empresa.endereco = end;
  site.empresa = empresa;

  const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
  if (String(galeria.titulo || "") === "A casa") galeria.titulo = "O espaço";
  site.galeria = galeria;

  return site;
}

export function enderecoCompleto(entrada: EntradaAutomacao) {
  const partes = [
    [limparString(entrada.logradouro), limparString(entrada.numero)].filter(Boolean).join(", "),
    limparString(entrada.bairro),
    [limparString(entrada.cidade), limparString(entrada.estado)].filter(Boolean).join(" - "),
  ].filter(Boolean);
  return partes.join(" — ");
}
