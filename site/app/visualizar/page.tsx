"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VisualizarTokenPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">SEU SITE DE TESTE</p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em]">Abrir o rascunho</h1>
      <p className="mt-3 text-sm text-muted">
        Cole o código que veio no link (a parte depois de /visualizar/). O site de teste some em 3
        dias — não é o site publicado.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const t = codigo.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (t) router.push(`/visualizar/${t}`);
        }}
      >
        <input
          className="w-full rounded-xl border border-line px-3 py-3 font-mono text-lg tracking-[0.2em]"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="código do link"
          autoComplete="off"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Ver meu site de teste
        </button>
      </form>
    </main>
  );
}
