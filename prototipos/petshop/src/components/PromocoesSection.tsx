import { site } from "@/content/site";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="section">
      <span className="eyebrow-line" />
      <h2 data-field="promocoes.titulo" className="text-3xl font-bold text-brand md:text-4xl">{promocoes.titulo}</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {promocoes.itens.map((p, i) => (
          <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="card grid sm:grid-cols-[2fr_3fr]">
            <img src={p.imagem.src} alt={p.imagem.alt} loading="lazy" className="aspect-[16/10] h-full w-full object-cover sm:aspect-auto" />
            <div className="p-5">
              <p data-field={`promocoes.itens.${i}.validade_label`} className="inline-block rounded-site bg-sand px-2 py-1 text-xs font-bold text-brand">{p.validade_label}</p>
              <h3 data-field={`promocoes.itens.${i}.titulo`} className="mt-3 text-xl font-bold text-brand">{p.titulo}</h3>
              <p data-field={`promocoes.itens.${i}.descricao`} className="mt-2 text-sm text-ink-muted">{p.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
