import { paletaPorId, raioDoBotao, tipoPorId, type VisualConfig } from "./visual";

export function montarRascunho(opts: {
  nome: string;
  slogan?: string;
  nichoNome?: string;
  cidade?: string;
  logoSrc?: string;
  visual: VisualConfig;
  servicos: Array<{ nome: string; preco?: string; duracao?: string; descricao?: string; imagemSrc?: string }>;
  profissionais: Array<{ nome: string; cargo?: string; descricao?: string; fotoSrc?: string }>;
  whatsapp?: string;
}) {
  const paleta = paletaPorId(opts.visual.paletaId);
  const tipo = tipoPorId(opts.visual.tipografiaId);
  const nome = opts.nome.trim() || "Seu negócio";
  const slogan = opts.slogan?.trim() || "O site vai ganhando cara enquanto você preenche";
  const servicos = opts.servicos.filter((s) => s.nome.trim());
  const profissionais = opts.profissionais.filter((p) => p.nome.trim() && p.nome.trim() !== "Novo nome");

  return {
    empresa: {
      nome,
      slogan,
      whatsapp: opts.whatsapp?.replace(/\D/g, "") || undefined,
      whatsapp_mensagem: `Olá, vim pelo site de ${nome}.`,
      horario_resumo: "Seg a sáb · 9h às 19h",
      endereco: { completo: [opts.cidade].filter(Boolean).join(" · ") },
      logo: opts.logoSrc ? { src: opts.logoSrc, alt: nome } : undefined,
    },
    tema: {
      ...paleta,
      font_heading: tipo.font_heading,
      font_body: tipo.font_body,
      radius: raioDoBotao(opts.visual.botao),
    },
    header: {
      botao_agendar: "Agendar",
      menu: [
        { id: "inicio", label: "Início", href: "#inicio" },
        { id: "servicos", label: "Serviços", href: "#servicos" },
        { id: "equipe", label: "Equipe", href: "#profissionais" },
      ],
    },
    hero: {
      titulo: nome,
      subtitulo: slogan,
      botao_principal: "Quero agendar",
      botao_secundario: "WhatsApp",
    },
    servicos: {
      titulo: "Serviços",
      subtitulo: servicos.length ? "Preço e texto como você deixou nos serviços." : "Inclua os serviços à esquerda.",
      itens: (servicos.length ? servicos : []).map((s, i) => ({
        id: `ex-${i}`,
        nome: s.nome,
        descricao: s.descricao,
        preco_label: s.preco || "Sob consulta",
        duracao_label: s.duracao || "",
        imagem: s.imagemSrc ? { src: s.imagemSrc, alt: s.nome } : undefined,
      })),
    },
    profissionais: {
      titulo: "Equipe",
      subtitulo: profissionais.length ? "" : "Sem nomes — o agendamento não destina profissional.",
      itens: profissionais.map((p, i) => ({
        id: `pex-${i}`,
        nome: p.nome,
        cargo: p.cargo,
        descricao: p.descricao,
        foto: p.fotoSrc ? { src: p.fotoSrc, alt: p.nome } : undefined,
      })),
    },
    contato: {
      titulo: "Onde estamos",
      subtitulo: opts.cidade || "Cidade entra quando você preencher o endereço.",
    },
    rodape: { texto: `${nome} · rascunho` },
  };
}
