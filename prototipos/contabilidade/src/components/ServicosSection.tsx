import { Link } from "@tanstack/react-router";
import { site } from "@/content";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="border-y border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="servicos.titulo" className="text-3xl font-semibold md:text-4xl">{servicos.titulo}</h2>
        <p data-field="servicos.subtitulo" className="mt-3 max-w-2xl text-muted-foreground">{servicos.subtitulo}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-background">
              <img src={s.imagem.src} alt={s.imagem.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <h3 data-field="servicos.itens.nome" className="text-xl font-semibold">{s.nome}</h3>
                <p data-field="servicos.itens.descricao" className="mt-2 flex-1 text-sm text-muted-foreground">{s.descricao}</p>
                <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                  <span data-field="servicos.itens.preco_label" className="text-lg font-semibold text-primary">{s.preco_label}</span>
                  <span data-field="servicos.itens.duracao_label" className="text-sm text-muted-foreground">{s.duracao_label}</span>
                </div>
                <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-primary mt-4">
                  {header.botao_agendar}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
