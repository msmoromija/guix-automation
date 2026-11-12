"use client";

import { useCallback, useState } from "react";

const NICHOS = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "dentista",
  "clinica",
  "psicologia",
  "nutricionista",
] as const;

export default function PainelAutomacaoPage() {
  const [token, setToken] = useState("");
  const [clienteId, setClienteId] = useState("demo");
  const [nicho, setNicho] = useState<(typeof NICHOS)[number]>("barbearia");
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("Aracaju");
  const [whatsapp, setWhatsapp] = useState("");
  const [msg, setMsg] = useState("");
  const [json, setJson] = useState("");

  const headers = useCallback(
    () => ({
      "x-painel-token": token,
      "x-cliente-id": clienteId,
      "Content-Type": "application/json",
    }),
    [token, clienteId],
  );

  async function gerar() {
    setMsg("Gerando site.json…");
    setJson("");
    const res = await fetch("/api/automacao/gerar-site", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        nome,
        nicho,
        cidade,
        whatsapp: whatsapp || undefined,
        gravarPacote: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.erro || "erro");
      return;
    }
    setJson(JSON.stringify(data.site, null, 2));
    setMsg(
      `OK · ${data.clienteId} · ${(data.avisos || []).join(" · ") || "sem avisos"} · imagens: ${(data.imagens || [])
        .map((i: { categoria: string; origem: string }) => `${i.categoria}:${i.origem}`)
        .join(", ")}`,
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-900">
      <h1 className="text-2xl font-semibold tracking-tight">Painel · automação</h1>
      <p className="mt-2 text-sm text-slate-600">
        Gera <code className="rounded bg-slate-100 px-1">site.json</code> 1.0.0 a partir do exemplo do
        nicho, textos OpenAI e imagens da biblioteca. Uploads do cliente (se enviados na API) têm
        prioridade e ficam isolados por <code className="rounded bg-slate-100 px-1">clienteId</code>.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Token
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Cliente ID
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Nicho
          <select
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5"
            value={nicho}
            onChange={(e) => setNicho(e.target.value as (typeof NICHOS)[number])}
          >
            {NICHOS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Nome do negócio
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Cidade
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />
        </label>
        <label className="text-sm">
          WhatsApp
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="79999990000"
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        disabled={!nome || !token}
        onClick={() => void gerar()}
      >
        Gerar site
      </button>

      {msg ? <p className="mt-4 text-sm text-slate-600">{msg}</p> : null}

      {json ? (
        <pre className="mt-6 max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          {json}
        </pre>
      ) : null}
    </main>
  );
}
