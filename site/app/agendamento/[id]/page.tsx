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
  negocioNome: string;
  respostaNota?: string;
  podeCancelar: boolean;
  antecedenciaHoras: number;
};

function Conteudo() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const siteId = sp.get("s") || "";
  const token = sp.get("t") || "";
  const [info, setInfo] = useState<Info | null>(null);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params.id || !siteId || !token) {
      setErro("Link incompleto.");
      return;
    }
    void fetch(`/api/agendamentos/${params.id}?s=${encodeURIComponent(siteId)}&t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.erro || "Não encontrado");
        setInfo(j.agendamento);
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Falha ao abrir"));
  }, [params.id, siteId, token]);

  async function cancelar() {
    if (!info || loading) return;
    setLoading(true);
    setErro("");
    try {
      const res = await fetch(`/api/agendamentos/${info.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, cancelToken: token, acao: "cancelar" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.erro || "Não cancelou");
      setOk("Solicitação/agendamento cancelado. O estabelecimento foi avisado.");
      setInfo({ ...info, status: "cancelado", statusRotulo: "Cancelado", podeCancelar: false });
      if (j.whatsappUrl) window.open(j.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Falha ao cancelar");
    } finally {
      setLoading(false);
    }
  }

  if (erro && !info) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Agendamento</h1>
        <p className="mt-3 text-muted">{erro}</p>
      </main>
    );
  }

  if (!info) return <main className="px-5 py-16 text-sm text-muted">Carregando…</main>;

  const rotulo =
    info.statusRotulo ||
    (info.status === "pendente"
      ? "Aguardando confirmação"
      : info.status === "confirmado"
        ? "Confirmado"
        : info.status === "recusado"
          ? "Recusado"
          : "Cancelado");

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">AGENDAMENTO</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">{info.negocioNome}</h1>
      <div className="mt-6 space-y-2 rounded-2xl border border-line bg-white p-5 text-sm">
        <p>
          <strong>Status:</strong> {rotulo}
        </p>
        <p>
          <strong>Cliente:</strong> {info.nomeCompleto}
        </p>
        <p>
          <strong>Serviço:</strong> {info.servico}
        </p>
        <p>
          <strong>Profissional:</strong> {info.profissional}
        </p>
        <p>
          <strong>Quando:</strong> {info.data.split("-").reverse().join("/")} às {info.hora}
        </p>
        {info.respostaNota ? (
          <p>
            <strong>Nota:</strong> {info.respostaNota}
          </p>
        ) : null}
      </div>
      {info.status === "pendente" ? (
        <p className="mt-4 text-sm text-muted">
          Sua solicitação foi enviada. O horário fica reservado até o profissional confirmar ou recusar.
        </p>
      ) : null}
      {ok ? <p className="mt-4 text-sm font-medium text-ink">{ok}</p> : null}
      {erro ? <p className="mt-4 text-sm text-red-600">{erro}</p> : null}
      {info.podeCancelar ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void cancelar()}
          className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Cancelando…" : info.status === "pendente" ? "Cancelar solicitação" : "Desmarcar horário"}
        </button>
      ) : info.status === "confirmado" ? (
        <p className="mt-6 text-sm text-muted">
          Não dá mais para cancelar por aqui — faltam menos de {info.antecedenciaHoras} horas. Fale com o estabelecimento.
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted">
        Depois de confirmado, o cancelamento online exige pelo menos {info.antecedenciaHoras} horas de antecedência.
      </p>
    </main>
  );
}

export default function PaginaAgendamento() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando…</main>}>
      <Conteudo />
    </Suspense>
  );
}
