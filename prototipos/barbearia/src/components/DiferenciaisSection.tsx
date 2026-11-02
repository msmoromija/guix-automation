import { site } from "@/content/site";
import { Icon } from "./icons";
import { SectionTitle } from "./SectionTitle";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="border-y bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionTitle field="diferenciais.titulo" title={diferenciais.titulo} />
        <div className="grid gap-px overflow-hidden rounded-brand border bg-line sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.itens.map((d, i) => (
            <div key={d.id} data-component="card_diferencial" data-item-id={d.id} className="bg-surface p-6">
              <Icon name={d.icone} className="h-6 w-6 text-accent" />
              <h3 data-field={`diferenciais.itens.${i}.titulo`} className="mt-4 text-lg font-semibold">{d.titulo}</h3>
              <p data-field={`diferenciais.itens.${i}.descricao`} className="mt-2 text-sm text-text-muted">{d.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
