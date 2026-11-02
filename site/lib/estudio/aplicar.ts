import { aplicarDadosCliente } from "@/lib/automacao/aplicar-cliente";
import type { EntradaAutomacao } from "@/lib/automacao/tipos";
import { CANAIS_SCHEMA, extrasDeRedes, urlCanal } from "./canais";
import { aplicarVisualNoTema, type VisualConfig } from "./visual";

export interface LinhaServico {
  nome: string;
  preco?: string;
  duracao?: string;
  descricao?: string;
  imagemSrc?: string;
}

export interface LinhaPro {
  nome: string;
  cargo?: string;
  descricao?: string;
  fotoSrc?: string;
}

function upsertRede(redes: Record<string, unknown>[], id: string, label: string, raw?: string) {
  const url = raw ? urlCanal(id, raw) : "";
  if (!url) return;
  const idx = redes.findIndex((r) => r.id === id);
  const item = { id, label, url };
  if (idx >= 0) redes[idx] = { ...redes[idx], ...item };
  else redes.push(item);
}

export function aplicarEstudio(
  site: Record<string, unknown>,
  opts: {
    entrada: EntradaAutomacao;
    visual: VisualConfig;
    logoSrc?: string;
    servicos?: LinhaServico[];
    profissionais?: LinhaPro[];
    aplicarServicos?: boolean;
    aplicarProfissionais?: boolean;
    aplicarVisual?: boolean;
    preservarModeloQuandoVazio?: boolean;
    fotos?: { hero?: string; sobre?: string; galeria?: string[] };
    /** Bairro/cidade do modelo ANTES de limpar — para trocar na copy. */
    bairroModelo?: string;
    cidadeModelo?: string;
  },
) {
  const empAntes = { ...((site.empresa as Record<string, unknown>) || {}) };
  const endAntes = empAntes.endereco;
  const waAntes = empAntes.whatsapp;
  const waLabelAntes = empAntes.whatsapp_label;
  const waMsgAntes = empAntes.whatsapp_mensagem;
  const waAriaAntes = empAntes.whatsapp_aria;
  const telAntes = empAntes.telefone;
  const telLabelAntes = empAntes.telefone_label;
  const emailAntes = empAntes.email;
  const nomeAntes = empAntes.nome;
  const sloganAntes = empAntes.slogan;

  aplicarDadosCliente(site, opts.entrada);
  if (opts.aplicarVisual !== false) aplicarVisualNoTema(site, opts.visual);

  if (opts.preservarModeloQuandoVazio) {
    const empresa = { ...(site.empresa as Record<string, unknown>) };
    if (!opts.entrada.nome?.trim()) empresa.nome = nomeAntes;
    if (!opts.entrada.slogan?.trim()) empresa.slogan = sloganAntes;
    if (!opts.entrada.whatsapp) {
      empresa.whatsapp = waAntes;
      empresa.whatsapp_label = waLabelAntes;
      empresa.whatsapp_mensagem = waMsgAntes;
      empresa.whatsapp_aria = waAriaAntes;
      empresa.telefone = telAntes;
      empresa.telefone_label = telLabelAntes;
    }
    if (!opts.entrada.email) empresa.email = emailAntes;
    const endNovo = { ...((empresa.endereco as Record<string, unknown>) || {}) };
    const endOld = { ...((endAntes as Record<string, unknown>) || {}) };
    const pick = (campo: string, veio?: string) => (veio?.trim() ? endNovo[campo] : endOld[campo]);
    const logradouro = pick("logradouro", opts.entrada.logradouro);
    const numero = pick("numero", opts.entrada.numero);
    const bairro = pick("bairro", opts.entrada.bairro);
    const cidade = pick("cidade", opts.entrada.cidade);
    const estadoBruto = pick("estado", opts.entrada.estado);
    const estado = String(estadoBruto || "").trim().toUpperCase() === "NA" ? "" : estadoBruto;
    const cep = pick("cep", opts.entrada.cep);
    const rua = [logradouro, numero].filter(Boolean).join(", ");
    const resto = [bairro, [cidade, estado].filter(Boolean).join(" - ")].filter(Boolean).join(", ");
    const completoNovo = [rua, resto].filter(Boolean).join(" — ");
    const completoOld = String(endOld.completo || "");
    empresa.endereco = {
      ...endOld,
      ...endNovo,
      logradouro,
      numero,
      bairro,
      cidade,
      estado: estado || endNovo.estado || "",
      cep,
      completo: completoNovo || (/\bNA\b|endereço a confirmar/i.test(completoOld) ? "" : completoOld),
    };
    site.empresa = empresa;
  }

  const empresa = { ...(site.empresa as Record<string, unknown>) };
  const logo = { ...((empresa.logo as Record<string, unknown>) || {}) };
  if (opts.logoSrc) {
    if (!logo.id) logo.id = "img_logo_marca";
    logo.src = opts.logoSrc;
    logo.alt = opts.entrada.nome;
    logo.categoria = "logo";
    logo.origem = opts.logoSrc.startsWith("/marcas/")
      ? "biblioteca"
      : opts.logoSrc.startsWith("data:")
        ? "upload"
        : "upload";
    delete logo.credito;
  }
  empresa.logo = logo;

  const temRedeUser = Boolean(
    opts.entrada.instagram || opts.entrada.facebook || opts.entrada.tiktok || opts.entrada.youtube || opts.entrada.linkedin,
  );
  if (!opts.preservarModeloQuandoVazio || temRedeUser) {
    const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
    const mapa: Array<[string, string, string | undefined]> = [
      ["instagram", "Instagram", opts.entrada.instagram],
      ["facebook", "Facebook", opts.entrada.facebook],
      ["tiktok", "TikTok", opts.entrada.tiktok],
      ["youtube", "YouTube", opts.entrada.youtube],
    ];
    for (const [id, label, raw] of mapa) {
      if (!CANAIS_SCHEMA.includes(id as (typeof CANAIS_SCHEMA)[number])) continue;
      upsertRede(redes, id, label, raw);
    }
    empresa.redes = redes.filter((r) => CANAIS_SCHEMA.includes(String(r.id) as (typeof CANAIS_SCHEMA)[number])).slice(0, 4);
  }
  const extras = extrasDeRedes({
    linkedin: opts.entrada.linkedin || "",
    ...(opts.visual.redesExtra || []).reduce<Record<string, string>>((acc, r) => {
      acc[r.id] = r.url;
      return acc;
    }, {}),
  });
  if (extras.length) opts.visual.redesExtra = extras;
  if (opts.entrada.linkedin) {
    opts.visual.linkedinUrl = urlCanal("linkedin", opts.entrada.linkedin);
  }
  site.empresa = empresa;

  const endModelo = { ...((endAntes as Record<string, unknown>) || {}) };
  personalizarCopia(site, {
    nicho: String(opts.entrada.nicho || ""),
    nome: opts.entrada.nome,
    bairro: opts.entrada.bairro,
    cidade: opts.entrada.cidade,
    bairroModelo: String(opts.bairroModelo || endModelo.bairro || ""),
    cidadeModelo: String(opts.cidadeModelo || endModelo.cidade || ""),
  });

  const lugar = String(opts.entrada.bairro || opts.entrada.cidade || "").trim();
  const contato = { ...((site.contato as Record<string, unknown>) || {}) };
  if (lugar) {
    contato.titulo = tituloVenha(opts.entrada.bairro, opts.entrada.cidade);
    site.contato = contato;
  } else if (/^venha\b/i.test(String(contato.titulo || ""))) {
    contato.titulo = "Onde estamos";
    site.contato = contato;
  }

  aplicarFotosSite(site, opts.fotos);

  if (opts.aplicarServicos !== false && opts.servicos?.length) {
    const bloco = { ...((site.servicos as Record<string, unknown>) || {}) };
    const atuais = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
    bloco.itens = opts.servicos
      .filter((s) => s.nome.trim() && s.nome.trim() !== "Novo serviço")
      .slice(0, 12)
      .map((s, i) => {
        const base = atuais[i] || {};
        const mins = minutosDeRotulo(s.duracao) || Number(base.duracao_minutos) || 30;
        const precoInformado = Boolean(s.preco?.trim());
        const precoNum = precoDeRotulo(s.preco);
        const imagem = { ...((base.imagem as Record<string, unknown>) || {}) };
        if (s.imagemSrc) {
          imagem.src = s.imagemSrc;
          imagem.origem = origemFoto(s.imagemSrc);
          imagem.alt = s.nome;
          delete imagem.credito;
        } else if (typeof imagem.src !== "string") imagem.src = "";
        if (!imagem.id) imagem.id = `img_srv_item${i + 1}`;
        if (!imagem.alt) imagem.alt = s.nome;
        if (!imagem.categoria) imagem.categoria = "servico";
        const duracaoInformada = Boolean(s.duracao?.trim());
        return {
          ...base,
          id: String(base.id || `srv_item${i + 1}`),
          nome: s.nome.trim(),
          descricao: s.descricao?.trim() || "",
          preco: precoInformado ? (precoNum ?? 0) : 0,
          preco_label: precoInformado ? s.preco!.trim() : "Sob consulta",
          duracao_minutos: mins < 1 ? 30 : mins,
          duracao_label: duracaoInformada ? s.duracao!.trim() : `${mins} min`,
          imagem,
        };
      });
    site.servicos = bloco;
  }

  if (opts.aplicarProfissionais === false) {
    return site;
  }

  const blocoPro = { ...((site.profissionais as Record<string, unknown>) || {}) };
  const reais = (opts.profissionais || []).filter((p) => p.nome.trim() && p.nome.trim() !== "Novo nome");
  if (reais.length) {
    const atuais = Array.isArray(blocoPro.itens) ? (blocoPro.itens as Record<string, unknown>[]) : [];
    blocoPro.itens = reais.map((p, i) => {
      const base = atuais[i] || {};
      const foto = { ...((base.foto as Record<string, unknown>) || {}) };
      if (p.fotoSrc) {
        foto.id = String(foto.id || `img_pro_p${i + 1}`);
        foto.src = p.fotoSrc;
        foto.alt = p.nome;
        foto.categoria = "profissional";
        foto.origem = "upload";
        delete foto.credito;
      } else {
        if (typeof foto.src !== "string") foto.src = "";
        if (!foto.id) foto.id = `img_pro_p${i + 1}`;
        if (!foto.alt) foto.alt = p.nome;
        if (!foto.categoria) foto.categoria = "profissional";
      }
      return {
        ...base,
        id: String(base.id || `pro_p${i + 1}`),
        nome: p.nome,
        cargo: p.cargo || "",
        descricao: p.descricao || "",
        whatsapp: "",
        foto,
      };
    });
  } else {
    blocoPro.titulo = "Equipe";
    blocoPro.subtitulo = "O agendamento não destina profissional.";
    blocoPro.itens = [
      {
        id: "pro_sempref",
        nome: "Sem preferência",
        cargo: "",
        descricao: "O horário não destina um profissional.",
        whatsapp: "",
        foto: { id: "img_pro_sempref", src: "", alt: "Sem preferência", categoria: "profissional" },
      },
    ];
  }
  site.profissionais = blocoPro;

  return site;
}

export function minutosDeRotulo(raw?: string) {
  const s = String(raw || "").toLowerCase().trim();
  if (!s) return 0;
  const hms = s.match(/^(\d+)\s*[:h]\s*(\d{1,2})\s*(?:m(?:in)?)?$/);
  if (hms) return Number(hms[1]) * 60 + Number(hms[2]);
  const h = s.match(/(\d+)\s*h(?:oras?)?/);
  const m = s.match(/(\d+)\s*m(?:in(?:uto)?s?)?/);
  if (h || m) return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 0;
}

export function precoDeRotulo(raw?: string) {
  const s = String(raw || "").trim();
  if (!s || /sob consulta|combinar|a combinar/i.test(s)) return null;
  const n = Number(s.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function tituloVenha(bairro?: string, cidade?: string) {
  const lugar = String(bairro || cidade || "").trim();
  if (!lugar) return "";
  if (!bairro && cidade) return `Venha a ${lugar}`;
  const primeiro = lugar.split(/\s+/)[0] || "";
  if (/s$/i.test(primeiro) && !/(is|us|os)$/i.test(primeiro)) return `Venha aos ${lugar}`;
  const feminino = /(a|ândia)$/i.test(primeiro);
  return `${feminino ? "Venha à" : "Venha ao"} ${lugar}`;
}

const MARCAS_MODELO: Record<string, string[]> = {
  barbearia: ["Barbearia Vila Norte", "Vila Norte"],
  salao: ["Salão Vila Flor", "Vila Flor"],
  estetica: ["Estúdio Serra Clara", "Serra Clara"],
  petshop: ["Pet Shop Bento", "Bento"],
  academia: ["Academia Farol", "Farol"],
  contabilidade: ["Lima Contabilidade", "Lima"],
  advocacia: ["Vale Luz Advogados", "Vale Luz"],
};

const PULAR_CHAVE = new Set([
  "src",
  "url",
  "href",
  "id",
  "mapa_embed_url",
  "canonical_url",
  "perfil_url",
  "r2_key",
]);

const BLOCOS_COPIA = [
  "hero",
  "sobre",
  "contato",
  "seo",
  "rodape",
  "faq",
  "servicos",
  "profissionais",
  "diferenciais",
  "promocoes",
  "eventos",
  "galeria",
  "agendamento",
  "obrigado",
  "privacidade",
] as const;

function escaparRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function artigoLugar(lugar: string) {
  const primeiro = lugar.split(/\s+/)[0] || "";
  if (/s$/i.test(primeiro) && !/(is|us|os)$/i.test(primeiro)) return "nos";
  return /(a|ândia)$/i.test(primeiro) ? "na" : "no";
}

/** Troca marca do modelo pelo nome do cliente, sem aplicar artigo de lugar. */
function trocarMarca(texto: string, de: string, para: string) {
  const origem = String(de || "").trim();
  const destino = String(para || "").trim();
  if (!origem || !destino || origem.toLowerCase() === destino.toLowerCase() || origem.length < 3) return texto;
  return texto
    .replace(new RegExp(`\\b([AO])\\s+${escaparRe(origem)}\\b`, "g"), `$1 ${destino}`)
    .replace(new RegExp(`\\b([ao])\\s+${escaparRe(origem)}\\b`, "gi"), (_m, art: string) => `${art} ${destino}`)
    .replace(new RegExp(`\\b(d[aoe]|n[ao]|pela?|à)\\s+${escaparRe(origem)}\\b`, "gi"), `$1 ${destino}`)
    .replace(new RegExp(escaparRe(origem), "gi"), destino);
}

/** Tira o bairro/cidade do exemplo quando o cliente não informou o dele. */
function apagarLugar(texto: string, de: string) {
  const origem = String(de || "").trim();
  if (!origem || origem.length < 4) return texto;
  return texto
    .replace(new RegExp(`\\s*(?:,|—|-)?\\s*(?:n[ao]s?|aos|ao|em|à)\\s+${escaparRe(origem)}\\b`, "gi"), "")
    .replace(new RegExp(`\\b${escaparRe(origem)}\\b`, "gi"), "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .replace(/\s*[,—-]\s*$/g, "")
    .replace(/^\s*[,—-]\s*/g, "")
    .trim();
}

function trocarLugar(texto: string, de: string, para: string) {
  const origem = String(de || "").trim();
  const destino = String(para || "").trim();
  if (!origem || !destino || origem.toLowerCase() === destino.toLowerCase() || origem.length < 4) return texto;
  const art = artigoLugar(destino);
  return texto
    .replace(new RegExp(`\\b(n[ao]s?)\\s+${escaparRe(origem)}\\b`, "gi"), `${art} ${destino}`)
    .replace(new RegExp(`à\\s+${escaparRe(origem)}\\b`, "gi"), `${art === "na" ? "à" : art} ${destino}`)
    .replace(new RegExp(escaparRe(origem), "gi"), destino);
}

function mapearCopia(valor: unknown, fn: (s: string) => string): unknown {
  if (typeof valor === "string") return fn(valor);
  if (Array.isArray(valor)) return valor.map((item) => mapearCopia(item, fn));
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = { ...(valor as Record<string, unknown>) };
    for (const chave of Object.keys(out)) {
      if (PULAR_CHAVE.has(chave)) continue;
      out[chave] = mapearCopia(out[chave], fn);
    }
    return out;
  }
  return valor;
}

function personalizarCopia(
  site: Record<string, unknown>,
  opts: {
    nicho: string;
    nome?: string;
    bairro?: string;
    cidade?: string;
    bairroModelo?: string;
    cidadeModelo?: string;
  },
) {
  const header = { ...((site.header as Record<string, unknown>) || {}) };
  if (Array.isArray(header.menu)) {
    header.menu = (header.menu as Record<string, unknown>[]).map((item) => ({
      ...item,
      label: String(item.label || "") === "A casa" ? "Sobre" : item.label,
    }));
    site.header = header;
  }
  const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
  if (String(galeria.titulo || "") === "A casa") {
    galeria.titulo = "O espaço";
    site.galeria = galeria;
  }

  const nome = String(opts.nome || "").trim();
  const marcas = (MARCAS_MODELO[opts.nicho] || []).slice().sort((a, b) => b.length - a.length);
  const bairroDe = String(opts.bairroModelo || "").trim();
  const bairroPara = String(opts.bairro || "").trim();
  const cidadeDe = String(opts.cidadeModelo || "").trim();
  const cidadePara = String(opts.cidade || "").trim();

  const aplicar = (s: string) => {
    let out = s;
    if (nome) {
      for (const antigo of marcas) out = trocarMarca(out, antigo, nome);
    }
    if (bairroDe && bairroPara && bairroDe.toLowerCase() !== bairroPara.toLowerCase()) {
      out = trocarLugar(out, bairroDe, bairroPara);
    } else if (bairroDe && !bairroPara) {
      out = apagarLugar(out, bairroDe);
    }
    if (cidadeDe && cidadePara && cidadeDe.toLowerCase() !== cidadePara.toLowerCase()) {
      out = trocarLugar(out, cidadeDe, cidadePara);
    } else if (cidadeDe && !cidadePara) {
      out = apagarLugar(out, cidadeDe);
    }
    return out;
  };

  const mexeLugar = Boolean((bairroDe && bairroPara) || (cidadeDe && cidadePara) || (bairroDe && !bairroPara) || (cidadeDe && !cidadePara));
  if (!nome && !mexeLugar) return;

  for (const bloco of BLOCOS_COPIA) {
    if (!site[bloco]) continue;
    site[bloco] = mapearCopia(site[bloco], aplicar) as Record<string, unknown>;
  }
}

function origemFoto(src: string) {
  if (src.startsWith("data:")) return "upload";
  if (src.startsWith("/marcas/")) return "biblioteca";
  return "unsplash";
}

export function aplicarFotosSite(
  site: Record<string, unknown>,
  fotos?: { hero?: string; sobre?: string; galeria?: string[] },
) {
  if (!fotos) return site;
  if (fotos.hero) {
    const hero = { ...((site.hero as Record<string, unknown>) || {}) };
    const imagem = { ...((hero.imagem as Record<string, unknown>) || {}) };
    imagem.src = fotos.hero;
    imagem.origem = origemFoto(fotos.hero);
    imagem.alt = String(imagem.alt || "Capa");
    delete imagem.credito;
    if (!imagem.id) imagem.id = "img_hero";
    if (!imagem.categoria) imagem.categoria = "hero";
    hero.imagem = imagem;
    site.hero = hero;
  }
  if (fotos.sobre) {
    const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
    const imagem = { ...((sobre.imagem as Record<string, unknown>) || {}) };
    imagem.src = fotos.sobre;
    imagem.origem = origemFoto(fotos.sobre);
    imagem.alt = String(imagem.alt || "Sobre");
    delete imagem.credito;
    if (!imagem.id) imagem.id = "img_sobre";
    if (!imagem.categoria) imagem.categoria = "sobre";
    sobre.imagem = imagem;
    site.sobre = sobre;
  }
  if (fotos.galeria?.length) {
    const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
    const itens = Array.isArray(galeria.itens) ? [...(galeria.itens as Record<string, unknown>[])] : [];
    fotos.galeria.forEach((src, i) => {
      if (!src) return;
      const base = { ...(itens[i] || {}) };
      const imagem = { ...((base.imagem as Record<string, unknown>) || {}) };
      imagem.src = src;
      imagem.origem = origemFoto(src);
      delete imagem.credito;
      if (!imagem.id) imagem.id = `img_gal_${i + 1}`;
      if (!imagem.categoria) imagem.categoria = "galeria";
      itens[i] = { ...base, id: String(base.id || `gal_${i + 1}`), imagem };
    });
    galeria.itens = itens;
    site.galeria = galeria;
  }
  return site;
}

export function aplicarSrcNoSlot(
  site: Record<string, unknown>,
  slot: { tipo: "hero" | "sobre" | "galeria" | "servico"; indice?: number },
  src: string,
) {
  if (slot.tipo === "hero") return aplicarFotosSite(site, { hero: src });
  if (slot.tipo === "sobre") return aplicarFotosSite(site, { sobre: src });
  if (slot.tipo === "galeria") {
    const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
    const itens = Array.isArray(galeria.itens) ? [...(galeria.itens as Record<string, unknown>[])] : [];
    const i = slot.indice ?? 0;
    const lista = itens.map((item, idx) => String(((item.imagem as Record<string, unknown>) || {}).src || ""));
    while (lista.length <= i) lista.push("");
    lista[i] = src;
    return aplicarFotosSite(site, { galeria: lista });
  }
  const servicos = { ...((site.servicos as Record<string, unknown>) || {}) };
  const itens = Array.isArray(servicos.itens) ? [...(servicos.itens as Record<string, unknown>[])] : [];
  const i = slot.indice ?? 0;
  if (itens[i]) {
    const base = { ...itens[i] };
    const imagem = { ...((base.imagem as Record<string, unknown>) || {}) };
    imagem.src = src;
    imagem.origem = origemFoto(src);
    imagem.alt = String(base.nome || imagem.alt || "Serviço");
    delete imagem.credito;
    itens[i] = { ...base, imagem };
    servicos.itens = itens;
    site.servicos = servicos;
  }
  return site;
}

export function sanitizarLogoSrc(raw: unknown) {
  const s = String(raw || "");
  if (!s) return undefined;
  if (s.length > 900_000) return undefined;
  if (s.startsWith("data:image/")) return s;
  if (/^\/marcas\/[a-z0-9-]+\/[0-9]{2}\.png$/.test(s)) return s;
  if (s.startsWith("https://") && s.length < 2200) return s;
  return undefined;
}

export function sanitizarFotoSrc(raw: unknown) {
  const s = String(raw || "");
  if (!s) return undefined;
  if (s.length > 1_800_000) return undefined;
  if (s.startsWith("data:image/")) return s;
  if (s.startsWith("https://") && s.length < 4000) return s;
  return undefined;
}
