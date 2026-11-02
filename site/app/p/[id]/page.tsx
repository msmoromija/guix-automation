"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Dados = {
  id: string;
  nicho: string;
  nome: string;
  cidade?: string;
  status: string;
  expiraEm: string;
  downloadUrl: string;
  demoUrl: string;
  contratarUrl: string;
  contaUrl: string;
  resumo: {
    empresa?: string;
    slogan?: string;
    heroTitulo?: string;
    heroSubtitulo?: string;
  };
};

function Hub() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || "";
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!params.id || !token) {
      setErro("Link incompleto. Abra o endereço com o token do protótipo.");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/prototipo/${params.id}?t=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Protótipo indisponível");
        return;
      }
      setDados(json);
    })();
  }, [params.id, token]);

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Protótipo indisponível</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <Link href="/prototipar" className="mt-6 inline-flex text-accent underline">
          Gerar outro protótipo
        </Link>
      </main>
    );
  }

  if (!dados) {
    return <main className="px-5 py-16 text-sm text-muted">Carregando seu protótipo…</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Seu protótipo · {dados.nicho}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">{dados.resumo.empresa || dados.nome}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={dados.downloadUrl}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Baixar site.json
            </a>
            <Link
              href={dados.contratarUrl}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Contratar este site
            </Link>
            <Link
              href={`/conta/${dados.id}?t=${token}`}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
            >
              Minha área
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-semibold">Conteúdo gerado</h2>
          <p className="mt-2 text-sm text-muted">
            Expira em {new Date(dados.expiraEm).toLocaleDateString("pt-BR")}. Enquanto o slot existir,
            você baixa o JSON e gerencia na área do cliente.
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Hero</dt>
              <dd className="mt-1 font-medium">{dados.resumo.heroTitulo || "—"}</dd>
              <dd className="mt-1 text-muted">{dados.resumo.heroSubtitulo || ""}</dd>
            </div>
            <div>
              <dt className="text-muted">Slogan</dt>
              <dd className="mt-1">{dados.resumo.slogan || "—"}</dd>
            </div>
          </dl>
          <a href={dados.downloadUrl} className="mt-6 inline-flex text-sm font-semibold text-accent underline">
            Download site.json
          </a>
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-4 py-3 text-sm text-muted">
            Visual do modelo {dados.nicho} (referência). Seu JSON já tem o nome{" "}
            <strong>{dados.resumo.empresa || dados.nome}</strong>.
          </div>
          <iframe title="Modelo" src={dados.demoUrl} className="h-[70vh] w-full border-0" />
        </section>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-muted">Carregando…</main>}>
      <Hub />
    </Suspense>
  );
}
