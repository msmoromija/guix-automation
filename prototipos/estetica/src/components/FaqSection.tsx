import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { site } from "@/content";

export function FaqSection() {
  const { faq } = site;
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setAbertos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <section id="faq" data-section="faq" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <h2 data-field="faq.titulo" className="text-3xl text-brand sm:text-5xl">{faq.titulo}</h2>
        <div className="mt-10 border-t">
          {faq.itens.map((f) => {
            const open = abertos.has(f.id);
            return (
              <div key={f.id} data-component="item_faq" data-item-id={f.id} className="border-b">
                <button type="button" aria-expanded={open} aria-controls={`faq-${f.id}`} onClick={() => toggle(f.id)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span data-field={`faq.itens.${f.id}.pergunta`} className="font-medium text-brand">{f.pergunta}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-sage transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <p id={`faq-${f.id}`} data-field={`faq.itens.${f.id}.resposta`} className="pb-5 leading-relaxed text-ink-muted">{f.resposta}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
