import type { EntradaAutomacao } from "@/lib/automacao/tipos";
import type { Nicho } from "@/lib/media/tipos";
import { aplicarCopiaNoSite, type CopiaViva } from "./copia-viva";
import { aplicarEstudio, type LinhaPro, type LinhaServico } from "./aplicar";
import { extrasDeRedes } from "./canais";
import type { VisualConfig } from "./visual";

export function construirAoVivo(
  modelo: Record<string, unknown>,
  opts: {
    nicho: string;
    nome: string;
    slogan: string;
    cidade: string;
    estado: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cep: string;
    whatsapp: string;
    email: string;
    redes: Record<string, string>;
    visual: VisualConfig;
    logoSrc?: string;
    servicos: LinhaServico[];
    profissionais: LinhaPro[];
    etapa: number;
    fotos?: { hero?: string; sobre?: string; galeria?: string[] };
    copia?: CopiaViva | null;
    horario?: string;
    menu?: { id: string; label: string; href: string }[];
    botaoAgendar?: string;
    rodapeTexto?: string;
    rodapeLinks?: { id: string; label: string; href: string }[];
    diferenciais?: { titulo: string; descricao: string }[];
  },
) {
  const site = JSON.parse(JSON.stringify(modelo)) as Record<string, unknown>;
  const endModelo = { ...(((modelo.empresa as Record<string, unknown> | undefined)?.endereco as Record<string, unknown>) || {}) };
  const temPro = opts.profissionais.some((p) => p.nome.trim() && p.nome.trim() !== "Novo nome");
  const entrada: EntradaAutomacao = {
    clienteId: "preview",
    nicho: opts.nicho as Nicho,
    nome: opts.nome.trim(),
    slogan: opts.slogan.trim() || undefined,
    cidade: opts.cidade.trim() || undefined,
    estado: opts.estado.trim() || undefined,
    logradouro: opts.logradouro.trim() || undefined,
    numero: opts.numero.trim() || undefined,
    bairro: opts.bairro.trim() || undefined,
    cep: opts.cep.trim() || undefined,
    whatsapp: opts.whatsapp.trim() || undefined,
    email: opts.email.trim() || undefined,
    instagram: opts.redes.instagram || undefined,
    facebook: opts.redes.facebook || undefined,
    linkedin: opts.redes.linkedin || undefined,
    tiktok: opts.redes.tiktok || undefined,
    youtube: opts.redes.youtube || undefined,
  };

  aplicarEstudio(site, {
    entrada,
    visual: {
      ...opts.visual,
      linkedinUrl: opts.redes.linkedin || opts.visual.linkedinUrl,
      redesExtra: extrasDeRedes(opts.redes),
    },
    logoSrc: opts.logoSrc,
    servicos: opts.servicos,
    profissionais: opts.profissionais,
    // Serviços e fotos acompanham o formulário desde cedo; equipe só quando o cliente nomeou alguém.
    aplicarServicos: opts.servicos.some((s) => s.nome.trim()),
    aplicarProfissionais: temPro,
    aplicarVisual: opts.etapa >= 2,
    preservarModeloQuandoVazio: true,
    fotos: opts.fotos,
    bairroModelo: String(endModelo.bairro || ""),
    cidadeModelo: String(endModelo.cidade || ""),
  });

  // Sem nomes reais: não mostra a equipe inventada do modelo.
  if (!temPro) {
    const blocoPro = { ...((site.profissionais as Record<string, unknown>) || {}) };
    blocoPro.itens = [];
    site.profissionais = blocoPro;
  }

  // Nunca herda WhatsApp/e-mail/telefone do exemplo — só o que o cliente digitou.
  const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
  if (!opts.whatsapp.trim()) {
    empresa.whatsapp = "";
    empresa.whatsapp_label = "";
    empresa.telefone = "";
    empresa.telefone_label = "";
  }
  if (!opts.email.trim()) empresa.email = "";
  if (opts.horario?.trim()) empresa.horario_resumo = opts.horario.trim().slice(0, 80);
  site.empresa = empresa;

  // Ofertas e eventos do exemplo não aparecem como se fossem do cliente.
  const promocoes = { ...((site.promocoes as Record<string, unknown>) || {}) };
  promocoes.itens = [];
  site.promocoes = promocoes;
  const eventos = { ...((site.eventos as Record<string, unknown>) || {}) };
  eventos.itens = [];
  site.eventos = eventos;

  // Sem endereço do cliente: não deixa “Venha à Atalaia” do modelo.
  if (!opts.bairro.trim() && !opts.cidade.trim()) {
    const contato = { ...((site.contato as Record<string, unknown>) || {}) };
    if (/^venha\b/i.test(String(contato.titulo || ""))) {
      contato.titulo = "Onde estamos";
      site.contato = contato;
    }
  }

  aplicarCopiaNoSite(site, opts.copia);

  if (opts.nome.trim()) {
    const rodape = { ...((site.rodape as Record<string, unknown>) || {}) };
    const cidade = opts.cidade.trim();
    rodape.texto = opts.rodapeTexto?.trim()
      ? opts.rodapeTexto.trim().slice(0, 160)
      : cidade
        ? `${opts.nome.trim()} · ${cidade}`
        : opts.nome.trim();
    if (opts.rodapeLinks) rodape.links = opts.rodapeLinks;
    site.rodape = rodape;
  }
  if (opts.menu?.length) {
    const header = { ...((site.header as Record<string, unknown>) || {}) };
    header.menu = opts.menu;
    if (opts.botaoAgendar?.trim()) header.botao_agendar = opts.botaoAgendar.trim().slice(0, 28);
    site.header = header;
  }
  if (opts.diferenciais && opts.diferenciais.length >= 3) {
    const bloco = { ...((site.diferenciais as Record<string, unknown>) || {}) };
    const atuais = Array.isArray(bloco.itens) ? (bloco.itens as Record<string, unknown>[]) : [];
    bloco.itens = opts.diferenciais.slice(0, 6).map((item, i) => ({
      ...(atuais[i] || atuais[0] || {}),
      id: String((atuais[i] || {}).id || `dif_extra_${i + 1}`),
      titulo: item.titulo,
      descricao: item.descricao,
      icone: (atuais[i] || atuais[0] || {}).icone || "check",
    }));
    site.diferenciais = bloco;
  }

  return site;
}
