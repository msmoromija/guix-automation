import { Link } from "@tanstack/react-router";
import { site } from "@/content";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  return (
    <section id="profissionais" data-section="profissionais" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="profissionais.titulo" className="text-3xl font-semibold md:text-4xl">{profissionais.titulo}</h2>
        <p data-field="profissionais.subtitulo" className="mt-3 max-w-2xl text-muted-foreground">{profissionais.subtitulo}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profissionais.itens.filter((p) => p.id !== "qualquer").map((p) => (
            <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-5">
              <img src={p.foto.src} alt={p.foto.alt} loading="lazy" className="aspect-square w-full rounded-[var(--radius)] object-cover" />
              <h3 data-field="profissionais.itens.nome" className="mt-4 text-xl font-semibold">{p.nome}</h3>
              <p data-field="profissionais.itens.cargo" className="text-sm font-semibold uppercase tracking-wider text-secondary">{p.cargo}</p>
              <p data-field="profissionais.itens.descricao" className="mt-2 flex-1 text-sm text-muted-foreground">{p.descricao}</p>
              <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-primary mt-4">
                {header.botao_agendar}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
