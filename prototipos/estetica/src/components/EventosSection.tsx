import { site } from "@/content";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <h2 data-field="eventos.titulo" className="text-3xl text-brand sm:text-5xl">{eventos.titulo}</h2>
        <div className="mt-12 space-y-6">
          {eventos.itens.map((e) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id} className="grid overflow-hidden rounded-ui border bg-page sm:grid-cols-[2fr_3fr]">
              <img src={e.imagem.src} alt={e.imagem.alt} className="aspect-[16/10] h-full w-full object-cover" loading="lazy" />
              <div className="p-6 sm:p-8">
                <p className="eyebrow">
                  <span data-field={`eventos.itens.${e.id}.data_label`}>{e.data_label}</span>
                  {" · "}
                  <span data-field={`eventos.itens.${e.id}.horario`}>{e.horario}</span>
                </p>
                <h3 data-field={`eventos.itens.${e.id}.titulo`} className="mt-3 text-2xl text-brand">{e.titulo}</h3>
                <p data-field={`eventos.itens.${e.id}.descricao`} className="mt-2 text-sm leading-relaxed text-ink-muted">{e.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
