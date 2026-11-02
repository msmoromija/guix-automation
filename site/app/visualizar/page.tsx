"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VisualizarTokenPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">SEU RASCUNHO</p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em]">Digite o token</h1>
      <p className="mt-3 text-sm text-muted">
        O site não fica publicado. Guardamos só o arquivo por 72 horas. Com o token, montamos a
        prévia na hora.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const t = token.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (t) router.push(`/visualizar/${t}`);
        }}
      >
        <input
          className="w-full rounded-xl border border-line px-3 py-3 font-mono text-lg tracking-[0.2em]"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ex.: a1b2c3d4"
          autoComplete="off"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Ver meu site
        </button>
      </form>
    </main>
  );
}
