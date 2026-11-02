import { Link } from "@tanstack/react-router";
import { site } from "@/content";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <h2 data-field="servicos.titulo" className="text-3xl text-brand sm:text-5xl">{servicos.titulo}</h2>
        <p data-field="servicos.subtitulo" className="mt-4 max-w-xl text-ink-muted">{servicos.subtitulo}</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="flex flex-col overflow-hidden rounded-ui border bg-page">
              <img src={s.imagem.src} alt={s.imagem.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="flex flex-1 flex-col p-6">
                <h3 data-field={`servicos.itens.${s.id}.nome`} className="text-2xl text-brand">{s.nome}</h3>
                <p data-field={`servicos.itens.${s.id}.descricao`} className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{s.descricao}</p>
                <div className="mt-5 flex items-baseline justify-between border-t pt-4">
                  <span data-field={`servicos.itens.${s.id}.preco_label`} className="text-lg font-semibold text-brand">{s.preco_label}</span>
                  <span data-field={`servicos.itens.${s.id}.duracao_label`} className="text-sm text-ink-muted">{s.duracao_label}</span>
                </div>
                <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-primary mt-5 w-full">
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
