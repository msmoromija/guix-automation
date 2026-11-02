"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Info = {
  id: string;
  status: string;
  statusRotulo?: string;
  servico: string;
  profissional: string;
  data: string;
  hora: string;
  nomeCompleto: string;
  email?: string;
  telefone?: string;
  negocioNome: string;
  podeResponder?: boolean;
  respostaNota?: string;
};

function Conteudo() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const siteId = sp.get("s") || "";
  const manage = sp.get("m") || "";
  const [info, setInfo] = useState<Info | null>(null);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params.id || !siteId || !manage) {
      setErro("Link incompleto.");
      return;
    }
    void fetch(`/api/agendamentos/${params.id}?s=${encodeURIComponent(siteId)}&m=${encodeURIComponent(manage)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.erro || "Não encontrado");
        setInfo(j.agendamento);
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Falha ao abrir"));
  }, [params.id, siteId, manage]);

  async function responder(acao: "aceitar" | "recusar") {
    if (!info || loading) return;
    setLoading(true);
    setErro("");
    try {
      const res = await fetch(`/api/agendamentos/${info.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, manageToken: manage, acao, nota }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.erro || "Não respondeu");
      setOk(acao === "aceitar" ? "Horário confirmado. Cliente avisado por e-mail." : "Solicitação recusada. Cliente avisado.");
      setInfo({
        ...info,
        status: j.status,
        statusRotulo: j.statusRotulo,
        podeResponder: false,
        respostaNota: nota || info.respostaNota,
      });
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Falha ao responder");
    } finally {
      setLoading(false);
    }
  }

  if (erro && !info) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Gestão do horário</h1>
        <p className="mt-3 text-muted">{erro}</p>
      </main>
    );
  }

  if (!info) return <main className="px-5 py-16 text-sm text-muted">Carregando…</main>;

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">PROFISSIONAL</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Responder solicitação</h1>
      <p className="mt-2 text-sm text-muted">{info.negocioNome}</p>

      <div className="mt-6 space-y-2 rounded-2xl border border-line bg-white p-5 text-sm">
        <p>
          <strong>Status:</strong> {info.statusRotulo || info.status}
        </p>
        <p>
          <strong>Cliente:</strong> {info.nomeCompleto}
        </p>
        {info.email ? (
          <p>
            <strong>E-mail:</strong> {info.email}
          </p>
        ) : null}
        {info.telefone ? (
          <p>
            <strong>Telefone:</strong> {info.telefone}
          </p>
        ) : null}
        <p>
          <strong>Serviço:</strong> {info.servico}
        </p>
        <p>
          <strong>Profissional:</strong> {info.profissional}
        </p>
        <p>
          <strong>Quando:</strong> {info.data.split("-").reverse().join("/")} às {info.hora}
        </p>
      </div>

      {info.podeResponder ? (
        <div className="mt-6 space-y-3">
          <label className="block text-sm">
            Nota opcional para o cliente
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ex.: confirme 10 min antes · traga documento"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void responder("aceitar")}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "…" : "Aceitar horário"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void responder("recusar")}
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Recusar
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Esta solicitação já foi respondida ou cancelada.</p>
      )}

      {ok ? <p className="mt-4 text-sm font-medium text-ink">{ok}</p> : null}
      {erro ? <p className="mt-4 text-sm text-red-600">{erro}</p> : null}
    </main>
  );
}

export default function GestaoAgendamentoPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando…</main>}>
      <Conteudo />
    </Suspense>
  );
}
