import { site } from "@/content/site";
import { SectionTitle } from "./SectionTitle";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <SectionTitle field="promocoes.titulo" title={promocoes.titulo} />
      <div className="grid gap-4 md:grid-cols-2">
        {promocoes.itens.map((p, i) => (
          <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="grid overflow-hidden rounded-brand border bg-surface sm:grid-cols-[2fr_3fr]">
            <img src={p.imagem.src} alt={p.imagem.alt} loading="lazy" className="aspect-[16/9] h-full w-full object-cover sm:aspect-auto" />
            <div className="p-5">
              <p data-field={`promocoes.itens.${i}.validade_label`} className="text-xs uppercase tracking-wider text-secondary">{p.validade_label}</p>
              <h3 data-field={`promocoes.itens.${i}.titulo`} className="mt-2 text-2xl font-semibold">{p.titulo}</h3>
              <p data-field={`promocoes.itens.${i}.descricao`} className="mt-2 text-sm text-text-muted">{p.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
