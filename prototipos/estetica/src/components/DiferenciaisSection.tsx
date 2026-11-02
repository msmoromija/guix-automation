import { site } from "@/content";
import { Icon } from "./icons";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <h2 data-field="diferenciais.titulo" className="text-3xl text-brand sm:text-5xl">{diferenciais.titulo}</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-ui border bg-line sm:grid-cols-2">
          {diferenciais.itens.map((d) => (
            <div key={d.id} data-component="card_diferencial" data-item-id={d.id} className="bg-paper p-7">
              <Icon name={d.icone} className="h-6 w-6 text-sage" />
              <h3 data-field={`diferenciais.itens.${d.id}.titulo`} className="mt-4 text-xl text-brand">{d.titulo}</h3>
              <p data-field={`diferenciais.itens.${d.id}.descricao`} className="mt-2 text-sm leading-relaxed text-ink-muted">{d.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
