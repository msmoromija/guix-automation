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

/** Um evento da linha do tempo do lead (geração, envio, resposta, descarte, observação). */
export type EventoLead = {
  em: string;
  tipo: StatusLead | "observacao";
  conta_whatsapp?: string | null;
  conta_nome?: string | null;
  /** Texto exato da mensagem no momento do evento. */
  mensagem?: string | null;
  observacao?: string | null;
};

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
  /** Linha do tempo persistida — cada geração/envio/status fica registrada aqui. */
  historico?: EventoLead[];
};

/** Registro imutável de uma mensagem efetivamente enviada (log append-only no R2). */
export type EnvioRegistro = {
  id: string;
  em: string;
  lead_id: string;
  nome: string;
  telefone: string;
  nicho: string;
  conta_id: string;
  conta_nome: string;
  /** Texto exato enviado. */
  mensagem: string;
};

/** Última busca executada, guardada para não consumir cota ao reabrir o painel. */
export type UltimaBusca = {
  em: string;
  nicho: string;
  cidade: string;
  filtros: { soComTelefone: boolean; soNovos: boolean; naoContatados: boolean };
  totalBruto: number;
  resultados: unknown[];
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
  /** Nome exibido como remetente nas mensagens (ex: "Equipe GuiX"). */
  remetente?: string;
};

