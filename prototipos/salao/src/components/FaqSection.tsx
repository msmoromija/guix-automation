import { site } from "@/content";

export function FaqSection() {
  const { faq } = site;
  return (
    <section id="faq" data-section="faq" className="bg-surface py-20">
      <div className="mx-auto max-w-3xl px-5">
        <h2 data-field="faq.titulo" className="text-4xl sm:text-5xl">{faq.titulo}</h2>
        <div className="mt-8 divide-y divide-secondary/20 border-y border-secondary/20">
          {faq.itens.map((f, i) => (
            <details key={f.id} data-component="item_faq" data-item-id={f.id} className="group py-4">
              <summary data-field={`faq.itens.${i}.pergunta`} className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-primary">
                {f.pergunta}
                <span className="text-2xl text-secondary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p data-field={`faq.itens.${i}.resposta`} className="mt-3 text-text-muted">{f.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
