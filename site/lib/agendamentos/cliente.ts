import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import { sanitizarSiteIdPublico } from "./cofre";

export type CanalVerificacao = "email" | "telefone";

export type ClienteCadastro = {
  siteId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  telefoneDigitos: string;
  criadoEm: string;
  verificadoEm?: string;
  canal?: CanalVerificacao;
};

export type SessaoCliente = {
  token: string;
  siteId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  telefoneDigitos: string;
  canal: CanalVerificacao;
  criadaEm: string;
  expiraEm: string;
};

type DesafioOtp = {
  siteId: string;
  email: string;
  telefoneDigitos: string;
  nomeCompleto: string;
  canal: CanalVerificacao;
  codigoHash: string;
  criadoEm: string;
  expiraEm: string;
  tentativas: number;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSAO_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TENTATIVAS = 5;

function chaveCliente(siteId: string, email: string) {
  const id = createHash("sha256").update(`${siteId}:${email}`).digest("hex").slice(0, 24);
  return `agendamentos/${siteId}/clientes/${id}.json`;
}

function chaveOtp(siteId: string, destino: string) {
  const id = createHash("sha256").update(`${siteId}:otp:${destino}`).digest("hex").slice(0, 24);
  return `agendamentos/${siteId}/otp/${id}.json`;
}

function chaveSessao(siteId: string, token: string) {
  return `agendamentos/${siteId}/sessoes/${token}.json`;
}

function segredoOtp() {
  return process.env.AGENDAR_OTP_SECRET || process.env.RESEND_API_KEY || "guix-otp-local";
}

export function normalizarEmail(raw: string) {
  return raw.trim().toLowerCase().slice(0, 120);
}

export function normalizarTelefoneDigitos(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  return d.slice(0, 11);
}

export function emailClienteOk(raw: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarEmail(raw));
}

export function telefoneClienteOk(raw: string) {
  const d = normalizarTelefoneDigitos(raw);
  return d.length === 10 || d.length === 11;
}

export function nomeClienteOk(raw: string) {
  const n = raw.replace(/\s+/g, " ").trim();
  return n.length >= 5 && n.includes(" ");
}

function hashCodigo(codigo: string, siteId: string, destino: string) {
  return createHash("sha256").update(`${segredoOtp()}:${siteId}:${destino}:${codigo}`).digest("hex");
}

function gerarCodigo() {
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return String(n).padStart(6, "0");
}

async function lerJson<T>(key: string): Promise<T | null> {
  try {
    const buf = await baixarObjeto(key);
    return JSON.parse(buf.toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function gravarJson(key: string, body: unknown, alt: string, tags: string[]) {
  await enviarBuffer({
    key,
    body: Buffer.from(JSON.stringify(body, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt,
    tags,
    status: "aprovada",
    clienteId: `cli${tags[1] || "x"}`,
  });
}

export async function iniciarVerificacaoCliente(opts: {
  siteId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  canal: CanalVerificacao;
}) {
  const siteId = sanitizarSiteIdPublico(opts.siteId);
  const email = normalizarEmail(opts.email);
  const telefone = opts.telefone.trim();
  const telefoneDigitos = normalizarTelefoneDigitos(opts.telefone);
  const nomeCompleto = opts.nomeCompleto.replace(/\s+/g, " ").trim();
  const canal = opts.canal;

  if (!siteId) return { ok: false as const, erro: "Site inválido." };
  if (!nomeClienteOk(nomeCompleto)) return { ok: false as const, erro: "Informe o nome completo." };
  if (!emailClienteOk(email)) return { ok: false as const, erro: "Informe um e-mail válido." };
  if (!telefoneClienteOk(telefone)) return { ok: false as const, erro: "Informe o telefone com DDD." };
  if (canal !== "email" && canal !== "telefone") return { ok: false as const, erro: "Escolha e-mail ou telefone." };

  const codigo = gerarCodigo();
  const destino = canal === "email" ? email : telefoneDigitos;
  const agora = Date.now();
  const desafio: DesafioOtp = {
    siteId,
    email,
    telefoneDigitos,
    nomeCompleto,
    canal,
    codigoHash: hashCodigo(codigo, siteId, destino),
    criadoEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + OTP_TTL_MS).toISOString(),
    tentativas: 0,
  };

  const cliente: ClienteCadastro = {
    siteId,
    nomeCompleto,
    email,
    telefone,
    telefoneDigitos,
    criadoEm: new Date(agora).toISOString(),
    canal,
  };

  await gravarJson(chaveCliente(siteId, email), cliente, "cliente agenda", ["cliente", siteId]);
  await gravarJson(chaveOtp(siteId, destino), desafio, "otp agenda", ["otp", siteId]);

  return { ok: true as const, codigo, cliente, destinoMascarado: mascararDestino(canal, email, telefoneDigitos) };
}

export function mascararDestino(canal: CanalVerificacao, email: string, telefoneDigitos: string) {
  if (canal === "email") {
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const u = user.length <= 2 ? `${user[0] || "*"}*` : `${user.slice(0, 2)}***`;
    return `${u}@${domain}`;
  }
  if (telefoneDigitos.length < 4) return "****";
  return `(${telefoneDigitos.slice(0, 2)}) *****-${telefoneDigitos.slice(-4)}`;
}

export async function confirmarCodigoCliente(opts: {
  siteId: string;
  email: string;
  telefone: string;
  canal: CanalVerificacao;
  codigo: string;
}) {
  const siteId = sanitizarSiteIdPublico(opts.siteId);
  const email = normalizarEmail(opts.email);
  const telefoneDigitos = normalizarTelefoneDigitos(opts.telefone);
  const canal = opts.canal;
  const codigo = String(opts.codigo || "").replace(/\D/g, "").slice(0, 6);

  if (!siteId || !codigo || codigo.length !== 6) return { ok: false as const, erro: "Código inválido." };

  const destino = canal === "email" ? email : telefoneDigitos;
  const key = chaveOtp(siteId, destino);
  const desafio = await lerJson<DesafioOtp>(key);
  if (!desafio) return { ok: false as const, erro: "Peça um novo código." };
  if (desafio.email !== email || desafio.telefoneDigitos !== telefoneDigitos) {
    return { ok: false as const, erro: "Dados não batem com o cadastro." };
  }
  if (new Date(desafio.expiraEm).getTime() < Date.now()) {
    return { ok: false as const, erro: "Código expirado. Peça outro." };
  }
  if (desafio.tentativas >= MAX_TENTATIVAS) {
    return { ok: false as const, erro: "Muitas tentativas. Peça um novo código." };
  }

  const esperado = Buffer.from(desafio.codigoHash, "hex");
  const recebido = Buffer.from(hashCodigo(codigo, siteId, destino), "hex");
  const okHash = esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
  if (!okHash) {
    await gravarJson(key, { ...desafio, tentativas: desafio.tentativas + 1 }, "otp agenda", ["otp", siteId]);
    return { ok: false as const, erro: "Código incorreto." };
  }

  const agora = Date.now();
  const token = randomBytes(24).toString("hex");
  const sessao: SessaoCliente = {
    token,
    siteId,
    nomeCompleto: desafio.nomeCompleto,
    email: desafio.email,
    telefone: opts.telefone.trim(),
    telefoneDigitos: desafio.telefoneDigitos,
    canal,
    criadaEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + SESSAO_TTL_MS).toISOString(),
  };

  const cliente = (await lerJson<ClienteCadastro>(chaveCliente(siteId, email))) || {
    siteId,
    nomeCompleto: desafio.nomeCompleto,
    email,
    telefone: opts.telefone.trim(),
    telefoneDigitos,
    criadoEm: new Date(agora).toISOString(),
  };
  await gravarJson(
    chaveCliente(siteId, email),
    { ...cliente, verificadoEm: new Date(agora).toISOString(), canal },
    "cliente agenda",
    ["cliente", siteId],
  );
  await gravarJson(chaveSessao(siteId, token), sessao, "sessao cliente", ["sessao", siteId]);

  return { ok: true as const, sessao };
}

export async function validarSessaoCliente(siteIdRaw: string, tokenRaw: string): Promise<SessaoCliente | null> {
  const siteId = sanitizarSiteIdPublico(siteIdRaw);
  const token = String(tokenRaw || "").replace(/[^a-f0-9]/gi, "").slice(0, 64);
  if (!siteId || token.length < 32) return null;
  const sessao = await lerJson<SessaoCliente>(chaveSessao(siteId, token));
  if (!sessao || sessao.siteId !== siteId || sessao.token !== token) return null;
  if (new Date(sessao.expiraEm).getTime() < Date.now()) return null;
  return sessao;
}

/** Modelos públicos (`demo-*`): libera agenda com nome + WhatsApp + e-mail, sem OTP. */
export function siteIdEhDemoPublico(siteId: string) {
  return sanitizarSiteIdPublico(siteId).startsWith("demo");
}

export async function criarSessaoDiretaCliente(opts: {
  siteId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  canal?: CanalVerificacao;
}) {
  const siteId = sanitizarSiteIdPublico(opts.siteId);
  const email = normalizarEmail(opts.email);
  const telefone = opts.telefone.trim();
  const telefoneDigitos = normalizarTelefoneDigitos(opts.telefone);
  const nomeCompleto = opts.nomeCompleto.replace(/\s+/g, " ").trim();
  const canal = opts.canal === "telefone" ? "telefone" : "email";

  if (!siteId) return { ok: false as const, erro: "Site inválido." };
  if (!nomeClienteOk(nomeCompleto)) return { ok: false as const, erro: "Informe o nome completo." };
  if (!emailClienteOk(email)) return { ok: false as const, erro: "Informe um e-mail válido." };
  if (!telefoneClienteOk(telefone)) return { ok: false as const, erro: "Informe o telefone com DDD." };

  const agora = Date.now();
  const token = randomBytes(24).toString("hex");
  const cliente: ClienteCadastro = {
    siteId,
    nomeCompleto,
    email,
    telefone,
    telefoneDigitos,
    criadoEm: new Date(agora).toISOString(),
    verificadoEm: new Date(agora).toISOString(),
    canal,
  };
  const sessao: SessaoCliente = {
    token,
    siteId,
    nomeCompleto,
    email,
    telefone,
    telefoneDigitos,
    canal,
    criadaEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + SESSAO_TTL_MS).toISOString(),
  };
  await gravarJson(chaveCliente(siteId, email), cliente, "cliente agenda", ["cliente", siteId]);
  await gravarJson(chaveSessao(siteId, token), sessao, "sessao cliente", ["sessao", siteId]);
  return { ok: true as const, sessao };
}
