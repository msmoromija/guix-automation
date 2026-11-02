import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { SectionTitle } from "./SectionTitle";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="border-y bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionTitle field="servicos.titulo" title={servicos.titulo} subField="servicos.subtitulo" sub={servicos.subtitulo} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s, i) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="flex flex-col overflow-hidden rounded-brand border bg-background">
              <img src={s.imagem.src} alt={s.imagem.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 data-field={`servicos.itens.${i}.nome`} className="text-xl font-semibold">{s.nome}</h3>
                  <span data-field={`servicos.itens.${i}.preco_label`} className="font-heading text-xl text-accent">{s.preco_label}</span>
                </div>
                <p data-field={`servicos.itens.${i}.duracao_label`} className="mt-1 text-xs uppercase tracking-wider text-secondary">{s.duracao_label}</p>
                <p data-field={`servicos.itens.${i}.descricao`} className="mt-3 flex-1 text-sm text-text-muted">{s.descricao}</p>
                <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-secondary mt-5">{header.botao_agendar}</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
