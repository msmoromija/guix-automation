"use client";

import { useEffect, useRef, useState } from "react";
import type { SlotFoto } from "@/components/preview/SiteLivePreview";

export type { SlotFoto };

async function arquivoParaDataUrl(file: File, max = 1200) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function SeletorFoto({
  aberto,
  nicho,
  slot,
  onEscolher,
  onFechar,
}: {
  aberto: boolean;
  nicho: string;
  slot: SlotFoto | null;
  onEscolher: (src: string, credito?: Record<string, unknown>) => void;
  onFechar: () => void;
}) {
  const [fotos, setFotos] = useState<{ src: string; thumb: string; credito?: Record<string, unknown> }[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);
  const q = slot?.tipo === "hero" ? "hero" : slot?.tipo === "sobre" ? "sobre" : slot?.tipo === "galeria" ? "galeria" : "servico";

  useEffect(() => {
    if (!aberto || !slot) return;
    corpoRef.current?.scrollTo({ top: 0 });
    let cancelado = false;
    setErro("");
    setCarregando(true);
    setFotos([]);
    void fetch(`/api/prototipo/fotos?nicho=${encodeURIComponent(nicho)}&q=${encodeURIComponent(q)}`)
      .then(async (r) => {
        const d = await r.json();
        if (cancelado) return;
        if (!r.ok) {
          setErro(d.erro || "Não deu para buscar fotos agora.");
          setFotos([]);
          return;
        }
        setFotos(Array.isArray(d.fotos) ? d.fotos : []);
        if (!Array.isArray(d.fotos) || !d.fotos.length) {
          setErro("Nenhuma foto na biblioteca deste ofício agora. Envie a sua.");
        }
      })
      .catch(() => {
        if (!cancelado) {
          setFotos([]);
          setErro("Falha de conexão ao buscar fotos.");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, nicho, q, slot?.tipo, slot?.indice]);

  if (!aberto || !slot) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink/40 p-3 sm:items-center" onClick={onFechar}>
      <div
        ref={corpoRef}
        className="my-3 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Trocar foto</h3>
            <p className="mt-1 text-sm text-muted">Envie a sua ou escolha uma da biblioteca deste ofício.</p>
          </div>
          <button type="button" className="min-h-10 rounded-full border border-line px-4 py-2 text-sm" onClick={onFechar}>
            Fechar
          </button>
        </div>
        <label className="mt-4 flex min-h-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line px-4 py-6 text-sm font-medium hover:border-ink/40">
          Enviar minha foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              void arquivoParaDataUrl(f)
                .then((src) => {
                  onEscolher(src);
                  onFechar();
                })
                .catch(() => setErro("Não deu para ler o arquivo."));
            }}
          />
        </label>
        {erro ? <p className="mt-2 text-sm text-accent">{erro}</p> : null}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {carregando ? (
            <p className="col-span-3 text-sm text-muted">Buscando fotos do ofício…</p>
          ) : fotos.length ? (
            fotos.map((f) => (
              <button
                key={f.src}
                type="button"
                className="overflow-hidden rounded-lg border border-line"
                onClick={() => {
                  onEscolher(f.src, f.credito);
                  onFechar();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.thumb || f.src} alt="" className="aspect-[4/3] w-full object-cover" />
              </button>
            ))
          ) : !erro ? (
            <p className="col-span-3 text-sm text-muted">Nenhuma foto disponível. Use o envio acima.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
