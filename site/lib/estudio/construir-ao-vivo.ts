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
    enderecoCompleto?: string;
    eventos?: { titulo: string; descricao: string; dataLabel: string; horario: string }[];
    faqs?: { titulo: string; itens: { pergunta: string; resposta: string }[] };
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
  empresa.cnpj = "";
  empresa.horario_resumo = opts.horario?.trim().slice(0, 160) || "";
  if (!opts.whatsapp.trim()) {
    empresa.whatsapp_mensagem = "";
    empresa.whatsapp_aria = "";
  } else {
    empresa.whatsapp_mensagem = `Olá, vim pelo site de ${opts.nome.trim() || "vocês"} e quero agendar.`;
    empresa.whatsapp_aria = `Chamar ${opts.nome.trim() || "no WhatsApp"}`;
  }
  const temRede = Object.values(opts.redes || {}).some((u) => String(u || "").trim());
  if (!temRede) empresa.redes = [];
  const digitouLugar = Boolean(
    opts.logradouro.trim() || opts.numero.trim() || opts.bairro.trim() || opts.cidade.trim() || opts.cep.trim() || opts.enderecoCompleto?.trim(),
  );
  const endAtual = { ...((empresa.endereco as Record<string, unknown>) || {}) };
  if (!digitouLugar) {
    endAtual.logradouro = "";
    endAtual.numero = "";
    endAtual.bairro = "";
    endAtual.cidade = "";
    endAtual.completo = "";
  } else if (!opts.enderecoCompleto?.trim()) {
    const rua = [opts.logradouro.trim(), opts.numero.trim()].filter(Boolean).join(", ");
    const cidadeUf = [opts.cidade.trim(), opts.estado.trim()].filter(Boolean).join(" - ");
    const resto = [opts.bairro.trim(), cidadeUf].filter(Boolean).join(", ");
    endAtual.logradouro = opts.logradouro.trim();
    endAtual.numero = opts.numero.trim();
    endAtual.bairro = opts.bairro.trim();
    endAtual.cidade = opts.cidade.trim();
    if (/^[A-Za-z]{2}$/.test(opts.estado.trim())) endAtual.estado = opts.estado.trim().toUpperCase();
    endAtual.cep = opts.cep.trim();
    endAtual.completo = [rua, resto].filter(Boolean).join(" — ");
  }
  empresa.endereco = endAtual;
  site.empresa = empresa;

  // Ofertas e eventos do exemplo não aparecem como se fossem do cliente.
  const promocoes = { ...((site.promocoes as Record<string, unknown>) || {}) };
  promocoes.itens = [];
  site.promocoes = promocoes;
  const eventos = { ...((site.eventos as Record<string, unknown>) || {}) };
  if (opts.eventos) {
    eventos.titulo = opts.eventos.length ? "Agenda" : String(eventos.titulo || "Agenda");
    eventos.itens = opts.eventos.slice(0, 4).map((item, i) => ({
      id: `evt_cliente_${i + 1}`,
      titulo: item.titulo.trim() || "Evento",
      descricao: item.descricao.trim(),
      data: "2026-12-01",
      data_label: item.dataLabel.trim() || "A definir",
      horario: /^\d{2}:\d{2}$/.test(item.horario) ? item.horario : "19:00",
      imagem: { id: `img_evt_cliente_${i + 1}`, src: "", alt: item.titulo || "Evento", categoria: "evento" },
    }));
  } else {
    eventos.itens = [];
  }
  site.eventos = eventos;
  if (opts.enderecoCompleto?.trim()) {
    const empresaEnd = { ...((site.empresa as Record<string, unknown>) || {}) };
    const end = { ...((empresaEnd.endereco as Record<string, unknown>) || {}) };
    end.completo = opts.enderecoCompleto.trim().slice(0, 180);
    empresaEnd.endereco = end;
    site.empresa = empresaEnd;
  }

  // Sem endereço do cliente: não deixa “Venha à Atalaia” do modelo.
  if (!opts.bairro.trim() && !opts.cidade.trim()) {
    const contato = { ...((site.contato as Record<string, unknown>) || {}) };
    if (/^venha\b/i.test(String(contato.titulo || ""))) {
      contato.titulo = "Onde estamos";
      site.contato = contato;
    }
  }

  aplicarCopiaNoSite(site, opts.copia);

  if (opts.faqs) {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    faq.titulo = opts.faqs.titulo.trim().slice(0, 80) || "Dúvidas";
    faq.itens = opts.faqs.itens
      .filter((item) => item.pergunta.trim() && item.resposta.trim())
      .slice(0, 10)
      .map((item, i) => ({
        id: `faq_${String(i + 1).padStart(2, "0")}`,
        pergunta: item.pergunta.trim().slice(0, 180),
        resposta: item.resposta.trim().slice(0, 400),
      }));
    site.faq = faq;
  }

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
  if (opts.menu?.length || opts.botaoAgendar?.trim()) {
    const header = { ...((site.header as Record<string, unknown>) || {}) };
    if (opts.menu?.length) header.menu = opts.menu;
    if (opts.botaoAgendar?.trim()) header.botao_agendar = opts.botaoAgendar.trim().slice(0, 40);
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
