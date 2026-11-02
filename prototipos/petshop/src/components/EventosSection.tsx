import { site } from "@/content/site";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="bg-surface">
      <div className="section">
        <span className="eyebrow-line" />
        <h2 data-field="eventos.titulo" className="text-3xl font-bold text-brand md:text-4xl">{eventos.titulo}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {eventos.itens.map((e, i) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id} className="card bg-page">
              <img src={e.imagem.src} alt={e.imagem.alt} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="p-5">
                <p className="text-sm font-bold text-terra">
                  <span data-field={`eventos.itens.${i}.data_label`}>{e.data_label}</span> · <span data-field={`eventos.itens.${i}.horario`}>{e.horario}</span>
                </p>
                <h3 data-field={`eventos.itens.${i}.titulo`} className="mt-2 text-xl font-bold text-brand">{e.titulo}</h3>
                <p data-field={`eventos.itens.${i}.descricao`} className="mt-2 text-sm text-ink-muted">{e.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
