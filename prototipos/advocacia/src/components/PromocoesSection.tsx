import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function PromocoesSection() {
  const { promocoes } = site;
  if (promocoes.itens.length === 0) return null;
  return (
    <section id="promocoes" data-section="promocoes" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionHead field="promocoes" titulo={promocoes.titulo} />
      <div className="grid gap-8">
        {promocoes.itens.map((p, i) => (
          <article key={p.id} data-component="card_promocao" data-item-id={p.id} className="grid border border-site-line bg-site-surface md:grid-cols-2">
            <img src={p.imagem.src} alt={p.imagem.alt} className="aspect-[3/2] h-full w-full object-cover md:aspect-auto" loading="lazy" />
            <div className="flex flex-col justify-center p-6 md:p-10">
              <p data-field={`promocoes.itens.${i}.validade_label`} className="eyebrow">{p.validade_label}</p>
              <h3 data-field={`promocoes.itens.${i}.titulo`} className="mt-3 text-3xl text-site-primary">{p.titulo}</h3>
              <p data-field={`promocoes.itens.${i}.descricao`} className="mt-4 leading-relaxed text-site-muted">{p.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
