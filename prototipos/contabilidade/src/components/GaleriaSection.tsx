import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content";
import type { GaleriaItem } from "@/content/site.types";

export function GaleriaSection() {
  const { galeria } = site;
  const [atual, setAtual] = useState<GaleriaItem | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (atual && !d.open) d.showModal();
    if (!atual && d.open) d.close();
  }, [atual]);

  if (galeria.itens.length === 0) return null;
  return (
    <section id="galeria" data-section="galeria" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="galeria.titulo" className="text-3xl font-semibold md:text-4xl">{galeria.titulo}</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {galeria.itens.map((g) => (
            <button key={g.id} type="button" data-component="card_galeria" data-item-id={g.id} onClick={() => setAtual(g)} className="group text-left">
              <img src={g.imagem.src} alt={g.imagem.alt} loading="lazy" className="aspect-square w-full rounded-[var(--radius)] object-cover transition-opacity group-hover:opacity-90" />
              <span data-field="galeria.itens.legenda" className="mt-2 block text-sm text-muted-foreground">{g.legenda}</span>
            </button>
          ))}
        </div>
      </div>
      <dialog
        ref={ref}
        onClose={() => setAtual(null)}
        onClick={(e) => e.target === ref.current && setAtual(null)}
        className="m-auto max-w-3xl rounded-[var(--radius)] bg-card p-0 backdrop:bg-foreground/70"
      >
        {atual && (
          <figure className="relative">
            <button type="button" onClick={() => setAtual(null)} aria-label={atual.legenda} className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-card text-primary">
              <X className="h-5 w-5" />
            </button>
            <img src={atual.imagem.src} alt={atual.imagem.alt} className="max-h-[75vh] w-full object-contain" />
            <figcaption className="p-4 text-primary">{atual.legenda}</figcaption>
          </figure>
        )}
      </dialog>
    </section>
  );
}
