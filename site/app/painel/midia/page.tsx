"use client";

import { useCallback, useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type FotoUnsplash = {
  id: string;
  descricao: string;
  url_thumb: string;
  url_regular: string;
  url_download: string;
  fotografo: string;
  perfil_url: string;
  unsplash_url: string;
};

type ItemBiblioteca = { key: string; url: string; size: number };

type ItemCliente = {
  key: string;
  url: string;
  size: number;
  status?: string;
  motivo?: string;
  categoria?: string;
  alt?: string;
};

const NICHOS = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "clinica",
  "generico",
] as const;

const CATEGORIAS = [
  "hero",
  "servico",
  "sobre",
  "profissional",
  "galeria",
  "promocao",
  "evento",
  "logo",
  "og",
] as const;

function PainelMidiaInner() {
  const sp = useSearchParams();
  const [token, setToken] = useState("");
  const [clienteId, setClienteId] = useState("demo");

  useEffect(() => {
    const fromUrl = sp.get("clienteId");
    if (fromUrl) setClienteId(fromUrl);
  }, [sp]);
  const [nicho, setNicho] = useState<(typeof NICHOS)[number]>("barbearia");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("hero");
  const [biblioteca, setBiblioteca] = useState<ItemBiblioteca[]>([]);
  const [meus, setMeus] = useState<ItemCliente[]>([]);
  const [termo, setTermo] = useState("barbershop interior");
  const [fotos, setFotos] = useState<FotoUnsplash[]>([]);
  const [msg, setMsg] = useState("");
  const [atual, setAtual] = useState<{
    src: string;
    credito?: string;
    status?: string;
    motivo?: string;
  } | null>(null);

  const headers = useCallback(() => {
    const h: Record<string, string> = {
      "x-painel-token": token,
      "x-cliente-id": clienteId,
    };
    return h;
  }, [token, clienteId]);

  async function carregarBiblioteca() {
    setMsg("Carregando biblioteca…");
    const res = await fetch(`/api/midia/biblioteca?nicho=${nicho}&categoria=${categoria}`, {
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.erro || "erro");
      return;
    }
    setBiblioteca(data.itens || []);
    setMsg(`${(data.itens || []).length} foto(s) na biblioteca compartilhada`);
  }

  async function carregarMeus() {
    setMsg("Carregando suas imagens…");
    const res = await fetch(`/api/midia/meus-uploads?categoria=${categoria}`, {
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.erro || "erro");
      return;
    }
    setMeus(data.itens || []);
    setMsg(`${(data.itens || []).length} imagem(ns) deste cliente (isoladas)`);
  }

  async function buscarUnsplash() {
    setMsg("Buscando Unsplash…");
    const res = await fetch(`/api/midia/unsplash?q=${encodeURIComponent(termo)}`, {
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.erro || "erro");
      return;
    }
    setFotos(data.fotos || []);
    setMsg(`${(data.fotos || []).length} resultado(s)`);
  }

  async function escolherUnsplash(foto: FotoUnsplash) {
    setMsg("Baixando, filtrando e enquadrando no R2 do cliente…");
    const res = await fetch("/api/midia/unsplash", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ foto, nicho, categoria }),
    });
    const data = await res.json();
    if (!res.ok || data.status === "negada") {
      setAtual({
        src: data.src || "",
        credito: data.credito?.texto,
        status: "negada",
        motivo: data.motivo || data.erro,
      });
      setMsg(data.motivo || data.erro || "negada");
      await carregarMeus();
      return;
    }
    setAtual({ src: data.src, credito: data.credito?.texto, status: "aprovada" });
    setMsg("Salva no espaço do cliente com atribuição Unsplash");
    await carregarMeus();
  }

  async function enviarUpload(file: File) {
    setMsg("Enviando, filtrando e enquadrando…");
    const form = new FormData();
    form.set("arquivo", file);
    form.set("alt", file.name);
    form.set("categoria", categoria);
    const res = await fetch("/api/midia/upload", {
      method: "POST",
      headers: headers(),
      body: form,
    });
    const data = await res.json();
    if (!res.ok || data.status === "negada") {
      setAtual({
        src: data.src || "",
        status: "negada",
        motivo: data.motivo || data.erro,
      });
      setMsg(data.motivo || data.erro || "negada");
      await carregarMeus();
      return;
    }
    setAtual({ src: data.src, status: "aprovada" });
    setMsg(`Aprovada e enquadrada para ${categoria}`);
    await carregarMeus();
  }

  async function avaliar(key: string, decisao: "aprovada" | "negada") {
    setMsg(decisao === "aprovada" ? "Publicando…" : "Negando…");
    const res = await fetch("/api/midia/avaliar", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        r2_key: key,
        decisao,
        motivo: decisao === "negada" ? "Reprovada manualmente no painel" : undefined,
        categoria,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.erro || "erro");
      return;
    }
    if (data.src) setAtual({ src: data.src, status: data.status });
    setMsg(data.status === "aprovada" ? "Publicada no espaço do cliente" : "Negada");
    await carregarMeus();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-900">
      <h1 className="text-2xl font-semibold tracking-tight">Painel · imagens</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Biblioteca compartilhada, Unsplash e upload próprio. Uploads ficam isolados por{" "}
        <code className="rounded bg-slate-100 px-1">clienteId</code>, são filtrados e enquadrados
        no slot do banner — ou negados se não atenderem.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="text-sm">
          Token
          <input
            className="mt-1 block w-56 rounded border border-slate-300 px-2 py-1.5"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
          />
        </label>
        <label className="text-sm">
          Cliente ID
          <input
            className="mt-1 block w-40 rounded border border-slate-300 px-2 py-1.5"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            placeholder="id do projeto"
          />
        </label>
        <label className="text-sm">
          Nicho
          <select
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5"
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
          Slot / categoria
          <select
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as (typeof CATEGORIAS)[number])}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {msg ? <p className="mt-4 text-sm text-slate-500">{msg}</p> : null}

      {atual ? (
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium">
            Slot atual{" "}
            {atual.status ? (
              <span
                className={
                  atual.status === "aprovada"
                    ? "text-emerald-700"
                    : atual.status === "negada"
                      ? "text-red-700"
                      : "text-amber-700"
                }
              >
                · {atual.status}
              </span>
            ) : null}
          </p>
          {atual.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={atual.src} alt="" className="mt-3 max-h-48 rounded-lg object-cover" />
          ) : null}
          {atual.motivo ? <p className="mt-2 text-sm text-red-600">{atual.motivo}</p> : null}
          {atual.credito ? (
            <p className="mt-2 text-[11px] text-slate-500 opacity-70">{atual.credito}</p>
          ) : null}
        </div>
      ) : null}

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Suas imagens (só deste cliente)</h2>
          <button
            type="button"
            onClick={carregarMeus}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            Atualizar
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {meus.map((item) => (
            <div key={item.key} className="overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                className="block w-full text-left"
                onClick={() =>
                  setAtual({
                    src: item.url,
                    status: item.status,
                    motivo: item.motivo,
                  })
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="aspect-video w-full object-cover" />
              </button>
              <div className="space-y-1 px-2 py-1.5">
                <p className="truncate text-[10px] text-slate-500">{item.status || "—"}</p>
                {item.motivo ? (
                  <p className="line-clamp-2 text-[10px] text-red-600">{item.motivo}</p>
                ) : null}
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white"
                    onClick={() => void avaliar(item.key, "aprovada")}
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-700 px-1.5 py-0.5 text-[10px] text-white"
                    onClick={() => void avaliar(item.key, "negada")}
                  >
                    Negar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Biblioteca própria (compartilhada por nicho)</h2>
          <button
            type="button"
            onClick={carregarBiblioteca}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            Atualizar
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {biblioteca.map((item) => (
            <button
              key={item.key}
              type="button"
              className="overflow-hidden rounded-lg border border-slate-200 text-left"
              onClick={() => setAtual({ src: item.url, status: "aprovada" })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="aspect-video w-full object-cover" />
              <span className="block truncate px-2 py-1 text-[10px] text-slate-500">{item.key}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Unsplash → R2 do cliente</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[16rem] flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="termo de busca"
          />
          <button
            type="button"
            onClick={buscarUnsplash}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            Buscar
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotos.map((f) => (
            <button
              key={f.id}
              type="button"
              className="overflow-hidden rounded-lg border border-slate-200 text-left"
              onClick={() => escolherUnsplash(f)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url_thumb} alt={f.descricao} className="aspect-video w-full object-cover" />
              <span className="block px-2 py-1 text-[10px] text-slate-500">
                Photo by {f.fotografo}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 mb-16">
        <h2 className="text-lg font-medium">Upload próprio</h2>
        <p className="mt-1 text-xs text-slate-500">
          JPG/PNG/WebP · máx. 8 MB · precisa atender a resolução mínima do slot{" "}
          <strong>{categoria}</strong>.
        </p>
        <input
          className="mt-3 block text-sm"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void enviarUpload(f);
          }}
        />
      </section>
    </main>
  );
}

export default function PainelMidiaPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-slate-500">Carregando…</main>}>
      <PainelMidiaInner />
    </Suspense>
  );
}
