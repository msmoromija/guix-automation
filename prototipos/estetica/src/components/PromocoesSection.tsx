import { site } from "@/content";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <h2 data-field="promocoes.titulo" className="text-3xl text-brand sm:text-5xl">{promocoes.titulo}</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {promocoes.itens.map((p) => (
          <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="overflow-hidden rounded-ui border bg-paper">
            <img src={p.imagem.src} alt={p.imagem.alt} className="aspect-[16/9] w-full object-cover" loading="lazy" />
            <div className="p-6">
              <span data-field={`promocoes.itens.${p.id}.validade_label`} className="inline-block rounded-ui bg-sand px-3 py-1 text-xs font-semibold text-brand">
                {p.validade_label}
              </span>
              <h3 data-field={`promocoes.itens.${p.id}.titulo`} className="mt-4 text-2xl text-brand">{p.titulo}</h3>
              <p data-field={`promocoes.itens.${p.id}.descricao`} className="mt-2 text-sm leading-relaxed text-ink-muted">{p.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
