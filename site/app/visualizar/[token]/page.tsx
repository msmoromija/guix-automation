"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteLivePreview } from "@/components/preview/SiteLivePreview";
import type { VisualConfig } from "@/lib/estudio/visual";

export default function VisualizarRascunhoPage() {
  const params = useParams<{ token: string }>();
  const token = String(params.token || "").toLowerCase();
  const [site, setSite] = useState<Record<string, unknown> | null>(null);
  const [visual, setVisual] = useState<VisualConfig | undefined>();
  const [meta, setMeta] = useState<{
    nome?: string;
    nicho?: string;
    horasRestantes?: number;
    contratarUrl?: string;
  } | null>(null);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const [a, b] = await Promise.all([
        fetch(`/api/prototipo/${token}?t=${token}`),
        fetch(`/api/prototipo/${token}/conteudo?t=${token}`),
      ]);
      const ja = await a.json();
      const jb = await b.json();
      if (!a.ok) {
        setErro(ja.erro || "Este site de teste já expirou");
        return;
      }
      setMeta(ja);
      if (jb.site) setSite(jb.site);
      if (jb.visual) setVisual(jb.visual);
    })();
  }, [token]);

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Este site de teste não está mais disponível</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <p className="mt-2 text-sm text-muted">O rascunho some em 3 dias. Contrate para publicar de verdade.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/prototipar" className="text-accent underline">
            Montar outro
          </Link>
          <Link href="/contratar" className="text-accent underline">
            Contratar
          </Link>
        </div>
      </main>
    );
  }

  if (!site) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo o seu site de teste…</main>;
  }

  const horas = meta?.horasRestantes ?? 72;
  const dias = Math.max(1, Math.round(horas / 24));

  return (
    <div className="min-h-screen bg-black pb-24">
      <SiteLivePreview site={site as Parameters<typeof SiteLivePreview>[0]["site"]} visual={visual} />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-white/80">
            Site de teste · some em <strong className="text-white">{dias} {dias === 1 ? "dia" : "dias"}</strong>
            {meta?.nome ? ` · ${meta.nome}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-white/25 px-4 py-2 text-sm text-white"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 1600);
              }}
            >
              {copiado ? "Link copiado" : "Copiar link"}
            </button>
            <Link
              href={meta?.contratarUrl || `/contratar?nicho=${meta?.nicho || ""}&preview=${token}&t=${token}`}
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Quero publicar este site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
