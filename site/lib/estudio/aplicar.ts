import { aplicarDadosCliente } from "@/lib/automacao/aplicar-cliente";
import type { EntradaAutomacao } from "@/lib/automacao/tipos";
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

const REDES_SCHEMA = ["instagram", "facebook", "tiktok", "youtube"] as const;

function urlRede(id: string, raw: string) {
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const handle = s.replace(/^@/, "").replace(/^\/+/, "");
  if (id === "instagram") return `https://instagram.com/${handle}`;
  if (id === "facebook") return `https://facebook.com/${handle}`;
  if (id === "tiktok") return `https://tiktok.com/@${handle}`;
  if (id === "youtube") return `https://youtube.com/@${handle}`;
  if (id === "linkedin") return handle.includes("linkedin.com") ? `https://${handle.replace(/^https?:\/\//, "")}` : `https://linkedin.com/company/${handle}`;
  return s;
}

function upsertRede(redes: Record<string, unknown>[], id: string, label: string, raw?: string) {
  const url = raw ? urlRede(id, raw) : "";
  const idx = redes.findIndex((r) => r.id === id);
  if (!url) {
    if (idx >= 0) redes.splice(idx, 1);
    return;
  }
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
  },
) {
  aplicarDadosCliente(site, opts.entrada);
  aplicarVisualNoTema(site, opts.visual);

  const empresa = { ...(site.empresa as Record<string, unknown>) };
  const logo = { ...((empresa.logo as Record<string, unknown>) || {}) };
  if (opts.logoSrc) {
    if (!logo.id) logo.id = "img_logo_marca";
    logo.src = opts.logoSrc;
    logo.alt = opts.entrada.nome;
    logo.categoria = "logo";
    logo.origem = "upload";
    delete logo.credito;
  }
  empresa.logo = logo;

  const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
  const mapa: Array<[string, string, string | undefined]> = [
    ["instagram", "Instagram", opts.entrada.instagram],
    ["facebook", "Facebook", opts.entrada.facebook],
    ["tiktok", "TikTok", opts.entrada.tiktok],
    ["youtube", "YouTube", opts.entrada.youtube],
  ];
  for (const [id, label, raw] of mapa) {
    if (!REDES_SCHEMA.includes(id as (typeof REDES_SCHEMA)[number])) continue;
    upsertRede(redes, id, label, raw);
  }
  empresa.redes = redes.slice(0, 4);
  if (opts.entrada.linkedin) {
    opts.visual.linkedinUrl = urlRede("linkedin", opts.entrada.linkedin);
  }
  site.empresa = empresa;

  if (opts.servicos?.length) {
    const bloco = { ...((site.servicos as Record<string, unknown>) || {}) };
    const atuais = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
    bloco.itens = opts.servicos.map((s, i) => {
      const base = atuais[i] || {};
      const mins = Number(String(s.duracao || "").replace(/\D/g, "")) || Number(base.duracao_minutos) || 30;
      const precoNum = Number(String(s.preco || "").replace(/[^\d,]/g, "").replace(",", ".")) || Number(base.preco) || 0;
      const imagem = { ...((base.imagem as Record<string, unknown>) || {}) };
      if (s.imagemSrc) {
        imagem.src = s.imagemSrc;
        imagem.origem = s.imagemSrc.startsWith("data:") ? "upload" : "unsplash";
      } else if (typeof imagem.src !== "string") imagem.src = "";
      if (!imagem.id) imagem.id = `img_srv_item${i + 1}`;
      if (!imagem.alt) imagem.alt = s.nome;
      if (!imagem.categoria) imagem.categoria = "servico";
      return {
        ...base,
        id: String(base.id || `srv_item${i + 1}`),
        nome: s.nome,
        descricao: s.descricao || base.descricao || "",
        preco: precoNum,
        preco_label: s.preco || base.preco_label || "Sob consulta",
        duracao_minutos: mins < 1 ? 30 : mins,
        duracao_label: s.duracao || base.duracao_label || `${mins} min`,
        imagem,
      };
    });
    site.servicos = bloco;
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
        whatsapp: typeof base.whatsapp === "string" ? base.whatsapp : "",
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

export function sanitizarLogoSrc(raw: unknown) {
  const s = String(raw || "");
  if (!s) return undefined;
  if (s.length > 900_000) return undefined;
  if (!s.startsWith("data:image/")) return undefined;
  return s;
}
