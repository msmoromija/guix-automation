import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function FaqSection() {
  const { faq } = site;
  return (
    <section id="faq" data-section="faq" className="border-t bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <SectionHead titulo={faq.titulo} field="faq.titulo" />
        <div className="divide-y border-y">
          {faq.itens.map((f, i) => (
            <details key={f.id} data-component="item_faq" data-item-id={f.id} className="group py-4">
              <summary data-field={`faq.itens.${i}.pergunta`} className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.pergunta}
                <span className="font-heading text-2xl text-lime transition-transform group-open:rotate-45">+</span>
              </summary>
              <p data-field={`faq.itens.${i}.resposta`} className="mt-3 text-ink-muted">{f.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
