/**
 * Zoho Mail Admin API — provisionamento de domínio e caixas profissionais.
 * Docs: https://www.zoho.com/mail/help/api/
 * Auth: OAuth 2.0 (refresh token) → header "Authorization: Zoho-oauthtoken <token>".
 * Região: defina ZOHO_ACCOUNTS_URL / ZOHO_MAIL_API_URL para .eu/.in/.com.cn quando necessário.
 */

const contas = () => (process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com").replace(/\/$/, "");
const apiMail = () => (process.env.ZOHO_MAIL_API_URL || "https://mail.zoho.com/api").replace(/\/$/, "");

export class ZohoIndisponivel extends Error {
  constructor() {
    super("ZOHO_NAO_CONFIGURADO");
  }
}

type RespostaZoho<T> = T & { status?: { code?: number; description?: string }; data?: unknown };

function credenciais() {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) throw new ZohoIndisponivel();
  return { clientId, clientSecret, refreshToken };
}

export function zohoConfigurado() {
  try {
    credenciais();
    return true;
  } catch {
    return false;
  }
}

/** Raiz da região (ex.: "zoho.com") — usada em MX, SPF e TXT de verificação. */
export function raizZoho() {
  return new URL(apiMail()).host.replace(/^mail\./, "");
}

export function subdominioZoho(prefixo: "mx" | "mx2" | "mx3" | "zmverify") {
  return `${prefixo}.${raizZoho()}`;
}

let cache: { token: string; expiraEm: number } | null = null;

async function accessToken(): Promise<string> {
  if (cache && cache.expiraEm > Date.now() + 30_000) return cache.token;
  const { clientId, clientSecret, refreshToken } = credenciais();
  const url =
    `${contas()}/oauth/v2/token?refresh_token=${encodeURIComponent(refreshToken)}` +
    `&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}` +
    `&grant_type=refresh_token`;
  const resposta = await fetch(url, { method: "POST", cache: "no-store" });
  const json = (await resposta.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!resposta.ok || !json.access_token) {
    throw new Error(`Zoho OAuth: ${json.error || `HTTP ${resposta.status}`}`);
  }
  cache = { token: json.access_token, expiraEm: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return cache.token;
}

async function chamar<T>(caminho: string, opcoes?: { method?: string; body?: unknown }): Promise<RespostaZoho<T>> {
  const token = await accessToken();
  const resposta = await fetch(`${apiMail()}${caminho}`, {
    method: opcoes?.method ?? "GET",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: opcoes?.body === undefined ? undefined : JSON.stringify(opcoes.body),
    cache: "no-store",
  });
  const texto = await resposta.text();
  let json: RespostaZoho<T>;
  try {
    json = texto ? (JSON.parse(texto) as RespostaZoho<T>) : ({} as RespostaZoho<T>);
  } catch {
    throw new Error("O Zoho respondeu de um jeito inesperado.");
  }
  if (!resposta.ok) {
    throw new Error(mensagemErroZoho(json, resposta.status));
  }
  return json;
}

/** O Zoho devolve erros ora como objeto, ora como [codigo, { errorCode, msg }]. */
function mensagemErroZoho(corpo: unknown, status: number) {
  const obj = (Array.isArray(corpo) ? corpo[1] : corpo) as
    | { status?: { description?: string }; errorCode?: string; msg?: string }
    | undefined;
  const detalhe = obj?.status?.description || obj?.errorCode || obj?.msg;
  return detalhe ? `Zoho: ${detalhe}` : `Zoho HTTP ${status}`;
}

export type DetalheDominio = {
  domainName: string;
  verificationStatus: boolean;
  mailHostingEnabled: boolean;
  mxstatus: string | boolean;
  spfstatus: boolean | string;
  dkimstatus?: boolean;
  CNAMEVerificationCode?: string;
  HTMLVerificationCode?: string;
};

function statusZohoOk(valor: boolean | string | undefined) {
  return valor === true || (typeof valor === "string" && valor.trim().toLowerCase() === "true");
}

/** ID da organização (zoid). Usa ZOHO_ZOID quando definido; senão consulta a API. */
export async function obterZoid(): Promise<string> {
  const env = process.env.ZOHO_ZOID?.trim();
  if (env) return env;
  try {
    const json = await chamar<{ data?: { zoid?: number } }>("/organization");
    const zoid = (json.data as { zoid?: number } | undefined)?.zoid;
    if (zoid) return String(zoid);
  } catch (erro) {
    throw new Error(dicaZoid(erro));
  }
  throw new Error(dicaZoid());
}

function dicaZoid(erro?: unknown) {
  const detalhe = erro instanceof Error ? ` (${erro.message})` : "";
  return (
    `Não consegui descobrir a organização no Zoho${detalhe}. ` +
    "A descoberta usa GET /api/organization, que exige o escopo ZohoMail.partner.organization.ALL. " +
    "Inclua esse escopo ao gerar o token ou defina ZOHO_ZOID com o ID da organização."
  );
}

export async function detalheDominio(zoid: string, dominio: string): Promise<DetalheDominio | null> {
  try {
    const json = await chamar<{ data: DetalheDominio }>(
      `/organization/${zoid}/domains/${encodeURIComponent(dominio)}`,
    );
    return json.data;
  } catch {
    return null;
  }
}

/** Adiciona o domínio à organização. Devolve os códigos de verificação. */
export async function adicionarDominio(zoid: string, dominio: string): Promise<DetalheDominio> {
  const json = await chamar<{ data: DetalheDominio }>(`/organization/${zoid}/domains`, {
    method: "POST",
    body: { domainName: dominio },
  });
  return json.data;
}

/** Valor do TXT de verificação: zoho-verification=zb<code>.zmverify.<região>. */
export function txtVerificacao(detalhe: DetalheDominio) {
  const codigo = detalhe.CNAMEVerificationCode || `zb${detalhe.HTMLVerificationCode || ""}`;
  return `zoho-verification=${codigo}.${subdominioZoho("zmverify")}`;
}

export async function verificarDominioTxt(zoid: string, dominio: string): Promise<boolean> {
  const json = await chamar<{ data?: { status?: boolean; message?: string; error?: string } }>(
    `/organization/${zoid}/domains/${encodeURIComponent(dominio)}`,
    { method: "PUT", body: { mode: "verifyDomainByTXT" } },
  );
  return statusZohoOk(json.data?.status);
}

export async function habilitarHosting(zoid: string, dominio: string): Promise<void> {
  await chamar(`/organization/${zoid}/domains/${encodeURIComponent(dominio)}`, {
    method: "PUT",
    body: { mode: "enableMailHosting" },
  });
}

export async function verificarMx(zoid: string, dominio: string): Promise<boolean> {
  const json = await chamar<{ data?: { mxstatus?: boolean } }>(
    `/organization/${zoid}/domains/${encodeURIComponent(dominio)}`,
    { method: "PUT", body: { mode: "verifyMxRecord" } },
  );
  return statusZohoOk(json.data?.mxstatus);
}

export async function verificarSpf(zoid: string, dominio: string): Promise<boolean> {
  const json = await chamar<{ data?: { spfstatus?: boolean } }>(
    `/organization/${zoid}/domains/${encodeURIComponent(dominio)}`,
    { method: "PUT", body: { mode: "verifySpfRecord" } },
  );
  return statusZohoOk(json.data?.spfstatus);
}

export type ContaZoho = { primaryEmailAddress?: string; emailAddress?: { mailId?: string }[]; zuid?: number };

export async function listarContas(zoid: string): Promise<ContaZoho[]> {
  const json = await chamar<{ data?: ContaZoho[] | { users?: ContaZoho[] } }>(`/organization/${zoid}/accounts`);
  const dados = json.data;
  if (Array.isArray(dados)) return dados;
  if (dados && Array.isArray(dados.users)) return dados.users;
  return [];
}

export function emailDeConta(conta: ContaZoho) {
  return conta.primaryEmailAddress || conta.emailAddress?.[0]?.mailId || "";
}

/** Cria uma caixa. Requer domínio verificado + email hosting habilitado. */
export async function criarConta(
  zoid: string,
  entrada: { email: string; senha: string; firstName: string; lastName: string },
): Promise<{ zuid?: number }> {
  const json = await chamar<{ data?: { zuid?: number } }>(`/organization/${zoid}/accounts`, {
    method: "POST",
    body: {
      primaryEmailAddress: entrada.email,
      password: entrada.senha,
      firstName: entrada.firstName,
      lastName: entrada.lastName,
      displayName: entrada.firstName || entrada.email,
      role: "member",
      oneTimePassword: true,
    },
  });
  return json.data ?? {};
}
