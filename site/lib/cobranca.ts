export type FormaPagamento = "PIX" | "BOLETO" | "CREDIT_CARD";

export type PixCobranca = {
  imagem: string;
  copiaECola: string;
  expira: string | null;
};

export type Cobranca = {
  id: string;
  status: string;
  statusTexto: string;
  valor: number;
  forma: FormaPagamento;
  parcelas: number;
  descricao: string;
  vencimento: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  linhaDigitavel: string | null;
  pix: PixCobranca | null;
  aviso: string | null;
};

const rotulos: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  AWAITING_RISK_ANALYSIS: "Em análise de risco",
  APPROVED_BY_RISK_ANALYSIS: "Aprovado na análise",
  CONFIRMED: "Pagamento confirmado",
  RECEIVED: "Pagamento recebido",
  RECEIVED_IN_CASH: "Pagamento recebido",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  REFUND_REQUESTED: "Estorno solicitado",
  PARTIALLY_REFUNDED: "Estorno parcial",
  CHARGEBACK_REQUESTED: "Contestação aberta",
  CHARGEBACK_DISPUTE: "Contestação em análise",
  DUNNING_REQUESTED: "Cobrança em atraso",
};

export function textoStatus(status: string) {
  return rotulos[status] ?? "Em processamento";
}

export function pagamentoConfirmado(status: string) {
  return status === "CONFIRMED" || status === "RECEIVED" || status === "RECEIVED_IN_CASH";
}
