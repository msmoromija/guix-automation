export type StatusAgendamento = "confirmado" | "cancelado";

export type Agendamento = {
  id: string;
  cancelToken: string;
  siteId: string;
  nicho?: string;
  negocioNome: string;
  negocioWhatsapp: string;
  negocioEmail: string;
  servico: string;
  profissional: string;
  /** YYYY-MM-DD */
  data: string;
  /** HH:MM */
  hora: string;
  /** ISO datetime do início (America/Sao_Paulo aproximado) */
  iniciaEm: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  status: StatusAgendamento;
  criadoEm: string;
  canceladoEm?: string;
};

export const ANTECEDENCIA_CANCEL_HORAS = 3;
