import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="bg-surface">
      <div className="section">
        <span className="eyebrow-line" />
        <h2 data-field="servicos.titulo" className="text-3xl font-bold text-brand md:text-4xl">{servicos.titulo}</h2>
        <p data-field="servicos.subtitulo" className="mt-3 max-w-xl text-ink-muted">{servicos.subtitulo}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s, i) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="card flex flex-col bg-page">
              <img src={s.imagem.src} alt={s.imagem.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <h3 data-field={`servicos.itens.${i}.nome`} className="text-xl font-bold text-brand">{s.nome}</h3>
                <p data-field={`servicos.itens.${i}.descricao`} className="mt-2 flex-1 text-sm text-ink-muted">{s.descricao}</p>
                <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                  <span data-field={`servicos.itens.${i}.preco_label`} className="font-display text-2xl font-bold text-terra">{s.preco_label}</span>
                  <span data-field={`servicos.itens.${i}.duracao_label`} className="text-sm font-semibold text-ink-muted">{s.duracao_label}</span>
                </div>
                <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-primary mt-4 w-full">
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
