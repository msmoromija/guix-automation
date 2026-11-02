"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  status: string;
  statusRotulo: string;
  servico: string;
  profissional: string;
  data: string;
  hora: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  criadoEm: string;
  manageToken: string;
  respostaNota?: string;
};

const campo =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15";

export function InboxSolicitacoes({ siteId, token }: { siteId: string; token: string }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [filtroPro, setFiltroPro] = useState("todos");
  const [notas, setNotas] = useState<Record<string, string>>({});

  const qs = useMemo(() => `siteId=${encodeURIComponent(siteId)}&t=${encodeURIComponent(token)}`, [siteId, token]);

  const carregar = useCallback(async () => {
    setErro("");
    setLoading(true);
    try {
      const res = await fetch(`/api/agendamentos/gestao?${qs}`);
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não carregou as solicitações.");
        return;
      }
      setItens(j.itens || []);
    } catch {
      setErro("Falha de rede.");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const profissionais = useMemo(() => {
    const set = new Set(itens.map((i) => i.profissional).filter(Boolean));
    return ["todos", ...Array.from(set)];
  }, [itens]);

  const visiveis = useMemo(() => {
    const base = filtroPro === "todos" ? itens : itens.filter((i) => i.profissional === filtroPro);
    return base;
  }, [itens, filtroPro]);

  const pendentes = visiveis.filter((i) => i.status === "pendente");
  const demais = visiveis.filter((i) => i.status !== "pendente");

  async function responder(item: Item, acao: "aceitar" | "recusar") {
    setBusyId(item.id);
    setOk("");
    setErro("");
    try {
      const res = await fetch(`/api/agendamentos/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          manageToken: item.manageToken,
          prototipoToken: token,
          acao,
          nota: notas[item.id] || "",
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não respondeu.");
        return;
      }
      setOk(acao === "aceitar" ? `Confirmado: ${item.nomeCompleto}` : `Recusado: ${item.nomeCompleto}`);
      await carregar();
    } catch {
      setErro("Falha de rede ao responder.");
    } finally {
      setBusyId("");
    }
  }

  function Card({ item, pendente }: { item: Item; pendente?: boolean }) {
    return (
      <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">{item.nomeCompleto}</p>
            <p className="text-xs text-muted">
              {item.email} · {item.telefone}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              item.status === "pendente"
                ? "bg-amber-100 text-amber-900"
                : item.status === "confirmado"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {item.statusRotulo}
          </span>
        </div>
        <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted">Quando</dt>
            <dd className="font-medium">
              {item.data.split("-").reverse().join("/")} às {item.hora}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted">Profissional</dt>
            <dd className="font-medium">{item.profissional}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">Serviço</dt>
            <dd className="font-medium">{item.servico}</dd>
          </div>
        </dl>
        {pendente ? (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-muted">
              Nota para o cliente (opcional)
              <input
                className={campo}
                value={notas[item.id] || ""}
                onChange={(e) => setNotas((m) => ({ ...m, [item.id]: e.target.value }))}
                placeholder="Ex.: chegue 10 min antes"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void responder(item, "aceitar")}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Aceitar
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void responder(item, "recusar")}
                className="rounded-full border border-line px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Recusar
              </button>
            </div>
          </div>
        ) : item.respostaNota ? (
          <p className="mt-3 text-xs text-muted">Nota: {item.respostaNota}</p>
        ) : null}
      </article>
    );
  }

  if (loading) return <p className="text-sm text-muted">Carregando solicitações…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Solicitações por profissional</h2>
          <p className="mt-1 text-sm text-muted">
            Cada pedido traz horário e dados do cliente. Aceite ou recuse — o cliente é avisado.
          </p>
        </div>
        <button type="button" onClick={() => void carregar()} className="text-xs font-medium text-accent underline">
          Atualizar
        </button>
      </div>

      {profissionais.length > 2 ? (
        <div className="flex flex-wrap gap-2">
          {profissionais.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFiltroPro(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filtroPro === p ? "bg-ink text-white" : "border border-line bg-white"
              }`}
            >
              {p === "todos" ? "Todos" : p}
            </button>
          ))}
        </div>
      ) : null}

      {erro ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</p> : null}
      {ok ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{ok}</p> : null}

      {pendentes.length ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
            Aguardando resposta ({pendentes.length})
          </p>
          {pendentes.map((item) => (
            <Card key={item.id} item={item} pendente />
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-muted">Nenhuma solicitação pendente neste filtro.</p>
      )}

      {demais.length ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Histórico</p>
          {demais.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
