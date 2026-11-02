import { site } from "@/content";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="promocoes.titulo" className="text-3xl font-semibold md:text-4xl">{promocoes.titulo}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {promocoes.itens.map((p) => (
            <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="grid overflow-hidden rounded-[var(--radius)] border border-border bg-card sm:grid-cols-[2fr_3fr]">
              <img src={p.imagem.src} alt={p.imagem.alt} loading="lazy" className="aspect-[16/10] h-full w-full object-cover sm:aspect-auto" />
              <div className="p-5">
                <h3 data-field="promocoes.itens.titulo" className="text-xl font-semibold">{p.titulo}</h3>
                <p data-field="promocoes.itens.descricao" className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
                <p data-field="promocoes.itens.validade_label" className="mt-4 text-sm font-semibold text-secondary">{p.validade_label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
