"use client";

import { useRef } from "react";

export function KitImpressao({
  nome,
  logoUrl,
}: {
  nome: string;
  agendarUrl: string;
  logoUrl?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 1080;
    const H = 720;
    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle = "#0B1220";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "600 42px system-ui, sans-serif";
    ctx.fillText(nome.slice(0, 36) || "Seu negócio", 64, 90);

    if (logoUrl) {
      try {
        const logo = await carregarImg(logoUrl);
        const max = 280;
        const ratio = Math.min(max / logo.width, max / logo.height);
        const lw = logo.width * ratio;
        const lh = logo.height * ratio;
        ctx.drawImage(logo, (W - lw) / 2, 160, lw, lh);
      } catch {
        /* sem logo */
      }
    } else {
      ctx.fillStyle = "#94A3B8";
      ctx.font = "500 28px system-ui, sans-serif";
      ctx.fillText("Logo", W / 2 - 40, 300);
    }

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${slug(nome)}-logo.png`;
    a.click();
  }

  return (
    <article className="rounded-2xl border border-line bg-white p-5 sm:col-span-2">
      <h2 className="font-semibold">Material impresso</h2>
      <p className="mt-2 text-sm text-muted">
        Baixe a arte da logo para usar em cartão de visita e banner.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void baixar()} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
          Baixar PNG da logo
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </article>
  );
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "negocio";
}

function carregarImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = src;
  });
}
