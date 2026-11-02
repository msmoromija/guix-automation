import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function EventosSection() {
  const { eventos } = site;
  if (eventos.itens.length === 0) return null;
  return (
    <section id="eventos" data-section="eventos" className="border-y border-site-line bg-site-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHead field="eventos" titulo={eventos.titulo} />
        <div className="grid gap-10 md:grid-cols-2">
          {eventos.itens.map((e, i) => (
            <article key={e.id} data-component="card_evento" data-item-id={e.id}>
              <img src={e.imagem.src} alt={e.imagem.alt} className="aspect-[16/9] w-full rounded-site object-cover" loading="lazy" />
              <p className="eyebrow mt-5">
                <span data-field={`eventos.itens.${i}.data_label`}>{e.data_label}</span>
                {" · "}
                <span data-field={`eventos.itens.${i}.horario`}>{e.horario}</span>
              </p>
              <h3 data-field={`eventos.itens.${i}.titulo`} className="mt-2 text-2xl text-site-primary">{e.titulo}</h3>
              <p data-field={`eventos.itens.${i}.descricao`} className="mt-2 text-sm leading-relaxed text-site-muted">{e.descricao}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
