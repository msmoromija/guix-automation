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
    <section id="galeria" data-section="galeria" className="mx-auto max-w-6xl px-5 py-20">
      <h2 data-field="galeria.titulo" className="text-4xl sm:text-5xl">{galeria.titulo}</h2>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        {galeria.itens.map((g, i) => (
          <figure key={g.id} data-component="card_galeria" data-item-id={g.id}>
            <button type="button" onClick={() => setAtual(g)} className="rounded-site block w-full overflow-hidden">
              <img src={g.imagem.src} alt={g.imagem.alt} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" />
            </button>
            <figcaption data-field={`galeria.itens.${i}.legenda`} className="mt-2 text-sm text-text-muted">{g.legenda}</figcaption>
          </figure>
        ))}
      </div>
      <dialog ref={ref} onClose={() => setAtual(null)} className="rounded-site m-auto max-w-3xl bg-surface p-0 backdrop:bg-primary/70">
        {atual && (
          <figure className="relative">
            <img src={atual.imagem.src} alt={atual.imagem.alt} className="max-h-[75vh] w-full object-contain" />
            <figcaption className="p-4 text-text">{atual.legenda}</figcaption>
            <button type="button" aria-label="Fechar" onClick={() => setAtual(null)} className="absolute right-3 top-3 rounded-full bg-surface p-2 text-primary">
              <X className="h-5 w-5" />
            </button>
          </figure>
        )}
      </dialog>
    </section>
  );
}
