import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function ProfissionaisSection() {
  const { profissionais, header } = site;
  return (
    <section id="profissionais" data-section="profissionais" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionHead field="profissionais" titulo={profissionais.titulo} subtitulo={profissionais.subtitulo} />
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {profissionais.itens.map((p, i) => (
          <article key={p.id} data-component="card_profissional" data-item-id={p.id} className="flex flex-col">
            <img src={p.foto.src} alt={p.foto.alt} className="aspect-[4/5] w-full rounded-site object-cover grayscale-[30%]" loading="lazy" />
            <p data-field={`profissionais.itens.${i}.cargo`} className="eyebrow mt-5">{p.cargo}</p>
            <h3 data-field={`profissionais.itens.${i}.nome`} className="mt-1 text-2xl text-site-primary">{p.nome}</h3>
            <p data-field={`profissionais.itens.${i}.descricao`} className="mt-2 flex-1 text-sm leading-relaxed text-site-muted">{p.descricao}</p>
            <Link to="/agendar" search={{ profissional: p.id }} data-action="agendar" className="btn-secondary mt-5 w-full">
              {header.botao_agendar}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
