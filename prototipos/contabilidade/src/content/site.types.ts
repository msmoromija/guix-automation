export interface Imagem {
  id: string;
  src: string;
  alt: string;
  categoria: string;
}

export interface Meta {
  schema_version: string;
  nicho: string;
  template_id: string;
  locale: string;
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

export interface Rede {
  id: string;
  label: string;
  url: string;
}

export interface Expediente {
  dia: string;
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

export interface Header {
  botao_agendar: string;
  menu: MenuItem[];
}

export interface Hero {
  titulo: string;
  subtitulo: string;
  botao_principal: string;
  botao_secundario: string;
  imagem: Imagem;
}

export interface Sobre {
  titulo: string;
  paragrafos: string[];
  imagem: Imagem;
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

export interface Servicos {
  titulo: string;
  subtitulo: string;
  itens: Servico[];
}

export interface Profissional {
  id: string;
  nome: string;
  cargo: string;
  descricao: string;
  whatsapp: string;
  foto: Imagem;
}

export interface Profissionais {
  titulo: string;
  subtitulo: string;
  itens: Profissional[];
}

export interface Diferencial {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
}

export interface Diferenciais {
  titulo: string;
  itens: Diferencial[];
}

export interface Promocao {
  id: string;
  titulo: string;
  descricao: string;
  validade: string;
  validade_label: string;
  imagem: Imagem;
}

export interface Promocoes {
  titulo: string;
  itens: Promocao[];
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

export interface Eventos {
  titulo: string;
  itens: Evento[];
}

export interface GaleriaItem {
  id: string;
  legenda: string;
  imagem: Imagem;
}

export interface Galeria {
  titulo: string;
  itens: GaleriaItem[];
}

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface Faq {
  titulo: string;
  itens: FaqItem[];
}

export interface Formulario {
  titulo: string;
  label_nome: string;
  label_telefone: string;
  label_email: string;
  label_mensagem: string;
  botao: string;
}

export interface Contato {
  titulo: string;
  subtitulo: string;
  formulario: Formulario;
}

export interface Agendamento {
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
}

export interface ObrigadoBloco {
  titulo: string;
  texto: string;
}

export interface Obrigado {
  agendamento: ObrigadoBloco;
  contato: ObrigadoBloco;
  botao_whatsapp: string;
  botao_inicio: string;
}

export interface Privacidade {
  titulo: string;
  paragrafos: string[];
}

export interface Rodape {
  texto: string;
  links: MenuItem[];
}

export interface Site {
  meta: Meta;
  empresa: Empresa;
  tema: Tema;
  seo: Seo;
  header: Header;
  hero: Hero;
  sobre: Sobre;
  servicos: Servicos;
  profissionais: Profissionais;
  diferenciais: Diferenciais;
  promocoes: Promocoes;
  eventos: Eventos;
  galeria: Galeria;
  faq: Faq;
  contato: Contato;
  agendamento: Agendamento;
  obrigado: Obrigado;
  privacidade: Privacidade;
  rodape: Rodape;
}
