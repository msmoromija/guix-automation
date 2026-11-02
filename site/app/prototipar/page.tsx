"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { nichos } from "@/lib/nichos";

function Formulario() {
  const router = useRouter();
  const sp = useSearchParams();
  const nichoInicial = sp.get("nicho") || "barbearia";

  const [nicho, setNicho] = useState(nichoInicial);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const nichoAtual = useMemo(
    () => nichos.find((n) => n.slug === nicho) || nichos[0],
    [nicho],
  );

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/prototipo/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, nicho, cidade, whatsapp, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível gerar o protótipo.");
        return;
      }
      router.push(`/p/${data.id}?t=${data.token}`);
    } catch {
      setErro("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">PROTÓTIPO GRÁTIS</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em]">Veja o site do seu negócio</h1>
      <p className="mt-4 text-muted">
        Escolha o modelo <strong>{nichoAtual.nome}</strong>, informe os dados básicos e geramos um{" "}
        <code className="rounded bg-slate-100 px-1 text-sm">site.json</code> para você baixar e um
        preview temporário — sem pagar. Depois é só contratar para publicar de verdade.
      </p>

      <form onSubmit={enviar} className="mt-8 space-y-4">
        <label className="block text-sm">
          Modelo
          <select
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
          >
            {nichos.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.nome} — {n.negocio}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Nome do seu negócio
          <input
            required
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Barbearia Centro"
          />
        </label>
        <label className="block text-sm">
          Cidade
          <input
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Aracaju"
          />
        </label>
        <label className="block text-sm">
          WhatsApp
          <input
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="79999990000"
          />
        </label>
        <label className="block text-sm">
          E-mail (opcional)
          <input
            type="email"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <button
          type="submit"
          disabled={loading || !nome}
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? "Gerando protótipo…" : "Gerar meu protótipo"}
        </button>
      </form>

      <p className="mt-6 text-xs text-muted">
        Slots de preview são limitados e expiram em alguns dias. O download do JSON fica disponível
        enquanto o slot existir.
      </p>
    </main>
  );
}

export default function PrototiparPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-muted">Carregando…</main>}>
      <Formulario />
    </Suspense>
  );
}
