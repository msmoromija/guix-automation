"use client";

import { useMemo, useRef, useState } from "react";

export function KitImpressao({
  nome,
  agendarUrl,
  logoUrl,
}: {
  nome: string;
  agendarUrl: string;
  logoUrl?: string;
}) {
  const [comQr, setComQr] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrSrc = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=12&data=${encodeURIComponent(agendarUrl)}`,
    [agendarUrl],
  );

  async function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 1080;
    const H = comQr ? 1280 : 720;
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

    if (comQr) {
      const qr = await carregarImg(qrSrc);
      const size = 420;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect((W - size) / 2 - 24, 560, size + 48, size + 48);
      ctx.drawImage(qr, (W - size) / 2, 584, size, size);
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "500 26px system-ui, sans-serif";
      ctx.fillText("Escaneie para agendar", W / 2 - 140, 1060);
    }

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = comQr ? `${slug(nome)}-logo-qrcode.png` : `${slug(nome)}-logo.png`;
    a.click();
  }

  return (
    <article className="rounded-2xl border border-line bg-white p-5 sm:col-span-2">
      <h2 className="font-semibold">QR Code e material impresso</h2>
      <p className="mt-2 text-sm text-muted">
        Imprima o QR para a página de agendamento. Baixe a arte com ou sem QR para cartão de visita e banner.
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="QR Code do agendamento" className="h-40 w-40 rounded-xl border border-line bg-white p-2" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="break-all text-xs text-muted">{agendarUrl}</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={comQr} onChange={(e) => setComQr(e.target.checked)} />
            Incluir QR Code no download
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void baixar()} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
              Baixar PNG {comQr ? "com QR" : "só logo"}
            </button>
            <a href={qrSrc} download={`${slug(nome)}-qrcode.png`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold" target="_blank" rel="noreferrer">
              Baixar só o QR
            </a>
          </div>
        </div>
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
