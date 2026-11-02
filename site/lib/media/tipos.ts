export type Nicho =
  | "barbearia"
  | "salao"
  | "estetica"
  | "petshop"
  | "academia"
  | "contabilidade"
  | "advocacia"
  | "clinica"
  | "generico";

export type CategoriaImagem =
  | "logo"
  | "hero"
  | "sobre"
  | "servico"
  | "profissional"
  | "promocao"
  | "evento"
  | "galeria"
  | "og";

export type OrigemImagem = "biblioteca" | "unsplash" | "upload";

/** Ciclo de vida da mídia do cliente (metadado R2 — fora do schema 1.0.0 congelado). */
export type StatusMidia = "pendente" | "aprovada" | "negada";

export interface CreditoUnsplash {
  fotografo: string;
  perfil_url: string;
  unsplash_url: string;
  texto: string;
}

export interface ImagemMidia {
  id: string;
  src: string;
  alt: string;
  categoria: CategoriaImagem;
  origem: OrigemImagem;
  nicho: Nicho;
  tags: string[];
  credito?: CreditoUnsplash;
  r2_key?: string;
  status?: StatusMidia;
  motivo?: string;
  cliente_id?: string;
}

export interface ItemCatalogo {
  id: string;
  nicho: Nicho;
  categoria: CategoriaImagem;
  key: string;
  alt: string;
  tags: string[];
  url: string;
}

export interface UnsplashFoto {
  id: string;
  descricao: string;
  url_thumb: string;
  url_regular: string;
  url_download: string;
  fotografo: string;
  perfil_url: string;
  unsplash_url: string;
}

export interface GeracaoSiteJson {
  hero: { titulo: string; subtitulo: string };
  sobre: { titulo: string; paragrafos: string[] };
  servicos: {
    titulo: string;
    subtitulo: string;
    sugestoes?: string[];
    itens?: { nome: string; descricao?: string }[];
  };
  seo?: { title?: string; description?: string; keywords?: string[] };
  faq?: { titulo?: string; itens?: { pergunta: string; resposta: string }[] };
  profissionais?: {
    titulo?: string;
    subtitulo?: string;
    itens?: { nome: string; cargo?: string; descricao?: string }[];
  };
  contato?: { titulo?: string; subtitulo?: string };
  galeria?: { titulo?: string; legendas?: string[] };
  rodape?: { texto?: string };
  imagens_sugeridas: {
    categoria: CategoriaImagem;
    tags: string[];
    motivo: string;
  }[];
}
