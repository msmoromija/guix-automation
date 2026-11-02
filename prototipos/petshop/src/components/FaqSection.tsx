import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { site } from "@/content/site";

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
    <section id="faq" data-section="faq" className="bg-surface">
      <div className="section max-w-3xl">
        <span className="eyebrow-line" />
        <h2 data-field="faq.titulo" className="text-3xl font-bold text-brand md:text-4xl">{faq.titulo}</h2>
        <div className="mt-8 divide-y border-y">
          {faq.itens.map((f, i) => {
            const open = abertos.has(f.id);
            return (
              <div key={f.id} data-component="item_faq" data-item-id={f.id}>
                <button type="button" aria-expanded={open} onClick={() => toggle(f.id)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-bold text-brand">
                  <span data-field={`faq.itens.${i}.pergunta`}>{f.pergunta}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-terra transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p data-field={`faq.itens.${i}.resposta`} className="pb-5 text-ink-muted">{f.resposta}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
