import { randomBytes } from "crypto";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";

export type StatusEmail = "pendente" | "aguardando_verificacao" | "em_configuracao" | "configurado" | "erro";

export type VerificacaoDominio = {
  tipo: "TXT";
  nome: string;
  valor: string;
  expiraEm: string;
  verificadoEm?: string | null;
};

export type ContatoTecnico = {
  nome: string;
  email: string;
};

export type PassoLog = {
  chave: string;
  titulo: string;
  status: "ok" | "erro" | "aviso" | "pendente";
  detalhe?: string;
  em: string;
};

export type ContaCriada = {
  email: string;
  criadoEm: string;
  zuid?: number;
};

export type ExecucaoEmails = {
  id: string;
  projetoId: string;
  cliente: string;
  dominio: string;
  contas: string[];
  contatoTecnico?: ContatoTecnico;
  verificacaoDominio?: VerificacaoDominio;
  status: StatusEmail;
  usuario: string;
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string | null;
  passos: PassoLog[];
  contasCriadas: ContaCriada[];
  erro?: string | null;
};

type Indice = { atualizadoEm: string; ids: string[]; pendentes?: string[] };

const INDICE = "emails/_indice.json";

function chave(id: string) {
  const limpo = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return `emails/${limpo}.json`;
}

export function novoIdExecucao() {
  return `em${randomBytes(5).toString("hex")}`;
}

/** Monta a execução inicial (mesmo formato usado na orquestração). */
export function novaExecucao(entrada: {
  id: string;
  projetoId: string;
  cliente: string;
  dominio: string;
  contas: string[];
  usuario: string;
  contatoTecnico?: ContatoTecnico;
  verificacaoDominio?: VerificacaoDominio;
}): ExecucaoEmails {
  const agora = new Date().toISOString();
  const aguardandoVerificacao = Boolean(
    entrada.verificacaoDominio && !entrada.verificacaoDominio.verificadoEm,
  );
  return {
    id: entrada.id,
    projetoId: entrada.projetoId,
    cliente: entrada.cliente,
    dominio: entrada.dominio,
    contas: entrada.contas,
    contatoTecnico: entrada.contatoTecnico,
    verificacaoDominio: entrada.verificacaoDominio,
    status: aguardandoVerificacao ? "aguardando_verificacao" : "em_configuracao",
    usuario: entrada.usuario,
    criadoEm: agora,
    atualizadoEm: agora,
    concluidoEm: null,
    passos: entrada.verificacaoDominio?.verificadoEm
      ? [{
          chave: "verificar_propriedade",
          titulo: "Controle do domínio comprovado",
          status: "ok",
          detalhe: `Registro TXT confirmado em ${entrada.verificacaoDominio.nome}.`,
          em: entrada.verificacaoDominio.verificadoEm,
        }]
      : entrada.verificacaoDominio
        ? [{
          chave: "verificar_propriedade",
          titulo: "Aguardando comprovação do domínio",
          status: "pendente",
          detalhe: `Publique o TXT ${entrada.verificacaoDominio.nome} antes de continuar.`,
          em: agora,
        }]
        : [],
    contasCriadas: [],
    erro: null,
  };
}

async function lerIndice(): Promise<Indice> {
  try {
    const buf = await baixarObjeto(INDICE);
    return JSON.parse(buf.toString("utf8")) as Indice;
  } catch {
    return { atualizadoEm: new Date().toISOString(), ids: [] };
  }
}

async function gravarIndice(indice: Indice) {
  indice.atualizadoEm = new Date().toISOString();
  await enviarBuffer({
    key: INDICE,
    body: Buffer.from(JSON.stringify(indice, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "indice emails",
    tags: ["email", "indice"],
    status: "aprovada",
    clienteId: "ops",
  });
}

export async function gravarExecucao(execucao: ExecucaoEmails) {
  const body = { ...execucao, atualizadoEm: new Date().toISOString() };
  await enviarBuffer({
    key: chave(execucao.id),
    body: Buffer.from(JSON.stringify(body, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "execucao emails",
    tags: ["email", execucao.status, execucao.id],
    status: "aprovada",
    clienteId: "ops",
  });
  const indice = await lerIndice();
  if (!indice.ids.includes(execucao.id)) {
    indice.ids = [execucao.id, ...indice.ids].slice(0, 400);
  }
  if (indice.pendentes === undefined) {
    const historico = await Promise.all(indice.ids.map((id) => lerExecucao(id)));
    indice.pendentes = historico
      .filter(
        (item): item is ExecucaoEmails =>
          Boolean(item && item.status === "em_configuracao" && item.concluidoEm && !item.erro),
      )
      .map((item) => item.id);
  }
  const aguardaPropagacao =
    execucao.status === "em_configuracao" && Boolean(execucao.concluidoEm) && !execucao.erro;
  const pendentes = indice.pendentes;
  indice.pendentes = aguardaPropagacao
    ? [execucao.id, ...pendentes.filter((id) => id !== execucao.id)].slice(0, 400)
    : pendentes.filter((id) => id !== execucao.id);
  await gravarIndice(indice);
  return body;
}

export async function lerExecucao(id: string): Promise<ExecucaoEmails | null> {
  try {
    const buf = await baixarObjeto(chave(id));
    return JSON.parse(buf.toString("utf8")) as ExecucaoEmails;
  } catch {
    return null;
  }
}

export async function marcarFalhaExecucao(id: string, erro: unknown) {
  const execucao = await lerExecucao(id);
  if (!execucao) return null;
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  const temporario =
    /HTTP\s*(?:408|429|5\d{2})/i.test(mensagem) ||
    /fetch failed|network error|timed? ?out|socket hang up|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|UND_ERR_CONNECT_TIMEOUT/i.test(
      mensagem,
    );
  const agora = new Date().toISOString();
  const passo: PassoLog = {
    chave: temporario ? "api_retry" : "falha",
    titulo: temporario ? "Nova tentativa automática" : "Falha inesperada no provisionamento",
    status: temporario ? "aviso" : "erro",
    detalhe: temporario
      ? `Integração temporariamente indisponível; o motor tentará novamente. ${mensagem}`
      : mensagem,
    em: agora,
  };
  const atual = execucao.passos.findIndex((item) => item.chave === passo.chave);
  if (atual >= 0) execucao.passos[atual] = passo;
  else execucao.passos.push(passo);
  execucao.status = temporario ? "em_configuracao" : "erro";
  execucao.erro = temporario ? null : mensagem;
  execucao.concluidoEm = agora;
  return gravarExecucao(execucao);
}

export async function listarExecucoes(limite = 200): Promise<ExecucaoEmails[]> {
  const indice = await lerIndice();
  const out: ExecucaoEmails[] = [];
  for (const id of indice.ids.slice(0, limite)) {
    const item = await lerExecucao(id);
    if (item) out.push(item);
  }
  return out;
}

export async function listarExecucoesPendentes(limite = 400): Promise<ExecucaoEmails[]> {
  const indice = await lerIndice();
  if (!indice.pendentes) {
    const historico = await Promise.all(indice.ids.map((id) => lerExecucao(id)));
    indice.pendentes = historico
      .filter(
        (execucao): execucao is ExecucaoEmails =>
          Boolean(
            execucao &&
              execucao.status === "em_configuracao" &&
              execucao.concluidoEm &&
              !execucao.erro,
          ),
      )
      .map((execucao) => execucao.id);
    await gravarIndice(indice);
  }
  const execucoes = await Promise.all(indice.pendentes.slice(0, limite).map((id) => lerExecucao(id)));
  return execucoes.filter(
    (execucao): execucao is ExecucaoEmails =>
      Boolean(
        execucao &&
          execucao.status === "em_configuracao" &&
          execucao.concluidoEm &&
          !execucao.erro,
      ),
  );
}
