import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";
import type { GaleriaItem } from "@/content/site.types";
import { SectionHead } from "./SectionHead";

export function GaleriaSection() {
  const { galeria } = site;
  const [sel, setSel] = useState<GaleriaItem | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (sel && !d.open) d.showModal();
    if (!sel && d.open) d.close();
  }, [sel]);

  if (galeria.itens.length === 0) return null;
  return (
    <section id="galeria" data-section="galeria" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionHead field="galeria" titulo={galeria.titulo} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {galeria.itens.map((g, i) => (
          <figure key={g.id} data-component="card_galeria" data-item-id={g.id}>
            <button type="button" onClick={() => setSel(g)} className="block w-full overflow-hidden">
              <img src={g.imagem.src} alt={g.imagem.alt} className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
            </button>
            <figcaption data-field={`galeria.itens.${i}.legenda`} className="mt-2 text-xs uppercase tracking-widest text-site-muted">{g.legenda}</figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={ref}
        onClose={() => setSel(null)}
        onClick={(e) => e.target === ref.current && setSel(null)}
        className="m-auto max-h-[90svh] w-[min(92vw,960px)] bg-site-surface p-0 backdrop:bg-site-overlay"
      >
        {sel && (
          <figure>
            <img src={sel.imagem.src} alt={sel.imagem.alt} className="max-h-[75svh] w-full object-contain" />
            <figcaption className="flex items-center justify-between gap-4 p-4">
              <span className="font-heading text-lg text-site-primary">{sel.legenda}</span>
              <button type="button" onClick={() => setSel(null)} aria-label="Fechar" className="inline-flex h-10 w-10 items-center justify-center border border-site-line text-site-primary">
                <X className="h-5 w-5" />
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </section>
  );
}
