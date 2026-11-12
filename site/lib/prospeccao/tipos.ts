export type StatusLead =
  | "novo"
  | "mensagem_gerada"
  | "enviado"
  | "respondeu"
  | "descartado";

export const STATUS_LEAD: StatusLead[] = [
  "novo",
  "mensagem_gerada",
  "enviado",
  "respondeu",
  "descartado",
];

export function rotuloStatus(s: StatusLead): string {
  switch (s) {
    case "novo":
      return "Novo";
    case "mensagem_gerada":
      return "Mensagem gerada";
    case "enviado":
      return "Enviado";
    case "respondeu":
      return "Respondeu";
    case "descartado":
      return "Descartado";
  }
}

export type Lead = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  nicho: string;
  endereco: string;
  categoria?: string;
  status: StatusLead;
  data_ultimo_contato: string | null;
  conta_whatsapp: string | null;
  modelo_usado: string | null;
  mensagem_gerada: string | null;
  observacoes: string;
  external_id: string | null;
  fonte: string;
  created_at: string;
  updated_at: string;
};

export type ContaWhatsApp = {
  id: string;
  nome: string;
  limite_diario: number;
};

export type NichoProspecção = {
  slug: string;
  nome: string;
  modelo_url: string;
  termos_busca: string[];
  categorias_foursquare?: string[];
};

export type TemplateMensagem = {
  id: string;
  nome: string;
  texto: string;
};

export type ConfigProspecção = {
  atualizadoEm: string;
  api: {
    provedor: string;
    chave: string;
    endpoint_busca: string;
    endpoint_detalhes: string;
  };
  contas: ContaWhatsApp[];
  nichos: NichoProspecção[];
  templates: TemplateMensagem[];
  template_ativo: string;
  periodo_recontato_dias: number;
};

/** Contadores diários por conta: { contaId: { "YYYY-MM-DD": n } } */
export type ContadoresDiários = Record<string, Record<string, number>>;
