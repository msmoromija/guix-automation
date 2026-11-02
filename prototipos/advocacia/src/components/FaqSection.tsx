import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function FaqSection() {
  const { faq } = site;
  return (
    <section id="faq" data-section="faq" className="border-y border-site-line bg-site-surface">
      <div className="mx-auto max-w-3xl px-5 py-20 md:py-28">
        <SectionHead field="faq" titulo={faq.titulo} />
        <div className="border-t border-site-line">
          {faq.itens.map((f, i) => (
            <details key={f.id} data-component="item_faq" data-item-id={f.id} className="group border-b border-site-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <span data-field={`faq.itens.${i}.pergunta`} className="font-heading text-xl text-site-primary">{f.pergunta}</span>
                <span aria-hidden="true" className="text-2xl text-site-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p data-field={`faq.itens.${i}.resposta`} className="pb-6 leading-relaxed text-site-muted">{f.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
