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
  /** Site institucional (link) quando o Google Places informa. */
  site?: string | null;
  /** E-mail de contato encontrado no site institucional (best-effort). */
  email?: string | null;
  status: StatusLead;
  data_ultimo_contato: string | null;
  conta_whatsapp: string | null;
  modelo_usado: string | null;
  mensagem_gerada: string | null;
  observacoes: string;
  /**
   * Congelado/oculto: o lead vai para o fim da fila e sai da lista principal
   * (aparece só quando o usuário pede para ver os congelados).
   */
  congelado?: boolean;
  /**
   * Removido do histórico de forma reversível (soft delete): sai da fila
   * principal e só reaparece com "Mostrar congelados e removidos" ligado.
   */
  arquivado?: boolean;
  external_id: string | null;
  fonte: string;
  created_at: string;
  updated_at: string;
  /** Linha do tempo persistida — cada geração/envio/status fica registrada aqui. */
  historico?: EventoLead[];
};

/** Resultado de uma busca, já cruzado com o lead salvo (quando existir). */
export type ResultadoBusca = {
  nome: string;
  telefone: string;
  telefone_normalizado: string;
  endereco: string;
  cidade: string;
  categoria: string;
  site: string | null;
  email: string | null;
  external_id: string;
  lead_id: string | null;
  status: StatusLead;
  ja_contatado: boolean;
  contatado_recentemente: boolean;
  /** O lead correspondente está congelado/oculto. */
  congelado: boolean;
  /** O lead correspondente foi removido (soft delete) e está fora da fila. */
  arquivado: boolean;
};

/** Uma execução de busca dentro de um par nicho+cidade (Busca 1, Busca 2…). */
export type BuscaExecucao = {
  id: string;
  em: string;
  /** Número sequencial dentro da cidade+nicho (1 = "Busca 1"). */
  numero: number;
  /** Termo de busca usado nesta execução (varia a cada nova busca). */
  termo: string;
  filtros: { soComTelefone: boolean; soNovos: boolean; naoContatados: boolean };
  totalBruto: number;
  totalExibido: number;
  /** external_ids já exibidos — usados para não repetir nas próximas buscas. */
  ids: string[];
  /** Resultados exibidos nesta execução (permite reabrir a "Busca N" depois). */
  resultados?: ResultadoBusca[];
};

/** Histórico de buscas de um par nicho+cidade. */
export type SessaoBusca = {
  nicho: string;
  cidade: string;
  atualizadoEm: string;
  /** Resultados da última busca desta cidade+nicho (para restaurar o painel). */
  resultados: ResultadoBusca[];
  buscas: BuscaExecucao[];
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
  /** Canal usado: "link" = abriu o wa.me; "cloud_api" = enviado pela API oficial. */
  canal?: "link" | "cloud_api";
  /** id da mensagem na Meta (wamid) — o webhook usa para atualizar o status. */
  wamid?: string | null;
  /** sent | delivered | read | failed (atualizado pelo webhook de status). */
  status?: string | null;
  /** Detalhe do erro quando status = "failed". */
  erro?: string | null;
};

/**
 * Mensagem recebida de um contato (webhook da Cloud API) — base do uso em
 * suporte. O recebimento é gratuito; este módulo não envia pela API.
 */
export type MensagemRecebida = {
  id: string;
  /** id da mensagem na Meta (wamid) — usado para deduplicar reentregas do webhook. */
  wamid: string;
  /** Timestamp do evento (ISO). */
  em: string;
  /** Telefone do contato, como a Meta envia (ex.: 5579999999999). */
  de: string;
  nome_contato?: string | null;
  texto: string;
  /** text | image | audio | document | button | interactive | ... */
  tipo: string;
  /** Número que recebeu a mensagem (identifica a conta conectada). */
  phone_number_id?: string | null;
  conta_id?: string | null;
  conta_nome?: string | null;
  /** Lead correspondente, quando o telefone casa com um lead salvo. */
  lead_id?: string | null;
};

/** Estado da conexão de uma conta com a WhatsApp Business Platform (Cloud API). */
export type StatusConexao = "desconectada" | "conectada" | "erro";

export type ContaWhatsApp = {
  id: string;
  nome: string;
  limite_diario: number;
  /**
   * "manual"   = cadastro simples (o painel só monta o link wa.me);
   * "cloud_api"= conectada de verdade na WhatsApp Business Platform (recebe
   *              mensagens e status; o envio pela API fica desativado).
   */
  provedor?: "manual" | "cloud_api";
  /** ID do número na Meta (usado no endpoint /messages). */
  phone_number_id?: string | null;
  /** Número exibido, em E.164 (ex.: +55 79 99999-9999). */
  display_phone_number?: string | null;
  /** ID da WhatsApp Business Account (WABA). */
  waba_id?: string | null;
  status_conexao?: StatusConexao;
  conectada_em?: string | null;
  /** Token de acesso da Cloud API. NUNCA é devolvido ao cliente (mascarado no GET). */
  token?: string | null;
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

