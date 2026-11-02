import { site } from "@/content";

export function FaqSection() {
  const { faq } = site;
  return (
    <section id="faq" data-section="faq" className="border-y border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="faq.titulo" className="text-3xl font-semibold md:text-4xl">{faq.titulo}</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faq.itens.map((f) => (
            <details key={f.id} data-component="item_faq" data-item-id={f.id} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-primary">
                <span data-field="faq.itens.pergunta">{f.pergunta}</span>
                <span className="text-xl text-secondary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p data-field="faq.itens.resposta" className="mt-3 text-muted-foreground">{f.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
