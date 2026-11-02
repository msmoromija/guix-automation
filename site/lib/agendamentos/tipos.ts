export type StatusAgendamento = "pendente" | "confirmado" | "cancelado" | "recusado";

export type Agendamento = {
  id: string;
  /** Token do cliente (cancelar / acompanhar). */
  cancelToken: string;
  /** Token do profissional/gestão (aceitar / recusar). */
  manageToken: string;
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
  respondidoEm?: string;
  respostaNota?: string;
};

export const ANTECEDENCIA_CANCEL_HORAS = 3;

export function statusOcupaHorario(status: StatusAgendamento) {
  return status === "pendente" || status === "confirmado";
}

export function rotuloStatus(status: StatusAgendamento) {
  if (status === "pendente") return "Aguardando confirmação";
  if (status === "confirmado") return "Confirmado";
  if (status === "recusado") return "Recusado pelo profissional";
  return "Cancelado";
}
