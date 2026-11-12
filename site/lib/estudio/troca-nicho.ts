import type { Nicho } from "@/lib/media/tipos";
import { nichos } from "@/lib/nichos";

const ALIASES: Record<Nicho, string[]> = {
  barbearia: ["barbearia", "barbeiro", "barbearias"],
  salao: ["salao de beleza", "salao", "cabeleireiro", "cabeleireira"],
  estetica: ["estetica", "esteticista", "spa"],
  petshop: ["pet shop", "petshop", "banho e tosa", "tosador"],
  academia: ["academia", "academias", "personal trainer"],
  contabilidade: ["contabilidade", "contador", "contadora", "escritorio contabil"],
  advocacia: ["advocacia", "advogado", "advogada", "escritorio juridico"],
  dentista: ["odontologia", "odontologico", "dentista", "dentistas", "consultorio odontologico"],
  clinica: ["clinica medica", "clinica", "medico", "medica"],
  psicologia: ["psicologia", "psicologo", "psicologa", "terapia"],
  nutricionista: ["nutricionista", "nutricao", "nutricionistas"],
  generico: ["negocio local", "empresa local", "generico"],
};

const INTENCAO_TROCA = /\b(?:mude|mudar|troque|trocar|altere|alterar|transforme|transformar|converta|converter|modelo|tema|nicho|segmento|agora somos|agora sou|agora e|sou um|sou uma|somos um|somos uma|e um|e uma)\b/;
const PALAVRAS_SEM_ACAO = new Set([
  "agora", "altere", "alterar", "a", "as", "com", "de", "do", "da", "e", "em", "esse", "esta",
  "este", "eu", "ele", "mude", "mudar", "meu", "minha", "modelo", "tema", "na", "no", "nicho", "o", "os", "para",
  "por", "pra", "porfavor", "quero", "segmento", "site", "so", "somos", "sou", "troca", "troque",
  "trocar", "um", "uma", "agora", "transforma", "transforme", "converta", "converter", "apenas", "somente",
  "pedi", "pedido", "pedir", "desejo", "me", "por", "favor", "para", "o", "a", "no", "na", "ele",
]);

function normalizar(texto: string) {
  return texto.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function detectarNichoSolicitado(pedido: string): Nicho | null {
  const texto = normalizar(pedido);
  const encontrados: { nicho: Nicho; indice: number; tamanho: number }[] = [];
  for (const [nicho, aliases] of Object.entries(ALIASES) as [Nicho, string[]][]) {
    for (const alias of aliases) {
      const termo = normalizar(alias);
      const regex = new RegExp(`(^|[^a-z0-9])${termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "g");
      for (const match of texto.matchAll(regex)) {
        encontrados.push({ nicho, indice: match.index || 0, tamanho: termo.length });
      }
    }
  }
  if (!encontrados.length || !INTENCAO_TROCA.test(texto)) return null;
  encontrados.sort((a, b) => b.indice - a.indice || b.tamanho - a.tamanho);
  const destinosComIndicador = encontrados.filter(({ indice }) => {
    const antes = texto.slice(0, indice);
    return /\b(?:para|pra|como|quero|prefiro|sou (?:um|uma)|somos (?:um|uma)|agora e|e um|e uma)\s*$/.test(antes);
  });
  if (destinosComIndicador.length) return destinosComIndicador[0].nicho;
  return encontrados[0].nicho;
}

export function pedidoApenasTrocaNicho(pedido: string, nicho: Nicho) {
  let restante = normalizar(pedido);
  for (const aliases of Object.values(ALIASES)) {
    for (const alias of aliases) {
      const termo = normalizar(alias);
      restante = restante.replace(
        new RegExp(`(^|[^a-z0-9])${termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "g"),
        " ",
      );
    }
  }
  const pedeApenasTroca = /\b(so|somente|apenas)\b/.test(restante);
  const pedeOutrasEdicoes = /\b(foto|fotos|imagem|imagens|midia|servico|servicos|preco|valor|horario|expediente|equipe|profissional|contato|telefone|whatsapp|email|endereco|cidade|bairro|cor|cores|visual|fonte|fontes|cabecalho|rodape|evento|eventos|faq|marca|logo|mude|mudar|troque|trocar|adicione|adicionar|remova|remover|reescreva|alterar tambem)\b/.test(restante);
  if (pedeApenasTroca && !pedeOutrasEdicoes) return true;
  const palavras = restante.match(/[a-z0-9]+/g) || [];
  return palavras.filter((palavra) => !PALAVRAS_SEM_ACAO.has(palavra)).length === 0;
}

type Registro = Record<string, unknown>;

const CHECKLISTS: Record<Nicho, { servicos: string[]; secoes: string[]; naoInventar: string[] }> = {
  barbearia: {
    servicos: ["Corte", "Barba", "Acabamento"],
    secoes: ["serviços", "equipe opcional", "agendamento", "contato"],
    naoInventar: ["nomes da equipe", "preços", "horários", "endereço"],
  },
  salao: {
    servicos: ["Corte", "Escova", "Coloração"],
    secoes: ["serviços", "equipe opcional", "agendamento", "contato"],
    naoInventar: ["nomes da equipe", "preços", "horários", "endereço"],
  },
  estetica: {
    servicos: ["Limpeza de pele", "Massagem", "Sobrancelhas"],
    secoes: ["serviços", "ambiente", "agendamento", "contato"],
    naoInventar: ["procedimentos oferecidos", "preços", "resultados", "profissionais"],
  },
  petshop: {
    servicos: ["Banho", "Tosa", "Cuidados para pets"],
    secoes: ["serviços", "pets atendidos a confirmar", "agendamento", "contato"],
    naoInventar: ["porte atendido", "preços", "equipe", "serviços veterinários"],
  },
  academia: {
    servicos: ["Musculação", "Treino acompanhado", "Aulas"],
    secoes: ["atividades", "estrutura", "planos a confirmar", "contato"],
    naoInventar: ["planos", "preços", "horários", "professores"],
  },
  contabilidade: {
    servicos: ["Abertura de empresa", "Orientação contábil", "Imposto de renda"],
    secoes: ["serviços contábeis", "atendimento", "documentos a confirmar", "contato"],
    naoInventar: ["registros profissionais", "preços", "prazos", "resultados fiscais"],
  },
  advocacia: {
    servicos: ["Consulta jurídica", "Orientação", "Análise de documentos"],
    secoes: ["áreas de atuação a confirmar", "consulta", "contato"],
    naoInventar: ["casos atendidos", "resultados", "preços", "número da OAB"],
  },
  dentista: {
    servicos: ["Consulta odontológica", "Limpeza", "Restauração"],
    secoes: ["serviços odontológicos", "estrutura", "agendamento", "contato"],
    naoInventar: ["procedimentos oferecidos", "preços", "profissionais", "resultados clínicos"],
  },
  clinica: {
    servicos: ["Consulta", "Acompanhamento", "Avaliação"],
    secoes: ["especialidades a confirmar", "equipe opcional", "agendamento", "contato"],
    naoInventar: ["especialidades", "profissionais", "preços", "resultados clínicos"],
  },
  psicologia: {
    servicos: ["Atendimento individual", "Acompanhamento", "Orientação inicial"],
    secoes: ["modalidades a confirmar", "atendimento", "contato"],
    naoInventar: ["diagnósticos", "resultados terapêuticos", "preços", "profissionais"],
  },
  nutricionista: {
    servicos: ["Avaliação nutricional", "Orientação alimentar", "Acompanhamento"],
    secoes: ["atendimentos", "acompanhamento", "contato"],
    naoInventar: ["planos específicos", "resultados", "preços", "profissionais"],
  },
  generico: {
    servicos: ["Atendimento", "Orientação", "Serviço sob consulta"],
    secoes: ["serviços", "sobre o negócio", "contato"],
    naoInventar: ["serviços específicos", "preços", "horários", "equipe"],
  },
};

export function checklistDoNicho(nicho: Nicho) {
  return CHECKLISTS[nicho] || CHECKLISTS.generico;
}

export type DadosFornecidos = {
  nome?: string;
  slogan?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  redes?: Record<string, string>;
  horario?: string;
  expediente?: { dia: string; label: string; intervalos: string[] }[];
  enderecoCompleto?: string;
};

function registro(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Registro) : {};
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

export function prepararModeloParaTransicao(modeloIn: Registro, nicho: Nicho, dados: DadosFornecidos = {}): Registro {
  const modelo = clonar(modeloIn);
  const checklist = checklistDoNicho(nicho);
  const rotuloNicho = nichos.find((item) => item.slug === nicho)?.nome || "negócio local";
  const meta = registro(modelo.meta);
  meta.nicho = nicho;
  modelo.meta = meta;

  const empresa = registro(modelo.empresa);
  empresa.nome = String(dados.nome || "").trim();
  empresa.slogan = String(dados.slogan || "").trim();
  empresa.cnpj = "";
  const whatsapp = String(dados.whatsapp || "").trim();
  empresa.telefone = whatsapp.replace(/\D/g, "").replace(/^55/, "");
  empresa.telefone_label = whatsapp;
  empresa.whatsapp = whatsapp;
  empresa.whatsapp_label = whatsapp;
  empresa.whatsapp_mensagem = whatsapp ? `Olá, vim pelo site de ${empresa.nome || "vocês"} e quero saber mais.` : "";
  empresa.whatsapp_aria = whatsapp ? `Chamar ${empresa.nome || "no WhatsApp"}` : "";
  empresa.email = String(dados.email || "").trim();
  empresa.horario_resumo = String(dados.horario || "").trim();
  empresa.expediente = Array.isArray(dados.expediente) ? dados.expediente : [];
  empresa.redes = Object.entries(dados.redes || {})
    .filter(([, url]) => String(url || "").trim())
    .map(([id, url]) => ({ id, label: id, url: String(url).trim() }));
  const endereco = {
    logradouro: "",
    numero: String(dados.numero || "").trim(),
    complemento: "",
    bairro: String(dados.bairro || "").trim(),
    cidade: String(dados.cidade || "").trim(),
    estado: String(dados.estado || "").trim(),
    cep: String(dados.cep || "").trim(),
    completo: "",
    mapa_embed_url: "",
  };
  endereco.logradouro = String(dados.logradouro || "").trim();
  const partesEndereco = [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(", "),
    [endereco.bairro, [endereco.cidade, endereco.estado].filter(Boolean).join(" - ")].filter(Boolean).join(", "),
  ].filter(Boolean);
  endereco.completo = String(dados.enderecoCompleto || "").trim() || partesEndereco.join(" — ");
  empresa.endereco = endereco;
  empresa.logo = { ...registro(empresa.logo), src: "", alt: "", credito: undefined };
  modelo.empresa = empresa;

  const hero = registro(modelo.hero);
  hero.titulo = `Atendimento em ${rotuloNicho.toLocaleLowerCase("pt-BR")}`;
  hero.subtitulo = `Consulte quais atendimentos estão disponíveis e confirme os detalhes diretamente com o negócio.`;
  hero.botao_principal = "Consultar atendimento";
  hero.botao_secundario = "Falar com o negócio";
  if (String(registro(hero.imagem).src || "")) {
    hero.imagem = { ...registro(hero.imagem), alt: `Imagem ilustrativa de ${rotuloNicho.toLocaleLowerCase("pt-BR")}` };
  }
  modelo.hero = hero;

  const sobre = registro(modelo.sobre);
  sobre.titulo = `Sobre ${rotuloNicho.toLocaleLowerCase("pt-BR")}`;
  sobre.paragrafos = [
    `Esta página apresenta possibilidades comuns ao segmento de ${rotuloNicho.toLocaleLowerCase("pt-BR")}.`,
    "As opções, condições e informações específicas devem ser confirmadas diretamente com o negócio.",
  ];
  if (String(registro(sobre.imagem).src || "")) {
    sobre.imagem = { ...registro(sobre.imagem), alt: `Imagem ilustrativa de ${rotuloNicho.toLocaleLowerCase("pt-BR")}` };
  }
  modelo.sobre = sobre;

  const servicosModelo = registro(modelo.servicos);
  const itensModelo = Array.isArray(servicosModelo.itens) ? (servicosModelo.itens as Registro[]) : [];
  servicosModelo.titulo = "Possibilidades de atendimento";
  servicosModelo.subtitulo = "Sugestões do segmento; confirme serviços, valores e duração diretamente com o negócio.";
  servicosModelo.itens = checklist.servicos.map((nome, indice) => {
    const base = registro(itensModelo[indice]);
    const imagem = registro(base.imagem);
    return {
      id: String(base.id || `srv_${nicho}_${indice + 1}`),
      nome,
      descricao: "Possibilidade de atendimento do segmento. Confirme disponibilidade e detalhes com o negócio.",
      preco: 0,
      preco_label: "Consulte valores",
      duracao_minutos: 0,
      duracao_label: "A confirmar",
      imagem: {
        id: String(imagem.id || `img_srv_${nicho}_${indice + 1}`),
        src: String(imagem.src || ""),
        alt: "Imagem ilustrativa",
        categoria: "servico",
      },
    };
  });
  modelo.servicos = servicosModelo;

  const profissionais = registro(modelo.profissionais);
  profissionais.titulo = "Quem atende";
  profissionais.subtitulo = "Os nomes da equipe serão exibidos quando forem informados.";
  profissionais.itens = [];
  modelo.profissionais = profissionais;

  modelo.eventos = { ...registro(modelo.eventos), titulo: "Agenda", itens: [] };
  modelo.promocoes = { ...registro(modelo.promocoes), titulo: "Condições", itens: [] };
  const header = registro(modelo.header);
  header.botao_agendar = "Consultar atendimento";
  header.menu = [
    { id: "inicio", label: "Início", href: "#inicio" },
    { id: "sobre", label: "Sobre", href: "#sobre" },
    { id: "servicos", label: "Atendimentos", href: "#servicos" },
    { id: "faq", label: "Dúvidas", href: "#faq" },
    { id: "contato", label: "Contato", href: "#contato" },
  ];
  modelo.header = header;
  modelo.contato = {
    ...registro(modelo.contato),
    titulo: "Fale com o negócio",
    subtitulo: "Consulte opções e disponibilidade diretamente.",
    formulario: {
      ...registro(registro(modelo.contato).formulario),
      titulo: "Enviar uma mensagem",
      label_nome: "Seu nome",
      label_telefone: "Telefone ou WhatsApp",
      label_email: "E-mail",
      label_mensagem: "Mensagem",
      botao: "Enviar mensagem",
    },
  };
  modelo.rodape = { ...registro(modelo.rodape), texto: "", links: [] };
  const galeria = registro(modelo.galeria);
  galeria.itens = (Array.isArray(galeria.itens) ? galeria.itens : []).map((item) => {
    const linha = registro(item);
    return { ...linha, legenda: "", imagem: { ...registro(linha.imagem), alt: "Imagem ilustrativa" } };
  });
  modelo.galeria = galeria;
  const seoOg = registro(registro(modelo.seo).og_image);
  modelo.seo = { ...registro(modelo.seo), og_image: { ...seoOg, alt: "Imagem ilustrativa" } };

  const faq = registro(modelo.faq);
  faq.titulo = "Dúvidas";
  faq.itens = [
    {
      id: "faq_servicos",
      pergunta: "Quais atendimentos estão disponíveis?",
      resposta: "As opções exibidas são sugestões do segmento. Confirme diretamente com o negócio o que é oferecido.",
    },
    {
      id: "faq_valores",
      pergunta: "Como confirmo valores e horários?",
      resposta: "Consulte o negócio para confirmar valores, duração e disponibilidade.",
    },
  ];
  modelo.faq = faq;

  const agendamento = registro(modelo.agendamento);
  modelo.agendamento = {
    ...agendamento,
    titulo: "Consultar atendimento",
    subtitulo: "Confirme opções e disponibilidade diretamente com o negócio.",
    passo_servico: "Atendimento",
    passo_profissional: "Profissional",
    passo_data: "Dia",
    passo_horario: "Horário",
    passo_dados: "Seus dados",
    placeholder_observacao: "Escreva uma observação, se necessário.",
    fechado: "Os horários precisam ser confirmados com o negócio.",
    erro_campos: "Confira os dados solicitados antes de continuar.",
  };
  modelo.obrigado = {
    agendamento: {
      titulo: "Solicitação preparada",
      texto: "Confira as informações e confirme os detalhes com o negócio.",
    },
    contato: {
      titulo: "Mensagem preparada",
      texto: "Confira sua mensagem antes de enviá-la.",
    },
    botao_whatsapp: "Falar com o negócio",
    botao_inicio: "Voltar ao início",
  };
  modelo.privacidade = {
    titulo: "Privacidade",
    paragrafos: [
      "Os dados enviados são usados para responder à solicitação feita nesta página.",
      "Para saber como as informações são armazenadas, utilizadas ou excluídas, consulte o responsável pelo negócio.",
    ],
  };

  const contato = registro(modelo.contato);
  contato.titulo = "Fale com o negócio";
  contato.subtitulo = "Consulte informações e disponibilidade antes de agendar.";
  modelo.contato = contato;

  const diferenciais = registro(modelo.diferenciais);
  diferenciais.titulo = "Informações do segmento";
  diferenciais.itens = [
    { id: "dif_servicos", titulo: "Opções a confirmar", descricao: `Possibilidades comuns: ${checklist.servicos.join(", ")}.`, icone: "check" },
    { id: "dif_detalhes", titulo: "Informações atualizadas", descricao: "Confirme serviços e condições diretamente com o negócio.", icone: "message-circle" },
    { id: "dif_agenda", titulo: "Disponibilidade", descricao: "Consulte os horários antes de solicitar um atendimento.", icone: "calendar" },
  ];
  modelo.diferenciais = diferenciais;

  const seo = registro(modelo.seo);
  seo.title = `${rotuloNicho} | Serviços e informações`;
  seo.description = `Consulte os serviços de ${rotuloNicho.toLocaleLowerCase("pt-BR")} e confirme valores e disponibilidade diretamente com o negócio.`;
  seo.keywords = checklist.servicos.map((item) => item.toLocaleLowerCase("pt-BR"));
  seo.og_title = seo.title;
  seo.og_description = seo.description;
  modelo.seo = seo;

  return modelo;
}
