"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteLivePreview } from "@/components/preview/SiteLivePreview";

type Dados = {
  id: string;
  nicho: string;
  nome: string;
  status: string;
  expiraEm: string;
  downloadUrl: string;
  demoUrl: string;
  contratarUrl: string;
};

function Hub() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || "";
  const [dados, setDados] = useState<Dados | null>(null);
  const [site, setSite] = useState<Record<string, unknown> | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!params.id || !token) {
      setErro("Link incompleto. Abra o endereço com o token do protótipo.");
      return;
    }
    void (async () => {
      const [metaRes, siteRes] = await Promise.all([
        fetch(`/api/prototipo/${params.id}?t=${encodeURIComponent(token)}`),
        fetch(`/api/prototipo/${params.id}/conteudo?t=${encodeURIComponent(token)}`),
      ]);
      const meta = await metaRes.json();
      const corpo = await siteRes.json();
      if (!metaRes.ok) {
        setErro(meta.erro || "Protótipo indisponível");
        return;
      }
      setDados(meta);
      if (siteRes.ok && corpo.site) setSite(corpo.site);
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
    return <main className="px-5 py-16 text-sm text-muted">Carregando o site do seu negócio…</main>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">
              Preview ao vivo · {dados.nicho} · {dados.status}
            </p>
            <p className="text-sm text-slate-300">Este é o site gerado com os dados do seu negócio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={dados.downloadUrl}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Baixar site.json
            </a>
            <Link
              href={dados.contratarUrl}
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Contratar este site
            </Link>
            <Link
              href={`/conta/${dados.id}?t=${token}`}
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white"
            >
              Minha área
            </Link>
          </div>
        </div>
      </header>

      {site ? (
        <SiteLivePreview site={site} />
      ) : (
        <p className="p-8 text-center text-sm text-slate-400">
          Conteúdo ainda não disponível.{" "}
          <a href={dados.demoUrl} className="underline">
            Ver modelo de referência
          </a>
        </p>
      )}
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
