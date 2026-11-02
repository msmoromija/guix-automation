"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type Dados = {
  id: string;
  nicho: string;
  nome: string;
  status?: string;
  aprovadoEm?: string;
  prazoIntegracao?: string;
  contratarUrl: string;
  logoUrl?: string;
  resumo: { empresa?: string; heroTitulo?: string; slogan?: string };
};

function ExtratoInner() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || params.id || "";
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setOrigem(window.location.origin);
  }, []);

  useEffect(() => {
    if (!params.id || !token) {
      setErro("Acesso sem token.");
      return;
    }
    void fetch(`/api/prototipo/${params.id}?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.erro || "Falha");
        setDados(j);
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Falha"));
  }, [params.id, token]);

  const contaUrl = useMemo(
    () => (origem && dados ? `${origem}/conta/${dados.id}?t=${encodeURIComponent(token)}` : ""),
    [origem, dados, token],
  );
  const qrSrc = useMemo(
    () =>
      contaUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=12&data=${encodeURIComponent(contaUrl)}`
        : "",
    [contaUrl],
  );

  async function baixarPng() {
    if (!dados || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 1080;
    const H = 1480;
    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle = "#0B1220";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "700 48px system-ui, sans-serif";
    ctx.fillText("GuiX · Extrato do protótipo", 64, 90);
    ctx.font = "600 40px system-ui, sans-serif";
    ctx.fillText((dados.resumo.empresa || dados.nome).slice(0, 34), 64, 170);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.fillText(`Nicho: ${dados.nicho}`, 64, 230);
    ctx.fillText(`Token: ${dados.id}`, 64, 275);
    if (dados.aprovadoEm) ctx.fillText(`Aprovado: ${new Date(dados.aprovadoEm).toLocaleString("pt-BR")}`, 64, 320);
    if (dados.prazoIntegracao) {
      ctx.fillText(`Prazo integração GuiX: ${new Date(dados.prazoIntegracao).toLocaleString("pt-BR")}`, 64, 365);
    }
    if (dados.resumo.slogan) {
      ctx.fillStyle = "#CBD5E1";
      ctx.fillText(String(dados.resumo.slogan).slice(0, 48), 64, 420);
    }
    if (dados.logoUrl) {
      try {
        const img = await carregar(dados.logoUrl);
        const max = 220;
        const ratio = Math.min(max / img.width, max / img.height);
        ctx.drawImage(img, 64, 460, img.width * ratio, img.height * ratio);
      } catch {
        /* */
      }
    }
    if (qrSrc) {
      const qr = await carregar(qrSrc);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(64, 760, 420, 420);
      ctx.drawImage(qr, 88, 784, 372, 372);
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "500 24px system-ui, sans-serif";
      ctx.fillText("Área do cliente", 64, 1220);
    }
    ctx.fillStyle = "#64748B";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.fillText("guix.net.br", 64, 1400);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `guix-extrato-${dados.id}.png`;
    a.click();
  }

  function imprimirPdf() {
    window.print();
  }

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Extrato</h1>
        <p className="mt-3 text-muted">{erro}</p>
      </main>
    );
  }
  if (!dados) return <main className="px-5 py-16 text-sm text-muted">Montando extrato…</main>;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 print:max-w-none print:px-0 print:py-0">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">EXTRATO</p>
          <h1 className="mt-2 text-3xl font-bold">Protótipo aprovado</h1>
        </div>
        <Link href={`/conta/${dados.id}?t=${encodeURIComponent(token)}`} className="text-sm text-muted underline">
          Voltar
        </Link>
      </div>

      <article className="gx-extrato mt-8 rounded-2xl border border-line bg-white p-6 print:border-0 print:p-0">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">GUIX</p>
        <h2 className="mt-2 text-2xl font-bold">{dados.resumo.empresa || dados.nome}</h2>
        {dados.resumo.slogan ? <p className="mt-1 text-muted">{dados.resumo.slogan}</p> : null}
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted">Token</dt>
            <dd className="font-mono text-lg font-semibold">{dados.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted">Nicho</dt>
            <dd className="font-medium">{dados.nicho}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted">Status</dt>
            <dd className="font-medium">{dados.status || "rascunho"}</dd>
          </div>
          {dados.aprovadoEm ? (
            <div>
              <dt className="text-xs uppercase text-muted">Aprovado em</dt>
              <dd className="font-medium">{new Date(dados.aprovadoEm).toLocaleString("pt-BR")}</dd>
            </div>
          ) : null}
          {dados.prazoIntegracao ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-muted">Prazo GuiX para integração</dt>
              <dd className="font-medium">{new Date(dados.prazoIntegracao).toLocaleString("pt-BR")}</dd>
            </div>
          ) : null}
        </dl>
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrSrc} alt="QR da área do cliente" className="mt-6 h-40 w-40 rounded-xl border border-line p-2" />
        ) : null}
      </article>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={() => void baixarPng()} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
          Baixar imagem PNG
        </button>
        <button type="button" onClick={imprimirPdf} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
          Imprimir / salvar PDF
        </button>
        <Link href={dados.contratarUrl} className="rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
          Comprar · PIX ou cartão
        </Link>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}

function carregar(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function ExtratoPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Abrindo…</main>}>
      <ExtratoInner />
    </Suspense>
  );
}
