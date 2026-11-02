import { site } from "@/content/site";
import { SectionTitle } from "./SectionTitle";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="border-y bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionTitle field="eventos.titulo" title={eventos.titulo} />
        <div className="grid gap-4 md:grid-cols-2">
          {eventos.itens.map((e, i) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id} className="overflow-hidden rounded-brand border bg-background">
              <img src={e.imagem.src} alt={e.imagem.alt} loading="lazy" className="aspect-[16/8] w-full object-cover" />
              <div className="p-5">
                <p className="text-xs uppercase tracking-wider text-secondary">
                  <span data-field={`eventos.itens.${i}.data_label`}>{e.data_label}</span> · <span data-field={`eventos.itens.${i}.horario`}>{e.horario}</span>
                </p>
                <h3 data-field={`eventos.itens.${i}.titulo`} className="mt-2 text-2xl font-semibold">{e.titulo}</h3>
                <p data-field={`eventos.itens.${i}.descricao`} className="mt-2 text-sm text-text-muted">{e.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
