import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";
import type { GaleriaItem } from "@/content/site.types";
import { SectionHead } from "./SectionHead";

export function GaleriaSection() {
  const { galeria } = site;
  const [aberto, setAberto] = useState<GaleriaItem | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  if (galeria.itens.length === 0) return null;
  return (
    <section id="galeria" data-section="galeria" className="mx-auto max-w-6xl px-4 py-20">
      <SectionHead titulo={galeria.titulo} field="galeria.titulo" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {galeria.itens.map((g, i) => (
          <button key={g.id} type="button" data-component="card_galeria" data-item-id={g.id} onClick={() => setAberto(g)} className="group relative overflow-hidden rounded-theme text-left">
            <img src={g.imagem.src} alt={g.imagem.alt} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            <span data-field={`galeria.itens.${i}.legenda`} className="absolute inset-x-0 bottom-0 bg-page/80 px-3 py-2 text-sm font-semibold">
              {g.legenda}
            </span>
          </button>
        ))}
      </div>
      <dialog
        ref={ref}
        onClose={() => setAberto(null)}
        onClick={(e) => e.target === ref.current && setAberto(null)}
        className="m-auto max-w-3xl rounded-theme border bg-surface p-0 text-ink backdrop:bg-page/85"
      >
        {aberto && (
          <figure>
            <img src={aberto.imagem.src} alt={aberto.imagem.alt} className="max-h-[75vh] w-full object-contain" />
            <figcaption className="flex items-center justify-between gap-4 p-4">
              <span>{aberto.legenda}</span>
              <button type="button" onClick={() => setAberto(null)} aria-label={aberto.legenda} className="inline-flex h-10 w-10 items-center justify-center rounded-theme border">
                <X size={18} />
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </section>
  );
}
