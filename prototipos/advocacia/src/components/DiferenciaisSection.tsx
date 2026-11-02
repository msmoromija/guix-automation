import { site } from "@/content/site";
import { Icon } from "./icons";
import { SectionHead } from "./SectionHead";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="border-y border-site-line bg-site-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHead field="diferenciais" titulo={diferenciais.titulo} />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.itens.map((d, i) => (
            <div key={d.id} data-component="card_diferencial" data-item-id={d.id} className="border-t border-site-accent pt-6">
              <Icon name={d.icone} className="h-6 w-6 text-site-accent" />
              <h3 data-field={`diferenciais.itens.${i}.titulo`} className="mt-4 text-xl text-site-primary">{d.titulo}</h3>
              <p data-field={`diferenciais.itens.${i}.descricao`} className="mt-2 text-sm leading-relaxed text-site-muted">{d.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
