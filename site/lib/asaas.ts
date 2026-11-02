import { reaisNumero } from "./dinheiro";
import { textoStatus, type Cobranca, type FormaPagamento } from "./cobranca";

const origem = () => (process.env.ASAAS_API_URL || "https://api.asaas.com/v3").replace(/\/$/, "");

type ErroAsaas = { errors?: { description?: string }[] };

export class AsaasIndisponivel extends Error {
  constructor() {
    super("ASAAS_NAO_CONFIGURADO");
  }
}

function chave() {
  const valor = process.env.ASAAS_API_KEY?.trim();
  if (!valor) throw new AsaasIndisponivel();
  return valor;
}

async function asaas<T>(caminho: string, opcoes?: { method?: string; body?: unknown }): Promise<T> {
  const headers: Record<string, string> = {
    access_token: chave(),
    "User-Agent": "GuiX.net/1.0",
  };
  let body: string | undefined;
  if (opcoes?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opcoes.body);
  }
  const resposta = await fetch(`${origem()}${caminho}`, {
    method: opcoes?.method ?? "GET",
    headers,
    body,
    cache: "no-store",
  });
  const texto = await resposta.text();
  let json: T & ErroAsaas;
  try {
    json = texto ? (JSON.parse(texto) as T & ErroAsaas) : ({} as T & ErroAsaas);
  } catch {
    throw new Error("O Asaas respondeu de um jeito inesperado.");
  }
  if (!resposta.ok) {
    const descricao = json.errors?.map((item) => item.description).filter(Boolean).join(" ");
    throw new Error(descricao || "O Asaas não concluiu esta cobrança.");
  }
  return json;
}

function vencimento(dias: number) {
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [ano, mes, dia] = hoje.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

async function clienteId(dados: { nome: string; email: string; cpfCnpj: string; telefone: string }) {
  const busca = await asaas<{ data?: { id: string }[] }>(`/customers?cpfCnpj=${dados.cpfCnpj}&limit=1`);
  const existente = busca.data?.[0]?.id;
  const corpo = {
    name: dados.nome,
    email: dados.email,
    cpfCnpj: dados.cpfCnpj,
    mobilePhone: dados.telefone,
  };
  if (existente) {
    await asaas(`/customers/${existente}`, { method: "PUT", body: corpo });
    return existente;
  }
  const criado = await asaas<{ id: string }>("/customers", { method: "POST", body: corpo });
  return criado.id;
}

export async function criarCobranca(entrada: {
  nome: string;
  email: string;
  cpfCnpj: string;
  telefone: string;
  forma: FormaPagamento;
  parcelas: number;
  centavos: number;
  descricao: string;
  referencia: string;
}): Promise<Cobranca> {
  const customer = await clienteId(entrada);
  const total = reaisNumero(entrada.centavos);
  const parcelado = entrada.forma === "CREDIT_CARD" && entrada.parcelas > 1;
  const pagamento = await asaas<{
    id: string;
    status: string;
    value: number;
    billingType: FormaPagamento;
    installmentCount?: number | null;
    description?: string | null;
    dueDate: string;
    invoiceUrl?: string | null;
    bankSlipUrl?: string | null;
  }>("/payments", {
    method: "POST",
    body: {
      customer,
      billingType: entrada.forma,
      dueDate: vencimento(entrada.forma === "PIX" ? 1 : 3),
      description: entrada.descricao,
      externalReference: entrada.referencia,
      postalService: false,
      ...(parcelado
        ? { installmentCount: entrada.parcelas, totalValue: total }
        : { value: total }),
    },
  });
  return montarCobranca(pagamento, entrada.parcelas);
}

export async function lerCobranca(id: string): Promise<Cobranca> {
  const pagamento = await asaas<{
    id: string;
    status: string;
    value: number;
    billingType: FormaPagamento;
    installmentCount?: number | null;
    description?: string | null;
    dueDate: string;
    invoiceUrl?: string | null;
    bankSlipUrl?: string | null;
  }>(`/payments/${id}`);
  return montarCobranca(pagamento, pagamento.installmentCount || 1);
}

async function montarCobranca(
  pagamento: {
    id: string;
    status: string;
    value: number;
    billingType: FormaPagamento;
    installmentCount?: number | null;
    description?: string | null;
    dueDate: string;
    invoiceUrl?: string | null;
    bankSlipUrl?: string | null;
  },
  parcelas: number,
): Promise<Cobranca> {
  let pix: Cobranca["pix"] = null;
  let linhaDigitavel: string | null = null;
  let aviso: string | null = null;

  if (pagamento.billingType === "PIX" || pagamento.billingType === "BOLETO") {
    try {
      const qr = await asaas<{ encodedImage?: string; payload?: string; expirationDate?: string }>(
        `/payments/${pagamento.id}/pixQrCode`,
      );
      if (qr.payload && qr.encodedImage) {
        pix = { imagem: qr.encodedImage, copiaECola: qr.payload, expira: qr.expirationDate ?? null };
      }
    } catch (erro) {
      if (pagamento.billingType === "PIX") {
        aviso = erro instanceof Error ? erro.message : "Não foi possível gerar o QR Code agora.";
      }
    }
  }

  if (pagamento.billingType === "BOLETO") {
    try {
      const boleto = await asaas<{ identificationField?: string }>(`/payments/${pagamento.id}/identificationField`);
      linhaDigitavel = boleto.identificationField ?? null;
    } catch (erro) {
      aviso = erro instanceof Error ? erro.message : aviso;
    }
  }

  return {
    id: pagamento.id,
    status: pagamento.status,
    statusTexto: textoStatus(pagamento.status),
    valor: pagamento.value,
    forma: pagamento.billingType,
    parcelas: pagamento.installmentCount || parcelas,
    descricao: pagamento.description || "",
    vencimento: pagamento.dueDate,
    invoiceUrl: pagamento.invoiceUrl ?? null,
    bankSlipUrl: pagamento.bankSlipUrl ?? null,
    linhaDigitavel,
    pix,
    aviso,
  };
}
