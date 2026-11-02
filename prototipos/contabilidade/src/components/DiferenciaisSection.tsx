import { site } from "@/content";
import { Icon } from "./icons";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="bg-primary py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <span className="eyebrow-rule" />
        <h2 data-field="diferenciais.titulo" className="text-3xl font-semibold text-background md:text-4xl">{diferenciais.titulo}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.itens.map((d) => (
            <div key={d.id} data-component="card_diferencial" data-item-id={d.id} className="border-t border-background/20 pt-5">
              <Icon name={d.icone} className="h-6 w-6 text-secondary" />
              <h3 data-field="diferenciais.itens.titulo" className="mt-3 text-lg font-semibold text-background">{d.titulo}</h3>
              <p data-field="diferenciais.itens.descricao" className="mt-2 text-sm text-background/75">{d.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
