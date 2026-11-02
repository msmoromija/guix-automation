import { site } from "@/content";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="mx-auto max-w-6xl px-5 py-20">
      <h2 data-field="promocoes.titulo" className="text-4xl sm:text-5xl">{promocoes.titulo}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {promocoes.itens.map((p, i) => (
          <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="rounded-site line grid overflow-hidden bg-surface sm:grid-cols-2">
            <img src={p.imagem.src} alt={p.imagem.alt} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
            <div className="p-6">
              <p data-field={`promocoes.itens.${i}.validade_label`} className="text-xs uppercase tracking-wider text-secondary">{p.validade_label}</p>
              <h3 data-field={`promocoes.itens.${i}.titulo`} className="mt-2 text-2xl">{p.titulo}</h3>
              <p data-field={`promocoes.itens.${i}.descricao`} className="mt-3 text-sm text-text-muted">{p.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
