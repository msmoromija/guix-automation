import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content";
import type { ItemGaleria } from "@/content/site.types";

export function GaleriaSection() {
  const { galeria } = site;
  const [atual, setAtual] = useState<ItemGaleria | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (atual && !d.open) d.showModal();
    if (!atual && d.open) d.close();
  }, [atual]);

  if (galeria.itens.length === 0) return null;
  return (
    <section id="galeria" data-section="galeria" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <h2 data-field="galeria.titulo" className="text-3xl text-brand sm:text-5xl">{galeria.titulo}</h2>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {galeria.itens.map((g) => (
          <button key={g.id} type="button" data-component="card_galeria" data-item-id={g.id} onClick={() => setAtual(g)} className="group text-left">
            <img src={g.imagem.src} alt={g.imagem.alt} className="aspect-square w-full rounded-ui object-cover transition-opacity group-hover:opacity-90" loading="lazy" />
            <span data-field={`galeria.itens.${g.id}.legenda`} className="mt-2 block text-sm text-ink-muted">{g.legenda}</span>
          </button>
        ))}
      </div>
      <dialog
        ref={ref}
        onClose={() => setAtual(null)}
        onClick={(e) => e.target === ref.current && setAtual(null)}
        className="m-auto w-[min(92vw,900px)] rounded-ui bg-paper p-0 text-ink"
      >
        {atual && (
          <figure>
            <img src={atual.imagem.src} alt={atual.imagem.alt} className="max-h-[75vh] w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-4 p-4">
              <span>{atual.legenda}</span>
              <button type="button" onClick={() => setAtual(null)} aria-label={galeria.titulo} className="inline-flex h-10 w-10 items-center justify-center rounded-ui border text-brand">
                <X className="h-5 w-5" />
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </section>
  );
}
