import { site } from "@/content";
import { Icon } from "./icons";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="border-y border-secondary/20 bg-surface py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 data-field="diferenciais.titulo" className="text-4xl sm:text-5xl">{diferenciais.titulo}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.itens.map((d, i) => (
            <div key={d.id} data-component="card_diferencial" data-item-id={d.id} className="rounded-site line p-6">
              <Icon name={d.icone} className="h-6 w-6 text-secondary" />
              <h3 data-field={`diferenciais.itens.${i}.titulo`} className="mt-4 text-xl">{d.titulo}</h3>
              <p data-field={`diferenciais.itens.${i}.descricao`} className="mt-2 text-sm text-text-muted">{d.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
