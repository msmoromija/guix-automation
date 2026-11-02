export const SCHEMA_VERSION = "1.0.0" as const;

export const NICHOS = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "clinica",
  "generico",
] as const;

export type Nicho = (typeof NICHOS)[number];

export const ICONES = [
  "calendar",
  "clock",
  "map-pin",
  "phone",
  "message-circle",
  "scissors",
  "sparkles",
  "star",
  "shield",
  "users",
  "award",
  "heart",
  "leaf",
  "paw-print",
  "scale",
  "dumbbell",
  "home",
  "check",
] as const;

export type Icone = (typeof ICONES)[number];

export const CATEGORIAS_IMAGEM = [
  "logo",
  "hero",
  "sobre",
  "servico",
  "profissional",
  "promocao",
  "evento",
  "galeria",
  "og",
] as const;

export type CategoriaImagem = (typeof CATEGORIAS_IMAGEM)[number];

export const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

export type DiaSemana = (typeof DIAS)[number];

/** Origem da foto — biblioteca própria, Unsplash (via API) ou upload do cliente. */
export type OrigemImagem = "biblioteca" | "unsplash" | "upload";

/** Crédito obrigatório quando origem === "unsplash" (mesmo espelhada no R2). */
export interface CreditoImagem {
  fotografo: string;
  perfil_url: string;
  unsplash_url?: string;
  texto: string;
}

export interface Imagem {
  id: string;
  src: string;
  alt: string;
  categoria: CategoriaImagem;
  /** Opcional — painel / R2. Ausente = foto de demo ou biblioteca sem crédito. */
  origem?: OrigemImagem;
  credito?: CreditoImagem;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  completo: string;
  mapa_embed_url: string;
}

export interface RedeSocial {
  id: "instagram" | "facebook" | "tiktok" | "youtube";
  label: string;
  url: string;
}

export interface ExpedienteDia {
  dia: DiaSemana;
  label: string;
  intervalos: string[];
}

export interface Empresa {
  nome: string;
  slogan: string;
  cnpj: string;
  logo: Imagem;
  telefone: string;
  telefone_label: string;
  whatsapp: string;
  whatsapp_label: string;
  whatsapp_mensagem: string;
  whatsapp_aria: string;
  email: string;
  endereco: Endereco;
  redes: RedeSocial[];
  expediente: ExpedienteDia[];
  horario_resumo: string;
}

export interface Tema {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  color_surface: string;
  color_text: string;
  color_text_muted: string;
  font_heading: string;
  font_body: string;
  radius: "none" | "sm" | "md" | "lg";
}

export interface Seo {
  title: string;
  description: string;
  keywords: string[];
  og_title: string;
  og_description: string;
  og_image: Imagem;
  canonical_url: string;
}

export interface MenuItem {
  id: "inicio" | "sobre" | "servicos" | "profissionais" | "promocoes" | "faq" | "contato";
  label: string;
  href: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_label: string;
  duracao_minutos: number;
  duracao_label: string;
  imagem: Imagem;
}

export interface Profissional {
  id: string;
  nome: string;
  cargo: string;
  descricao: string;
  whatsapp: string;
  foto: Imagem;
}

export interface Diferencial {
  id: string;
  titulo: string;
  descricao: string;
  icone: Icone;
}

export interface Promocao {
  id: string;
  titulo: string;
  descricao: string;
  validade: string;
  validade_label: string;
  imagem: Imagem;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  data_label: string;
  horario: string;
  imagem: Imagem;
}

export interface GaleriaItem {
  id: string;
  legenda: string;
  imagem: Imagem;
}

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface Lead {
  tipo: "agendamento" | "contato";
  servico_id: string;
  profissional_id: string;
  data: string;
  horario: string;
  nome: string;
  telefone: string;
  email: string;
  mensagem: string;
}

export interface SiteContent {
  meta: {
    schema_version: typeof SCHEMA_VERSION;
    nicho: Nicho;
    template_id: string;
    locale: "pt-BR";
  };
  empresa: Empresa;
  tema: Tema;
  seo: Seo;
  header: {
    botao_agendar: string;
    menu: MenuItem[];
  };
  hero: {
    titulo: string;
    subtitulo: string;
    botao_principal: string;
    botao_secundario: string;
    imagem: Imagem;
  };
  sobre: {
    titulo: string;
    paragrafos: string[];
    imagem: Imagem;
  };
  servicos: {
    titulo: string;
    subtitulo: string;
    itens: Servico[];
  };
  profissionais: {
    titulo: string;
    subtitulo: string;
    itens: Profissional[];
  };
  diferenciais: {
    titulo: string;
    itens: Diferencial[];
  };
  promocoes: {
    titulo: string;
    itens: Promocao[];
  };
  eventos: {
    titulo: string;
    itens: Evento[];
  };
  galeria: {
    titulo: string;
    itens: GaleriaItem[];
  };
  faq: {
    titulo: string;
    itens: FaqItem[];
  };
  contato: {
    titulo: string;
    subtitulo: string;
    formulario: {
      titulo: string;
      label_nome: string;
      label_telefone: string;
      label_email: string;
      label_mensagem: string;
      botao: string;
    };
  };
  agendamento: {
    titulo: string;
    subtitulo: string;
    passo_servico: string;
    passo_profissional: string;
    passo_data: string;
    passo_horario: string;
    passo_dados: string;
    sem_preferencia: string;
    label_nome: string;
    label_telefone: string;
    label_observacao: string;
    placeholder_observacao: string;
    botao_confirmar: string;
    fechado: string;
    erro_campos: string;
  };
  obrigado: {
    agendamento: { titulo: string; texto: string };
    contato: { titulo: string; texto: string };
    botao_whatsapp: string;
    botao_inicio: string;
  };
  privacidade: {
    titulo: string;
    paragrafos: string[];
  };
  rodape: {
    texto: string;
    links: { id: string; label: string; href: string }[];
  };
}

export const LEAD_STORAGE_KEY = "presenca.lead";
export const PROFISSIONAL_QUALQUER = "qualquer";
