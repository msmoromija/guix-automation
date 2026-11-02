import { useRef, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";
import type { GaleriaItem } from "@/content/site.types";
import { SectionTitle } from "./SectionTitle";

export function GaleriaSection() {
  const { galeria } = site;
  const ref = useRef<HTMLDialogElement>(null);
  const [atual, setAtual] = useState<GaleriaItem | null>(null);
  if (galeria.itens.length === 0) return null;

  const abrir = (g: GaleriaItem) => {
    setAtual(g);
    ref.current?.showModal();
  };

  return (
    <section id="galeria" data-section="galeria" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <SectionTitle field="galeria.titulo" title={galeria.titulo} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {galeria.itens.map((g, i) => (
          <figure key={g.id} data-component="card_galeria" data-item-id={g.id}>
            <button type="button" onClick={() => abrir(g)} className="block w-full overflow-hidden rounded-brand border" aria-label={g.legenda}>
              <img src={g.imagem.src} alt={g.imagem.alt} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105" />
            </button>
            <figcaption data-field={`galeria.itens.${i}.legenda`} className="mt-2 text-xs uppercase tracking-wider text-text-muted">{g.legenda}</figcaption>
          </figure>
        ))}
      </div>
      <dialog ref={ref} onClose={() => setAtual(null)} className="m-auto max-h-[90svh] w-[min(92vw,56rem)] rounded-brand border bg-surface p-0 text-text">
        {atual && (
          <figure>
            <img src={atual.imagem.src} alt={atual.imagem.alt} className="max-h-[75svh] w-full object-contain" />
            <figcaption className="flex items-center justify-between gap-4 p-4">
              <span>{atual.legenda}</span>
              <button type="button" onClick={() => ref.current?.close()} className="inline-flex h-10 w-10 items-center justify-center rounded-brand border" aria-label={atual.legenda}>
                <X className="h-5 w-5" />
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </section>
  );
}
