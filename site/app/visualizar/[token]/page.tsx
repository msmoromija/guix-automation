"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteLivePreview } from "@/components/preview/SiteLivePreview";

export default function VisualizarRascunhoPage() {
  const params = useParams<{ token: string }>();
  const token = String(params.token || "").toLowerCase();
  const [site, setSite] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<{
    nome?: string;
    nicho?: string;
    expiraEm?: string;
    horasRestantes?: number;
    contratarUrl?: string;
    downloadUrl?: string;
    cidade?: string;
  } | null>(null);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [salvando, setSalvando] = useState(false);

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
        setErro(ja.erro || "Rascunho expirado");
        return;
      }
      setMeta(ja);
      setNome(ja.nome || "");
      setCidade(ja.cidade || "");
      if (jb.site) setSite(jb.site);
    })();
  }, [token]);

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cidade, whatsapp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não salvou");
        return;
      }
      if (data.site) setSite(data.site);
    } finally {
      setSalvando(false);
    }
  }

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Rascunho indisponível</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <p className="mt-2 text-sm text-muted">O arquivo some em 72 horas. Contrate para publicar de verdade.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/prototipar" className="text-accent underline">
            Gerar outro
          </Link>
          <Link href="/contratar" className="text-accent underline">
            Contratar
          </Link>
        </div>
      </main>
    );
  }

  if (!site) {
    return <main className="px-5 py-16 text-sm text-muted">Montando a prévia a partir do seu arquivo…</main>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">
              Prévia sob demanda · some em {meta?.horasRestantes ?? 72}h
            </p>
            <p className="font-mono text-lg tracking-[0.18em] text-white">{token}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
              onClick={() => {
                void navigator.clipboard.writeText(token);
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 1500);
              }}
            >
              {copiado ? "Token copiado" : "Copiar token"}
            </button>
            {meta?.downloadUrl ? (
              <a href={meta.downloadUrl} className="rounded-full border border-white/25 px-4 py-2 text-sm text-white">
                Baixar JSON
              </a>
            ) : null}
            <Link
              href={meta?.contratarUrl || `/contratar?nicho=${meta?.nicho || ""}&preview=${token}&t=${token}`}
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Publicar este site
            </Link>
          </div>
        </div>
      </header>

      <form
        onSubmit={salvarEdicao}
        className="mx-auto grid max-w-6xl gap-2 px-4 py-4 sm:grid-cols-4"
      >
        <input
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
        />
        <input
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Cidade"
        />
        <input
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp"
        />
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
        >
          {salvando ? "Atualizando…" : "Atualizar prévia"}
        </button>
      </form>

      <SiteLivePreview site={site} />
    </div>
  );
}
