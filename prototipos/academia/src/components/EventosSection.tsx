import { CalendarDays, Clock } from "lucide-react";
import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="border-t bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHead titulo={eventos.titulo} field="eventos.titulo" />
        <div className="grid gap-5 md:grid-cols-2">
          {eventos.itens.map((e, i) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id} className="overflow-hidden rounded-theme border bg-page">
              <img src={e.imagem.src} alt={e.imagem.alt} className="aspect-[16/9] w-full object-cover" loading="lazy" />
              <div className="p-5">
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-lime">
                  <span data-field={`eventos.itens.${i}.data_label`} className="inline-flex items-center gap-1"><CalendarDays size={15} /> {e.data_label}</span>
                  <span data-field={`eventos.itens.${i}.horario`} className="inline-flex items-center gap-1"><Clock size={15} /> {e.horario}</span>
                </div>
                <h3 data-field={`eventos.itens.${i}.titulo`} className="mt-3 text-3xl font-bold">{e.titulo}</h3>
                <p data-field={`eventos.itens.${i}.descricao`} className="mt-2 text-sm text-ink-muted">{e.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
