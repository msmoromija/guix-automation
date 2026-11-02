import type { CreditoUnsplash, Nicho } from "@/lib/media/tipos";

export interface EntradaAutomacao {
  clienteId: string;
  nicho: Nicho;
  nome: string;
  slogan?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  cnpj?: string;
  servicos?: string[];
  tom?: string;
  estilo?: string;
  destaque?: string;
  iaEscreve?: boolean;
  /** Imagens já aprovadas do cliente (isoladas) — têm prioridade sobre a biblioteca. */
  imagensCliente?: Array<{
    categoria: string;
    src: string;
    alt?: string;
    origem: "upload" | "unsplash" | "biblioteca";
    credito?: CreditoUnsplash;
  }>;
}

export interface ResultadoAutomacao {
  clienteId: string;
  site: Record<string, unknown>;
  avisos: string[];
  imagens: Array<{
    categoria: string;
    src?: string;
    origem: string;
    r2_key?: string;
  }>;
}
