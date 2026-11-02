import { site } from "@/content";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 data-field="eventos.titulo" className="text-4xl sm:text-5xl">{eventos.titulo}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {eventos.itens.map((e, i) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id} className="rounded-site line overflow-hidden bg-background">
              <img src={e.imagem.src} alt={e.imagem.alt} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="p-6">
                <p className="text-sm font-semibold text-secondary">
                  <span data-field={`eventos.itens.${i}.data_label`}>{e.data_label}</span> · <span data-field={`eventos.itens.${i}.horario`}>{e.horario}</span>
                </p>
                <h3 data-field={`eventos.itens.${i}.titulo`} className="mt-2 text-2xl">{e.titulo}</h3>
                <p data-field={`eventos.itens.${i}.descricao`} className="mt-3 text-sm text-text-muted">{e.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
