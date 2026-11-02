import { site } from "@/content";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="border-y border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="eventos.titulo" className="text-3xl font-semibold md:text-4xl">{eventos.titulo}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {eventos.itens.map((e) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id} className="overflow-hidden rounded-[var(--radius)] border border-border bg-background">
              <img src={e.imagem.src} alt={e.imagem.alt} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="p-5">
                <p className="text-sm font-semibold text-secondary">
                  <span data-field="eventos.itens.data_label">{e.data_label}</span> · <span data-field="eventos.itens.horario">{e.horario}</span>
                </p>
                <h3 data-field="eventos.itens.titulo" className="mt-1 text-xl font-semibold">{e.titulo}</h3>
                <p data-field="eventos.itens.descricao" className="mt-2 text-sm text-muted-foreground">{e.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
