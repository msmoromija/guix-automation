import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="border-y border-site-line bg-site-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHead field="servicos" titulo={servicos.titulo} subtitulo={servicos.subtitulo} />
        <div className="grid gap-px bg-site-line sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s, i) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="flex flex-col bg-site-surface p-5">
              <img src={s.imagem.src} alt={s.imagem.alt} className="aspect-[3/2] w-full rounded-site object-cover" loading="lazy" />
              <h3 data-field={`servicos.itens.${i}.nome`} className="mt-5 text-2xl text-site-primary">{s.nome}</h3>
              <p data-field={`servicos.itens.${i}.descricao`} className="mt-2 flex-1 text-sm leading-relaxed text-site-muted">{s.descricao}</p>
              <div className="mt-5 flex items-baseline justify-between border-t border-site-line pt-4">
                <span data-field={`servicos.itens.${i}.preco_label`} className="font-heading text-2xl text-site-text">{s.preco_label}</span>
                <span data-field={`servicos.itens.${i}.duracao_label`} className="text-sm text-site-muted">{s.duracao_label}</span>
              </div>
              <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-primary mt-5 w-full">
                {header.botao_agendar}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
