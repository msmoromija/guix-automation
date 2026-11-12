"use client";

import { Suspense, useEffect, useState } from "react";
import { formatarReais } from "@/lib/dinheiro";
import { gerarCodigoSugestao } from "@/lib/cupons/store-client";
import { baixarBlob, gerarImagemCupomPng } from "@/lib/cupons/imagem-cupom";

type Cupom = {
  codigo: string;
  tipo: "fixo" | "percentual";
  valorCentavos: number;
  percentual: number;
  ativo: boolean;
  usosMaximos: number | null;
  usos: number;
  validoAte: string | null;
  planos: string[] | null;
  nota: string;
  criadoPor: string;
  criadoEm: string;
};

const STORAGE_KEY = "guix.cupons.senha";

function PainelCupons() {
  const [senha, setSenha] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [itens, setItens] = useState<Cupom[]>([]);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [liberado, setLiberado] = useState(false);

  const [codigo, setCodigo] = useState(() => gerarCodigoSugestao());
  const [tipo, setTipo] = useState<"fixo" | "percentual">("fixo");
  const [valorReais, setValorReais] = useState("250");
  const [percentual, setPercentual] = useState("10");
  const [usosMaximos, setUsosMaximos] = useState("1");
  const [validoAte, setValidoAte] = useState("");
  const [criadoPor, setCriadoPor] = useState("comercial");
  const [nota, setNota] = useState("");
  const [planoSimples, setPlanoSimples] = useState(true);
  const [planoAvancado, setPlanoAvancado] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [gerandoImg, setGerandoImg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const salva = sessionStorage.getItem(STORAGE_KEY) || "";
      if (salva) {
        setSenha(salva);
        setLiberado(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (liberado && senha) void carregar(senha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liberado, senha]);

  async function carregar(s = senha) {
    setErro("");
    const res = await fetch("/api/painel/cupons", {
      headers: { "x-cupons-senha": s },
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Senha incorreta.");
      setLiberado(false);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    setItens(j.itens || []);
    if (j.sugestao && !codigo) setCodigo(j.sugestao);
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const s = senhaDigitada.trim();
    if (!s) {
      setErro("Digite a senha do comercial.");
      return;
    }
    setSenha(s);
    setLiberado(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  function sair() {
    setLiberado(false);
    setSenha("");
    setSenhaDigitada("");
    setItens([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOk("");
    setEnviando(true);
    try {
      const planos: string[] = [];
      if (planoSimples) planos.push("simples");
      if (planoAvancado) planos.push("avancado");
      const res = await fetch("/api/painel/cupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cupons-senha": senha,
        },
        body: JSON.stringify({
          codigo: codigo || gerarCodigoSugestao(),
          tipo,
          valorReais: tipo === "fixo" ? Number(valorReais.replace(",", ".")) : undefined,
          percentual: tipo === "percentual" ? Number(percentual) : undefined,
          usosMaximos: usosMaximos.trim() === "" ? null : Number(usosMaximos),
          validoAte: validoAte || null,
          planos: planos.length === 2 ? null : planos,
          criadoPor,
          nota,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não criou o cupom");
        return;
      }
      setOk(`Cupom ${j.cupom.codigo} criado.`);
      setNota("");
      setCodigo(gerarCodigoSugestao());
      await carregar();
      await baixarImagem(j.cupom as Cupom);
    } finally {
      setEnviando(false);
    }
  }

  async function alternar(c: Cupom) {
    setOk("");
    const res = await fetch("/api/painel/cupons", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-cupons-senha": senha,
      },
      body: JSON.stringify({ codigo: c.codigo, ativo: !c.ativo }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não atualizou");
      return;
    }
    setOk(`${c.codigo} → ${j.cupom.ativo ? "ativo" : "desativado"}`);
    await carregar();
  }

  async function baixarImagem(c: Cupom) {
    setGerandoImg(c.codigo);
    setErro("");
    try {
      const blob = await gerarImagemCupomPng({
        codigo: c.codigo,
        tipo: c.tipo,
        valorCentavos: c.valorCentavos,
        percentual: c.percentual,
        validoAte: c.validoAte,
      });
      baixarBlob(blob, `cupom-${c.codigo}.png`);
      setOk(`Imagem de ${c.codigo} baixada — envie no WhatsApp ao cliente.`);
    } catch {
      setErro("Não foi possível gerar a imagem do cupom.");
    } finally {
      setGerandoImg(null);
    }
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";

  if (!liberado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">COMERCIAL GUIX</p>
        <h1 className="mt-2 text-3xl font-bold">Cupons</h1>
        <p className="mt-2 text-sm text-muted">Acesso restrito ao time comercial.</p>
        <form onSubmit={entrar} className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6">
          <label className="block text-sm font-semibold">
            Senha
            <input
              className={campo}
              type="password"
              autoComplete="current-password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              required
            />
          </label>
          {erro ? <p className="text-sm text-rose-700">{erro}</p> : null}
          <button type="submit" className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">COMERCIAL GUIX</p>
          <h1 className="mt-2 text-3xl font-bold">Cupons de desconto</h1>
          <p className="mt-2 text-sm text-muted">
            Gere o código, baixe a imagem e envie ao cliente. Ele digita o cupom em <strong>Quero meu site</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/painel/prospeccao" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Prospecção
          </a>
          <a href="/painel/orcamentos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Orçamentos
          </a>
          <a href="/painel/pedidos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Pedidos / ZIP
          </a>
          <button type="button" onClick={sair} className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Sair
          </button>
        </div>
      </div>

      {erro ? <p className="mt-4 text-sm text-rose-700">{erro}</p> : null}
      {ok ? <p className="mt-4 text-sm text-emerald-800">{ok}</p> : null}

      <form onSubmit={criar} className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Novo cupom</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold">Código</label>
            <div className="mt-1.5 flex gap-2">
              <input
                className={`${campo} mt-0 flex-1 font-mono tracking-wide`}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
              />
              <button
                type="button"
                onClick={() => setCodigo(gerarCodigoSugestao())}
                className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-semibold"
              >
                Aleatório
              </button>
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Quem gerou
            <input className={campo} value={criadoPor} onChange={(e) => setCriadoPor(e.target.value)} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold">Tipo de desconto</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className={`cursor-pointer rounded-xl border px-4 py-2 text-sm ${tipo === "fixo" ? "border-accent bg-[#FFF7ED]" : "border-line"}`}>
                <input className="sr-only" type="radio" checked={tipo === "fixo"} onChange={() => setTipo("fixo")} />
                Valor em R$
              </label>
              <label className={`cursor-pointer rounded-xl border px-4 py-2 text-sm ${tipo === "percentual" ? "border-accent bg-[#FFF7ED]" : "border-line"}`}>
                <input className="sr-only" type="radio" checked={tipo === "percentual"} onChange={() => setTipo("percentual")} />
                Percentual %
              </label>
            </div>
          </fieldset>
          {tipo === "fixo" ? (
            <label className="block text-sm font-semibold">
              Desconto (R$)
              <input className={campo} inputMode="decimal" value={valorReais} onChange={(e) => setValorReais(e.target.value)} required />
            </label>
          ) : (
            <label className="block text-sm font-semibold">
              Percentual (1–90)
              <input className={campo} inputMode="numeric" value={percentual} onChange={(e) => setPercentual(e.target.value)} required />
            </label>
          )}
          <label className="block text-sm font-semibold">
            Usos máximos (vazio = ilimitado)
            <input className={campo} inputMode="numeric" value={usosMaximos} onChange={(e) => setUsosMaximos(e.target.value)} placeholder="1" />
          </label>
          <label className="block text-sm font-semibold">
            Válido até (opcional)
            <input className={campo} type="date" value={validoAte} onChange={(e) => setValidoAte(e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Planos</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={planoSimples} onChange={(e) => setPlanoSimples(e.target.checked)} />
                Presença Completa
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={planoAvancado} onChange={(e) => setPlanoAvancado(e.target.checked)} />
                Presença Avançada
              </label>
            </div>
          </div>
          <label className="block text-sm font-semibold sm:col-span-2">
            Nota interna
            <input className={campo} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Cliente X / campanha março" />
          </label>
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {enviando ? "Criando…" : "Gerar cupom + imagem"}
        </button>
      </form>

      <section className="mt-10 space-y-4">
        <h2 className="text-base font-semibold">Cupons</h2>
        {itens.length === 0 && !erro ? <p className="text-sm text-muted">Nenhum cupom ainda.</p> : null}
        {itens.map((c) => (
          <article key={c.codigo} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-bold tracking-wide">{c.codigo}</p>
                <p className="mt-1 text-sm text-muted">
                  {c.tipo === "fixo" ? formatarReais(c.valorCentavos) : `${c.percentual}%`} de desconto
                  {" · "}
                  {c.usos}
                  {c.usosMaximos != null ? `/${c.usosMaximos}` : ""} usos
                  {c.validoAte ? ` · até ${new Date(c.validoAte).toLocaleDateString("pt-BR")}` : ""}
                  {c.planos?.length ? ` · planos: ${c.planos.join(", ")}` : " · todos os planos"}
                </p>
                {c.nota ? <p className="mt-1 text-xs text-muted">{c.nota} · {c.criadoPor}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.ativo ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                  {c.ativo ? "Ativo" : "Off"}
                </span>
                <button
                  type="button"
                  disabled={gerandoImg === c.codigo}
                  onClick={() => void baixarImagem(c)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                >
                  {gerandoImg === c.codigo ? "Gerando…" : "Baixar imagem"}
                </button>
                <button type="button" onClick={() => void alternar(c)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">
                  {c.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando cupons…</main>}>
      <PainelCupons />
    </Suspense>
  );
}
