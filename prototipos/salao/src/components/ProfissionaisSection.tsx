import { Link } from "@tanstack/react-router";
import { site } from "@/content";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  return (
    <section id="profissionais" data-section="profissionais" className="mx-auto max-w-6xl px-5 py-20">
      <h2 data-field="profissionais.titulo" className="text-4xl sm:text-5xl">{profissionais.titulo}</h2>
      <p data-field="profissionais.subtitulo" className="mt-3 max-w-xl text-text-muted">{profissionais.subtitulo}</p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {profissionais.itens.map((p, i) => (
          <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="flex flex-col">
            <img src={p.foto.src} alt={p.foto.alt} loading="lazy" className="rounded-site aspect-[4/5] w-full object-cover" />
            <h3 data-field={`profissionais.itens.${i}.nome`} className="mt-4 text-2xl">{p.nome}</h3>
            <p data-field={`profissionais.itens.${i}.cargo`} className="text-xs uppercase tracking-wider text-secondary">{p.cargo}</p>
            <p data-field={`profissionais.itens.${i}.descricao`} className="mt-2 flex-1 text-sm text-text-muted">{p.descricao}</p>
            <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-secondary mt-4">{header.botao_agendar}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
