export interface Imagem {
  id: string;
  src: string;
  alt: string;
  categoria: string;
}

export interface Rede {
  id: string;
  label: string;
  url: string;
}

export type DiaKey = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

export interface Expediente {
  dia: string;
  label: string;
  intervalos: string[];
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
  redes: Rede[];
  expediente: Expediente[];
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
  radius: string;
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
  id: string;
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
  icone: string;
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

export interface ObrigadoTexto {
  titulo: string;
  texto: string;
}

export interface Site {
  meta: { schema_version: string; nicho: string; template_id: string; locale: string };
  empresa: Empresa;
  tema: Tema;
  seo: Seo;
  header: { botao_agendar: string; menu: MenuItem[] };
  hero: {
    titulo: string;
    subtitulo: string;
    botao_principal: string;
    botao_secundario: string;
    imagem: Imagem;
  };
  sobre: { titulo: string; paragrafos: string[]; imagem: Imagem };
  servicos: { titulo: string; subtitulo: string; itens: Servico[] };
  profissionais: { titulo: string; subtitulo: string; itens: Profissional[] };
  diferenciais: { titulo: string; itens: Diferencial[] };
  promocoes: { titulo: string; itens: Promocao[] };
  eventos: { titulo: string; itens: Evento[] };
  galeria: { titulo: string; itens: GaleriaItem[] };
  faq: { titulo: string; itens: FaqItem[] };
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
    agendamento: ObrigadoTexto;
    contato: ObrigadoTexto;
    botao_whatsapp: string;
    botao_inicio: string;
  };
  privacidade: { titulo: string; paragrafos: string[] };
  rodape: { texto: string; links: MenuItem[] };
}
