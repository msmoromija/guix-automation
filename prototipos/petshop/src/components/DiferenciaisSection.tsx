import { site } from "@/content/site";
import { Icon } from "./icons";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="bg-brand text-surface">
      <div className="section">
        <span className="eyebrow-line bg-sand" />
        <h2 data-field="diferenciais.titulo" className="text-3xl font-bold md:text-4xl">{diferenciais.titulo}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.itens.map((d, i) => (
            <div key={d.id} data-component="card_diferencial" data-item-id={d.id}>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-site bg-sand text-brand">
                <Icon name={d.icone} className="h-6 w-6" />
              </span>
              <h3 data-field={`diferenciais.itens.${i}.titulo`} className="mt-4 text-lg font-bold">{d.titulo}</h3>
              <p data-field={`diferenciais.itens.${i}.descricao`} className="mt-1 text-sm opacity-80">{d.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
