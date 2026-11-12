"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { linkWhatsapp } from "@/lib/contato";
import { formatarReais } from "@/lib/dinheiro";
import { normalizarTelefoneBr, validarDocumento } from "@/lib/documento";
import {
  MAX_PARCELAS,
  TAXA_EQUIPE_CENTAVOS,
  calcularTotal,
  nichosDoPlano,
  nomeDoNicho,
  planoPorId,
  planosContrataveis,
  type Configuracao,
  type PlanoId,
} from "@/lib/planos";

const campo =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent";

const RASCUNHO_KEY = "guix.contratar.rascunho";

type Rascunho = {
  plano: PlanoId;
  nicho: string;
  configuracao: Configuracao;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  forma: "pix" | "boleto" | "cartao";
  parcelas: number;
  cupom?: string;
};

type CupomAplicado = {
  codigo: string;
  mensagem: string;
  descontoCentavos: number;
  totalCentavos: number;
};

function lerRascunho(): Partial<Rascunho> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RASCUNHO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Rascunho>;
  } catch {
    return null;
  }
}

function gravarRascunho(dados: Rascunho) {
  try {
    sessionStorage.setItem(RASCUNHO_KEY, JSON.stringify(dados));
  } catch {
    /* ignore */
  }
}

export function ContratarForm({
  planoInicial,
  nichoInicial,
  previewId,
  previewToken,
}: {
  planoInicial: PlanoId;
  nichoInicial?: string;
  previewId?: string;
  previewToken?: string;
}) {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [plano, setPlano] = useState<PlanoId>(planoInicial);
  const opcoesIniciais = nichosDoPlano(planoInicial);
  const [nicho, setNicho] = useState(
    nichoInicial && opcoesIniciais.some((i) => i.id === nichoInicial)
      ? nichoInicial
      : opcoesIniciais[0]?.id ?? "",
  );
  const [configuracao, setConfiguracao] = useState<Configuracao>("ia");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [forma, setForma] = useState<"pix" | "boleto" | "cartao">("pix");
  const [parcelas, setParcelas] = useState(1);
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const salvo = lerRascunho();
    if (salvo) {
      const planoSalvo: PlanoId =
        salvo.plano === "avancado" || salvo.plano === "simples" ? salvo.plano : planoInicial;
      const opcoesPlano = nichosDoPlano(planoSalvo);
      const nichoSalvo =
        (nichoInicial && opcoesPlano.some((i) => i.id === nichoInicial) && nichoInicial) ||
        (salvo.nicho && opcoesPlano.some((i) => i.id === salvo.nicho) ? salvo.nicho : opcoesPlano[0]?.id) ||
        "";
      if (!nichoInicial) setPlano(planoSalvo);
      setNicho(nichoSalvo);
      if (salvo.configuracao === "ia" || salvo.configuracao === "equipe") setConfiguracao(salvo.configuracao);
      if (typeof salvo.nome === "string") setNome(salvo.nome);
      if (typeof salvo.email === "string") setEmail(salvo.email);
      if (typeof salvo.telefone === "string") setTelefone(salvo.telefone);
      if (typeof salvo.documento === "string") setDocumento(salvo.documento);
      if (salvo.forma === "pix" || salvo.forma === "boleto" || salvo.forma === "cartao") setForma(salvo.forma);
      if (typeof salvo.parcelas === "number" && salvo.parcelas >= 1 && salvo.parcelas <= MAX_PARCELAS) {
        setParcelas(salvo.parcelas);
      }
      if (typeof salvo.cupom === "string" && salvo.cupom) setCupom(salvo.cupom);
    }
    setPronto(true);
  }, [planoInicial, nichoInicial]);

  useEffect(() => {
    if (!pronto) return;
    gravarRascunho({
      plano,
      nicho,
      configuracao,
      nome,
      email,
      telefone,
      documento,
      forma,
      parcelas,
      cupom,
    });
  }, [pronto, plano, nicho, configuracao, nome, email, telefone, documento, forma, parcelas, cupom]);

  useEffect(() => {
    setCupomAplicado(null);
    setCupomErro("");
  }, [plano, configuracao]);

  const opcoes = nichosDoPlano(plano);
  const subtotal = calcularTotal(plano, configuracao);
  const total = cupomAplicado?.totalCentavos ?? subtotal;
  const nichoAtual = useMemo(() => (opcoes.some((item) => item.id === nicho) ? nicho : opcoes[0]?.id ?? ""), [opcoes, nicho]);

  function trocarPlano(proximo: PlanoId) {
    setPlano(proximo);
    setNicho(nichosDoPlano(proximo)[0]?.id ?? "");
  }

  async function aplicarCupom() {
    setCupomErro("");
    setCupomAplicado(null);
    const codigo = cupom.trim();
    if (!codigo) {
      setCupomErro("Digite o código do cupom.");
      return;
    }
    setValidandoCupom(true);
    try {
      const res = await fetch("/api/cupons/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, plano, configuracao }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCupomErro(json.erro || "Cupom inválido.");
        return;
      }
      setCupomAplicado({
        codigo: json.codigo,
        mensagem: json.mensagem,
        descontoCentavos: json.descontoCentavos,
        totalCentavos: json.totalCentavos,
      });
      setCupom(json.codigo);
    } catch {
      setCupomErro("Não foi possível validar o cupom agora.");
    } finally {
      setValidandoCupom(false);
    }
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    const nomeLimpo = nome.replace(/\s+/g, " ").trim();
    if (nomeLimpo.length < 3) {
      setErro("Informe o nome completo de quem está contratando.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido — é nele que chega a confirmação do pagamento.");
      return;
    }
    const telNorm = normalizarTelefoneBr(telefone);
    if (!telNorm) {
      setErro("Informe o WhatsApp com DDD (10 ou 11 dígitos).");
      return;
    }
    const docNorm = validarDocumento(documento);
    if (!docNorm) {
      setErro("Informe um CPF ou CNPJ válido. Ele aparece na cobrança do Asaas.");
      return;
    }
    if (cupom.trim() && !cupomAplicado) {
      setErro("Você digitou um cupom. Clique em Aplicar antes de gerar o pagamento, ou apague o código.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano,
          nicho: nichoAtual,
          configuracao,
          nome: nomeLimpo,
          email: email.trim().toLowerCase(),
          telefone: telNorm,
          documento: docNorm,
          forma,
          parcelas: forma === "cartao" ? parcelas : 1,
          previewId: previewId || undefined,
          previewToken: previewToken || undefined,
          cupom: cupomAplicado?.codigo || undefined,
        }),
      });
      const json = await resposta.json();
      if (!resposta.ok) {
        setErro(json.erro || "Não foi possível gerar a cobrança.");
        return;
      }
      sessionStorage.setItem("guix.cobranca", JSON.stringify(json.cobranca));
      if (previewId && previewToken) {
        sessionStorage.setItem(
          "guix.preview",
          JSON.stringify({ id: previewId, token: previewToken }),
        );
      }
      router.push(`/contratar/retorno?cobranca=${json.cobranca.id}`);
    } catch {
      setErro("A conexão falhou. Tente de novo ou fale no WhatsApp.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-8">
        <fieldset>
          <legend className="text-sm font-semibold">Plano</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {planosContrataveis.map((item) => (
              <label key={item.id} className={`cursor-pointer rounded-2xl border p-4 ${plano === item.id ? "border-accent bg-[#FFF7ED]" : "border-line bg-white"}`}>
                <input
                  className="sr-only"
                  type="radio"
                  name="plano"
                  checked={plano === item.id}
                  onChange={() => trocarPlano(item.id)}
                />
                <span className="block text-sm font-semibold">{item.nome}</span>
                <span className="mt-1 block text-lg font-bold">{formatarReais(item.centavos)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold">
          Tipo de negócio
          <select className={campo} value={nichoAtual} onChange={(evento) => setNicho(evento.target.value)}>
            {opcoes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">Configuração</legend>
          <div className="mt-3 grid gap-3">
            <label className={`cursor-pointer rounded-2xl border p-4 ${configuracao === "ia" ? "border-accent bg-[#FFF7ED]" : "border-line bg-white"}`}>
              <input className="mr-2" type="radio" name="configuracao" checked={configuracao === "ia"} onChange={() => setConfiguracao("ia")} />
              Com IA, incluso no plano
            </label>
            <label className={`cursor-pointer rounded-2xl border p-4 ${configuracao === "equipe" ? "border-accent bg-[#FFF7ED]" : "border-line bg-white"}`}>
              <input className="mr-2" type="radio" name="configuracao" checked={configuracao === "equipe"} onChange={() => setConfiguracao("equipe")} />
              Pela equipe, sem IA (+ {formatarReais(TAXA_EQUIPE_CENTAVOS)})
            </label>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold sm:col-span-2">
            Nome completo
            <input className={campo} name="nome" autoComplete="name" required value={nome} onChange={(evento) => setNome(evento.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            E-mail
            <input className={campo} type="email" name="email" autoComplete="email" required value={email} onChange={(evento) => setEmail(evento.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            WhatsApp
            <input className={campo} name="telefone" autoComplete="tel" inputMode="tel" required placeholder="(79) 99999-9999" value={telefone} onChange={(evento) => setTelefone(evento.target.value)} />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            CPF ou CNPJ
            <input className={campo} name="documento" inputMode="numeric" required placeholder="Somente para a cobrança" value={documento} onChange={(evento) => setDocumento(evento.target.value)} />
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold">
            Cupom de desconto
            <span className="ml-1 font-normal text-muted">(opcional)</span>
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              className={`${campo} mt-0 min-w-[12rem] flex-1`}
              name="cupom"
              autoComplete="off"
              placeholder="Código que o comercial enviou"
              value={cupom}
              onChange={(evento) => {
                setCupom(evento.target.value.toUpperCase());
                setCupomAplicado(null);
                setCupomErro("");
              }}
            />
            <button
              type="button"
              onClick={() => void aplicarCupom()}
              disabled={validandoCupom}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:border-accent disabled:opacity-60"
            >
              {validandoCupom ? "Validando…" : "Aplicar"}
            </button>
          </div>
          {cupomAplicado ? <p className="mt-2 text-sm text-emerald-800">{cupomAplicado.mensagem}</p> : null}
          {cupomErro ? <p className="mt-2 text-sm text-rose-700">{cupomErro}</p> : null}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">Como pagar</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["pix", "PIX"],
                ["boleto", "Boleto"],
                ["cartao", "Cartão"],
              ] as const
            ).map(([id, rotulo]) => (
              <label key={id} className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-semibold ${forma === id ? "border-accent bg-[#FFF7ED]" : "border-line bg-white"}`}>
                <input className="sr-only" type="radio" name="forma" checked={forma === id} onChange={() => setForma(id)} />
                {rotulo}
              </label>
            ))}
          </div>
          {forma === "cartao" ? (
            <label className="mt-4 block text-sm font-semibold">
              Parcelas
              <select className={campo} value={parcelas} onChange={(evento) => setParcelas(Number(evento.target.value))}>
                {Array.from({ length: MAX_PARCELAS }, (_, indice) => {
                  const quantidade = indice + 1;
                  const cada = Math.round(total / quantidade);
                  return (
                    <option key={quantidade} value={quantidade}>
                      {quantidade === 1 ? `1x de ${formatarReais(total)}` : `${quantidade}x de ${formatarReais(cada)}`}
                    </option>
                  );
                })}
              </select>
              <span className="mt-2 block text-xs font-normal leading-5 text-muted">
                O total não muda. Se a divisão não for exata, o Asaas ajusta os centavos na última parcela. O número do cartão é digitado só na página do Asaas.
              </span>
            </label>
          ) : (
            <p className="mt-3 text-xs leading-5 text-muted">PIX e boleto são à vista. O parcelamento fica no cartão, em até 12 vezes.</p>
          )}
        </fieldset>

        {erro ? (
          <p className="rounded-xl border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3 text-sm leading-6" role="alert">
            {erro}{" "}
            <a className="font-semibold text-accent" href={linkWhatsapp()}>
              Falar no WhatsApp
            </a>
          </p>
        ) : null}

        <button type="submit" disabled={enviando} className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60">
          {enviando ? "Gerando cobrança…" : "Gerar pagamento"}
        </button>
      </div>

      <aside className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_rgb(15_23_42_/_0.05)] lg:sticky lg:top-24">
        <p className="text-sm font-semibold text-accent">Resumo</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">{planoPorId(plano)?.nome}</h2>
        <p className="mt-2 text-sm text-muted">{nomeDoNicho(plano, nichoAtual)}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Plano</dt>
            <dd>{formatarReais(planoPorId(plano)?.centavos ?? 0)}</dd>
          </div>
          {configuracao === "equipe" ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Configuração pela equipe</dt>
              <dd>{formatarReais(TAXA_EQUIPE_CENTAVOS)}</dd>
            </div>
          ) : null}
          {cupomAplicado ? (
            <div className="flex justify-between gap-4 text-emerald-800">
              <dt>Cupom {cupomAplicado.codigo}</dt>
              <dd>−{formatarReais(cupomAplicado.descontoCentavos)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatarReais(total)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted">PIX, boleto ou cartão. Processado pelo Asaas. Sem mensalidade de site.</p>
      </aside>
    </form>
  );
}
