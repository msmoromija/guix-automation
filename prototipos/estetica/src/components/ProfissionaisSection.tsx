import { Link } from "@tanstack/react-router";
import { site } from "@/content";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  return (
    <section id="profissionais" data-section="profissionais" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <h2 data-field="profissionais.titulo" className="text-3xl text-brand sm:text-5xl">{profissionais.titulo}</h2>
      <p data-field="profissionais.subtitulo" className="mt-4 max-w-xl text-ink-muted">{profissionais.subtitulo}</p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {profissionais.itens.map((p) => (
          <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="flex flex-col">
            <img src={p.foto.src} alt={p.foto.alt} className="aspect-[4/5] w-full rounded-ui object-cover" loading="lazy" />
            <p data-field={`profissionais.itens.${p.id}.cargo`} className="eyebrow mt-5">{p.cargo}</p>
            <h3 data-field={`profissionais.itens.${p.id}.nome`} className="mt-1 text-2xl text-brand">{p.nome}</h3>
            <p data-field={`profissionais.itens.${p.id}.descricao`} className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{p.descricao}</p>
            <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-secondary mt-5">
              {header.botao_agendar}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
