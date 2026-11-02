import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";
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
    <section id="galeria" data-section="galeria" className="section">
      <span className="eyebrow-line" />
      <h2 data-field="galeria.titulo" className="text-3xl font-bold text-brand md:text-4xl">{galeria.titulo}</h2>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        {galeria.itens.map((g, i) => (
          <button key={g.id} type="button" data-component="card_galeria" data-item-id={g.id} onClick={() => setAtual(g)} className="group text-left">
            <img src={g.imagem.src} alt={g.imagem.alt} loading="lazy" className="aspect-square w-full rounded-site object-cover transition group-hover:opacity-90" />
            <span data-field={`galeria.itens.${i}.legenda`} className="mt-2 block text-sm font-semibold text-ink-muted">{g.legenda}</span>
          </button>
        ))}
      </div>
      <dialog ref={ref} onClose={() => setAtual(null)} className="m-auto w-[min(92vw,900px)] rounded-site bg-surface p-0">
        {atual && (
          <figure>
            <img src={atual.imagem.src} alt={atual.imagem.alt} className="max-h-[75vh] w-full object-contain" />
            <figcaption className="flex items-center justify-between gap-3 p-4 font-semibold text-brand">
              {atual.legenda}
              <button type="button" aria-label="Fechar" onClick={() => setAtual(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-site border">
                <X className="h-5 w-5" />
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </section>
  );
}
