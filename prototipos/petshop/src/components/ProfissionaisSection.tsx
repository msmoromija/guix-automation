import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  return (
    <section id="profissionais" data-section="profissionais" className="section">
      <span className="eyebrow-line" />
      <h2 data-field="profissionais.titulo" className="text-3xl font-bold text-brand md:text-4xl">{profissionais.titulo}</h2>
      <p data-field="profissionais.subtitulo" className="mt-3 max-w-xl text-ink-muted">{profissionais.subtitulo}</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {profissionais.itens.map((p, i) => (
          <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="card flex flex-col">
            <img src={p.foto.src} alt={p.foto.alt} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <p data-field={`profissionais.itens.${i}.cargo`} className="text-xs font-bold uppercase tracking-wider text-terra">{p.cargo}</p>
              <h3 data-field={`profissionais.itens.${i}.nome`} className="mt-1 text-xl font-bold text-brand">{p.nome}</h3>
              <p data-field={`profissionais.itens.${i}.descricao`} className="mt-2 flex-1 text-sm text-ink-muted">{p.descricao}</p>
              <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-primary mt-5 w-full">
                {header.botao_agendar}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
