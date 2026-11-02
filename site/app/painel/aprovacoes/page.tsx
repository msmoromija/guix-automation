"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Job = {
  token: string;
  nicho: string;
  nome: string;
  cidade?: string;
  aprovadoEm: string;
  prazoIntegracao: string;
  status: string;
  contaUrl: string;
  visualizarUrl: string;
  downloadUrl: string;
  contratarUrl: string;
};

function Painel() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [itens, setItens] = useState<Job[]>([]);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  async function carregar() {
    if (!token) {
      setErro("Informe ?token= no link (mesmo do painel de mídia/automação).");
      return;
    }
    setErro("");
    const res = await fetch(`/api/painel/aprovacoes?token=${encodeURIComponent(token)}`);
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Falha");
      return;
    }
    setItens(j.itens || []);
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function marcar(job: Job, status: string) {
    setOk("");
    const res = await fetch(`/api/painel/aprovacoes?token=${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: job.token, status }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não atualizou");
      return;
    }
    setOk(`${job.nome} → ${status}`);
    await carregar();
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">OPS GUIX</p>
      <h1 className="mt-2 text-3xl font-bold">Aprovações e prazos</h1>
      <p className="mt-2 text-sm text-muted">
        Documentação dos protótipos aprovados, prazo de integração e atalhos para JSON / conta / contratar.
      </p>
      {erro ? <p className="mt-4 text-sm text-rose-700">{erro}</p> : null}
      {ok ? <p className="mt-4 text-sm text-emerald-800">{ok}</p> : null}

      <div className="mt-8 space-y-4">
        {itens.length === 0 && !erro ? <p className="text-sm text-muted">Nenhum job aprovado ainda.</p> : null}
        {itens.map((job) => {
          const atrasado = new Date(job.prazoIntegracao).getTime() < Date.now() && job.status !== "publicado";
          return (
            <article key={job.token} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{job.nome}</h2>
                  <p className="text-xs text-muted">
                    {job.nicho}
                    {job.cidade ? ` · ${job.cidade}` : ""} · token {job.token}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${atrasado ? "bg-rose-100 text-rose-900" : "bg-canvas text-ink"}`}>
                  {job.status}
                  {atrasado ? " · prazo" : ""}
                </span>
              </div>
              <p className="mt-3 text-sm">
                Aprovado {new Date(job.aprovadoEm).toLocaleString("pt-BR")} · prazo{" "}
                {new Date(job.prazoIntegracao).toLocaleString("pt-BR")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <a className="underline text-accent" href={job.visualizarUrl} target="_blank" rel="noreferrer">
                  Preview
                </a>
                <a className="underline text-accent" href={job.contaUrl} target="_blank" rel="noreferrer">
                  Conta
                </a>
                <a className="underline text-accent" href={job.downloadUrl} target="_blank" rel="noreferrer">
                  site.json
                </a>
                <a className="underline text-accent" href={job.contratarUrl} target="_blank" rel="noreferrer">
                  Contratar
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => void marcar(job, "em_integracao")}>
                  Em integração
                </button>
                <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => void marcar(job, "pago")}>
                  Pago
                </button>
                <button type="button" className="rounded-full bg-ink px-3 py-1.5 text-xs text-white" onClick={() => void marcar(job, "publicado")}>
                  Publicado
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default function PainelAprovacoesPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Abrindo…</main>}>
      <Painel />
    </Suspense>
  );
}
