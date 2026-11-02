import { Link } from "@tanstack/react-router";
import { site } from "@/content";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 data-field="servicos.titulo" className="text-4xl sm:text-5xl">{servicos.titulo}</h2>
        <p data-field="servicos.subtitulo" className="mt-3 max-w-xl text-text-muted">{servicos.subtitulo}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s, i) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="rounded-site line flex flex-col overflow-hidden bg-background">
              <img src={s.imagem.src} alt={s.imagem.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 data-field={`servicos.itens.${i}.nome`} className="text-2xl">{s.nome}</h3>
                  <span data-field={`servicos.itens.${i}.preco_label`} className="font-semibold text-secondary">{s.preco_label}</span>
                </div>
                <p data-field={`servicos.itens.${i}.duracao_label`} className="mt-1 text-xs uppercase tracking-wider text-text-muted">{s.duracao_label}</p>
                <p data-field={`servicos.itens.${i}.descricao`} className="mt-3 flex-1 text-sm text-text-muted">{s.descricao}</p>
                <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-primary mt-5">{header.botao_agendar}</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
