import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="mx-auto max-w-6xl px-4 py-20">
      <SectionHead titulo={promocoes.titulo} field="promocoes.titulo" />
      <div className="grid gap-5 md:grid-cols-2">
        {promocoes.itens.map((p, i) => (
          <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="grid overflow-hidden rounded-theme border bg-surface sm:grid-cols-[40%_1fr]">
            <img src={p.imagem.src} alt={p.imagem.alt} className="aspect-[16/10] h-full w-full object-cover sm:aspect-auto" loading="lazy" />
            <div className="p-5">
              <span data-field={`promocoes.itens.${i}.validade_label`} className="inline-block rounded-theme bg-lime px-2 py-1 text-xs font-bold uppercase text-page">
                {p.validade_label}
              </span>
              <h3 data-field={`promocoes.itens.${i}.titulo`} className="mt-3 text-3xl font-bold">{p.titulo}</h3>
              <p data-field={`promocoes.itens.${i}.descricao`} className="mt-2 text-sm text-ink-muted">{p.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
