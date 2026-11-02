import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { SectionTitle } from "./SectionTitle";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  return (
    <section id="profissionais" data-section="profissionais" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <SectionTitle field="profissionais.titulo" title={profissionais.titulo} subField="profissionais.subtitulo" sub={profissionais.subtitulo} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profissionais.itens.map((p, i) => (
          <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="flex flex-col rounded-brand border bg-surface">
            <img src={p.foto.src} alt={p.foto.alt} loading="lazy" className="aspect-square w-full rounded-t-brand object-cover grayscale" />
            <div className="flex flex-1 flex-col p-5">
              <h3 data-field={`profissionais.itens.${i}.nome`} className="text-xl font-semibold">{p.nome}</h3>
              <p data-field={`profissionais.itens.${i}.cargo`} className="text-xs uppercase tracking-wider text-secondary">{p.cargo}</p>
              <p data-field={`profissionais.itens.${i}.descricao`} className="mt-3 flex-1 text-sm text-text-muted">{p.descricao}</p>
              <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-secondary mt-5">{header.botao_agendar}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
