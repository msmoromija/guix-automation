import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { SEM_PREFERENCIA_ID } from "@/lib/lead";
import { SectionHead } from "./SectionHead";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  const itens = profissionais.itens.filter((p) => p.id !== SEM_PREFERENCIA_ID);
  return (
    <section id="profissionais" data-section="profissionais" className="mx-auto max-w-6xl px-4 py-20">
      <SectionHead titulo={profissionais.titulo} field="profissionais.titulo" subtitulo={profissionais.subtitulo} subField="profissionais.subtitulo" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((p, i) => (
          <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="flex flex-col overflow-hidden rounded-theme border bg-surface">
            <img src={p.foto.src} alt={p.foto.alt} className="aspect-square w-full object-cover grayscale-[35%]" loading="lazy" />
            <div className="flex flex-1 flex-col p-5">
              <p data-field={`profissionais.itens.${i}.cargo`} className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">{p.cargo}</p>
              <h3 data-field={`profissionais.itens.${i}.nome`} className="mt-1 text-3xl font-bold">{p.nome}</h3>
              <p data-field={`profissionais.itens.${i}.descricao`} className="mt-2 flex-1 text-sm text-ink-muted">{p.descricao}</p>
              <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-secondary mt-5">
                {header.botao_agendar}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
