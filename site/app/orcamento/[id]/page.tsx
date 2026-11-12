"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PainelCobranca } from "@/components/PainelCobranca";
import type { Cobranca } from "@/lib/cobranca";
import { formatarReais } from "@/lib/dinheiro";
import { MAX_PARCELAS } from "@/lib/planos";
import { contato, linkWhatsapp } from "@/lib/contato";

type OrcamentoPub = {
  id: string;
  titulo: string;
  descricao: string;
  prazo?: string;
  clienteNome: string;
  valorCentavos: number;
  descontoCentavos: number;
  totalCentavos: number;
  status: string;
};

export default function OrcamentoPublicoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id || "");

  const [orcamento, setOrcamento] = useState<OrcamentoPub | null>(null);
  const [contrato, setContrato] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [aceite, setAceite] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [forma, setForma] = useState<"pix" | "boleto" | "cartao">("pix");
  const [parcelas, setParcelas] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch(`/api/orcamentos/${encodeURIComponent(id)}`);
        const j = await res.json();
        if (!res.ok) {
          setErro(j.erro || "Link inválido.");
          return;
        }
        setOrcamento(j.orcamento);
        setContrato(j.contrato || "");
        if (j.orcamento?.clienteNome) setNome(j.orcamento.clienteNome);
      } catch {
        setErro("Não foi possível abrir este orçamento.");
      } finally {
        setCarregando(false);
      }
    })();
  }, [id]);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    if (!aceite) {
      setErro("Marque que leu e aceita o contrato.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch(`/api/orcamentos/${encodeURIComponent(id)}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aceite: true,
          nome,
          email,
          telefone,
          documento,
          forma,
          parcelas: forma === "cartao" ? parcelas : 1,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não deu para gerar o pagamento.");
        return;
      }
      setCobranca(j.cobranca);
      try {
        sessionStorage.setItem("guix.cobranca", JSON.stringify(j.cobranca));
      } catch {
        /* ignore */
      }
      if (j.cobranca?.id) {
        router.replace(`/contratar/retorno?cobranca=${j.cobranca.id}`);
      }
    } catch {
      setErro("Falha de conexão ao gerar o pagamento.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo orçamento…</main>;
  }

  if (erro && !orcamento) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Orçamento indisponível</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <a className="mt-6 inline-block text-accent underline" href={linkWhatsapp("Olá, recebi um link de orçamento GuiX e preciso de ajuda.")}>
          Falar no WhatsApp
        </a>
      </main>
    );
  }

  if (!orcamento) return null;

  if (orcamento.status === "pago") {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <p className="text-sm font-semibold text-emerald-700">Pago</p>
        <h1 className="mt-2 text-2xl font-bold">{orcamento.titulo}</h1>
        <p className="mt-3 text-muted">Este orçamento já foi quitado. Em caso de dúvida, fale com o atendimento.</p>
        <a className="mt-6 inline-block rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white" href={`mailto:${contato.email}`}>
          {contato.email}
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="text-sm font-bold tracking-tight text-ink">
            GuiX
          </Link>
          <p className="text-xs text-muted">Orçamento personalizado</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <p className="text-sm font-semibold text-accent">Sob medida</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">{orcamento.titulo}</h1>
        {orcamento.clienteNome ? <p className="mt-2 text-sm text-muted">Para {orcamento.clienteNome}</p> : null}

        <section className="mt-8 rounded-[28px] border border-line bg-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] sm:p-8">
          <h2 className="text-lg font-semibold">Elaboração comercial</h2>
          <div className="mt-4 max-h-[36rem] overflow-auto rounded-2xl bg-slate-50/80 p-4 sm:p-5">
            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-7 text-slate-700">{orcamento.descricao}</pre>
          </div>
          {orcamento.prazo ? (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold text-ink">Prazo de elaboração:</span> {orcamento.prazo}
            </p>
          ) : null}

          <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Valor padrão</p>
              <p className="mt-1 text-xl font-semibold">{formatarReais(orcamento.valorCentavos)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Desconto</p>
              <p className="mt-1 text-xl font-semibold text-emerald-700">
                {orcamento.descontoCentavos ? `− ${formatarReais(orcamento.descontoCentavos)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Total</p>
              <p className="mt-1 text-2xl font-bold text-ink">{formatarReais(orcamento.totalCentavos)}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-line bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Contrato</h2>
          <p className="mt-1 text-sm text-muted">Leia com atenção antes de pagar.</p>
          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-[13px] leading-6 text-slate-700">
            {contrato}
          </pre>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
              />
              <span>Li e aceito o contrato de prestação de serviços deste orçamento.</span>
            </label>
            <a
              href={`/api/orcamentos/${encodeURIComponent(orcamento.id)}/contrato.pdf`}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/40"
              download={`guix-contrato-${orcamento.id}.pdf`}
            >
              Baixar contrato (PDF)
            </a>
          </div>
        </section>

        {cobranca ? (
          <div className="mt-6">
            <PainelCobranca cobranca={cobranca} />
          </div>
        ) : (
          <form onSubmit={pagar} className="mt-6 space-y-4 rounded-[28px] border border-line bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Seus dados e pagamento</h2>
            <label className="block text-sm">
              Nome completo
              <input className="mt-1 w-full rounded-xl border border-line px-3 py-2.5" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </label>
            <label className="block text-sm">
              E-mail
              <input type="email" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                WhatsApp
                <input className="mt-1 w-full rounded-xl border border-line px-3 py-2.5" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
              </label>
              <label className="block text-sm">
                CPF ou CNPJ
                <input className="mt-1 w-full rounded-xl border border-line px-3 py-2.5" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
              </label>
            </div>

            <div>
              <p className="text-sm font-medium">Forma de pagamento</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["pix", "PIX"],
                    ["boleto", "Boleto"],
                    ["cartao", "Cartão"],
                  ] as const
                ).map(([idForma, label]) => (
                  <button
                    key={idForma}
                    type="button"
                    onClick={() => setForma(idForma)}
                    className={`rounded-full px-4 py-2 text-sm ${forma === idForma ? "bg-ink text-white" : "border border-line"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {forma === "cartao" ? (
                <label className="mt-3 block text-sm">
                  Parcelas
                  <select
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                  >
                    {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-2 text-xs text-muted">PIX e boleto são à vista.</p>
              )}
            </div>

            {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

            {!aceite ? (
              <p className="text-sm text-amber-800">Marque “Li e aceito o contrato” acima para liberar o pagamento.</p>
            ) : null}
            <button
              type="submit"
              disabled={enviando || !aceite}
              className="w-full rounded-full bg-accent px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {enviando ? "Gerando pagamento…" : `Pagar ${formatarReais(orcamento.totalCentavos)}`}
            </button>
            <p className="text-center text-xs text-muted">
              Processado pelo Asaas. Dúvidas:{" "}
              <a className="text-accent underline" href={linkWhatsapp(`Olá, estou no orçamento ${orcamento.id} e preciso de ajuda.`)}>
                WhatsApp
              </a>{" "}
              ou {contato.email}
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
