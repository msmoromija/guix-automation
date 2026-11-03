import { randomBytes } from "crypto";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import type { PlanoId } from "@/lib/planos";

export type TipoCupom = "fixo" | "percentual";

export type Cupom = {
  codigo: string;
  tipo: TipoCupom;
  /** Desconto em centavos quando tipo=fixo */
  valorCentavos: number;
  /** 1–100 quando tipo=percentual */
  percentual: number;
  ativo: boolean;
  usosMaximos: number | null;
  usos: number;
  validoAte: string | null;
  planos: PlanoId[] | null;
  nota: string;
  criadoPor: string;
  criadoEm: string;
  usosLog: Array<{ em: string; cobrancaId: string; email: string; descontoCentavos: number }>;
};

type IndiceCupons = { atualizadoEm: string; codigos: string[] };

const INDICE = "cupons/_indice.json";

function chave(codigo: string) {
  return `cupons/${normalizarCodigo(codigo)}.json`;
}

export function normalizarCodigo(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 24);
}

export function gerarCodigoSugestao(prefixo = "GUIX") {
  const sufixo = randomBytes(3).toString("hex").toUpperCase();
  return normalizarCodigo(`${prefixo}${sufixo}`);
}

async function lerIndice(): Promise<IndiceCupons> {
  try {
    const buf = await baixarObjeto(INDICE);
    return JSON.parse(buf.toString("utf8")) as IndiceCupons;
  } catch {
    return { atualizadoEm: new Date().toISOString(), codigos: [] };
  }
}

async function gravarIndice(indice: IndiceCupons) {
  indice.atualizadoEm = new Date().toISOString();
  await enviarBuffer({
    key: INDICE,
    body: Buffer.from(JSON.stringify(indice, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "indice cupons",
    tags: ["cupom", "indice"],
    status: "aprovada",
    clienteId: "ops",
  });
}

export async function gravarCupom(cupom: Cupom) {
  const codigo = normalizarCodigo(cupom.codigo);
  const body = { ...cupom, codigo };
  await enviarBuffer({
    key: chave(codigo),
    body: Buffer.from(JSON.stringify(body, null, 2)),
    contentType: "application/json",
    origem: "biblioteca",
    alt: "cupom",
    tags: ["cupom", codigo],
    status: "aprovada",
    clienteId: "ops",
  });
  const indice = await lerIndice();
  if (!indice.codigos.includes(codigo)) {
    indice.codigos = [codigo, ...indice.codigos].slice(0, 500);
    await gravarIndice(indice);
  }
  return body;
}

export async function lerCupom(codigo: string): Promise<Cupom | null> {
  try {
    const buf = await baixarObjeto(chave(codigo));
    return JSON.parse(buf.toString("utf8")) as Cupom;
  } catch {
    return null;
  }
}

export async function listarCupons(limite = 80): Promise<Cupom[]> {
  const indice = await lerIndice();
  const out: Cupom[] = [];
  for (const codigo of indice.codigos.slice(0, limite)) {
    const c = await lerCupom(codigo);
    if (c) out.push(c);
  }
  return out;
}

export type ResultadoCupom =
  | { ok: true; cupom: Cupom; descontoCentavos: number; totalCentavos: number; mensagem: string }
  | { ok: false; erro: string };

const MINIMO_CENTAVOS = 500; // R$ 5,00

export function aplicarDesconto(centavos: number, cupom: Cupom) {
  let desconto = 0;
  if (cupom.tipo === "percentual") {
    const pct = Math.min(100, Math.max(0, cupom.percentual || 0));
    desconto = Math.round((centavos * pct) / 100);
  } else {
    desconto = Math.max(0, cupom.valorCentavos || 0);
  }
  desconto = Math.min(desconto, Math.max(0, centavos - MINIMO_CENTAVOS));
  const total = Math.max(MINIMO_CENTAVOS, centavos - desconto);
  desconto = centavos - total;
  return { descontoCentavos: desconto, totalCentavos: total };
}

export function validarCupomParaTotal(
  cupom: Cupom | null,
  centavos: number,
  plano: PlanoId,
): ResultadoCupom {
  if (!cupom) return { ok: false, erro: "Cupom não encontrado." };
  if (!cupom.ativo) return { ok: false, erro: "Este cupom está desativado." };
  if (cupom.validoAte && new Date(cupom.validoAte).getTime() < Date.now()) {
    return { ok: false, erro: "Este cupom expirou." };
  }
  if (cupom.usosMaximos != null && cupom.usos >= cupom.usosMaximos) {
    return { ok: false, erro: "Este cupom já esgotou os usos." };
  }
  if (cupom.planos?.length && !cupom.planos.includes(plano)) {
    return { ok: false, erro: "Este cupom não vale para o plano escolhido." };
  }
  const { descontoCentavos, totalCentavos } = aplicarDesconto(centavos, cupom);
  if (descontoCentavos <= 0) {
    return { ok: false, erro: "Este cupom não altera o valor deste pedido." };
  }
  const rotulo =
    cupom.tipo === "percentual"
      ? `${cupom.percentual}%`
      : `R$ ${(cupom.valorCentavos / 100).toFixed(2).replace(".", ",")}`;
  return {
    ok: true,
    cupom,
    descontoCentavos,
    totalCentavos,
    mensagem: `Cupom ${cupom.codigo} aplicado (−${rotulo}).`,
  };
}

export async function consumirCupom(opts: {
  codigo: string;
  cobrancaId: string;
  email: string;
  descontoCentavos: number;
}) {
  const cupom = await lerCupom(opts.codigo);
  if (!cupom) return null;
  cupom.usos = (cupom.usos || 0) + 1;
  cupom.usosLog = [
    {
      em: new Date().toISOString(),
      cobrancaId: opts.cobrancaId,
      email: opts.email,
      descontoCentavos: opts.descontoCentavos,
    },
    ...(cupom.usosLog || []),
  ].slice(0, 200);
  return gravarCupom(cupom);
}
