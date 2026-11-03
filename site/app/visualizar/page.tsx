"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InstrucoesUso } from "@/components/InstrucoesUso";

export default function VisualizarTokenPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">MEU RASCUNHO</p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Abrir o rascunho</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Cole o <strong className="text-ink">token</strong> que apareceu depois de{" "}
        <strong className="text-ink">Salvar protótipo</strong> (também está no link{" "}
        <span className="font-mono text-ink">/visualizar/…</span>). O site de teste some em cerca de 3 dias — não é o
        site publicado com domínio.
      </p>

      <form
        className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const t = codigo.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (t) router.push(`/visualizar/${t}`);
        }}
      >
        <label className="block text-sm font-medium text-ink">
          Token do protótipo
          <input
            className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-mono text-lg tracking-[0.16em]"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="cole o token aqui"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>
        <p className="text-xs text-muted">
          Exemplo: se o link for guix.net.br/visualizar/<span className="font-mono">abc123</span>, o token é{" "}
          <span className="font-mono">abc123</span>.
        </p>
        <button type="submit" className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white sm:w-auto">
          Ver meu site de teste
        </button>
        <div className="flex flex-wrap gap-3 pt-1 text-sm">
          <Link href="/prototipar" className="font-semibold text-accent underline">
            Ainda não tenho token — prototipar
          </Link>
          <Link href="/contratar" className="font-semibold text-accent underline">
            Já quero comprar com domínio
          </Link>
        </div>
      </form>

      <div className="mt-10">
        <InstrucoesUso compacto titulo="Do rascunho até o domínio" />
      </div>
    </main>
  );
}
