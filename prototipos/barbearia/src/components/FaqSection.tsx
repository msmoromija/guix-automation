import { site } from "@/content/site";
import { SectionTitle } from "./SectionTitle";

export function FaqSection() {
  const { faq } = site;
  return (
    <section id="faq" data-section="faq" className="border-y bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <SectionTitle field="faq.titulo" title={faq.titulo} />
        <div className="divide-y border-y">
          {faq.itens.map((f, i) => (
            <details key={f.id} data-component="item_faq" data-item-id={f.id} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold">
                <span data-field={`faq.itens.${i}.pergunta`}>{f.pergunta}</span>
                <span className="text-xl text-accent transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p data-field={`faq.itens.${i}.resposta`} className="pb-4 text-text-muted">{f.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
