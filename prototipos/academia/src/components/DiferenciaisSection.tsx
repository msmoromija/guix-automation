import { site } from "@/content/site";
import { getIcon } from "./icons";
import { SectionHead } from "./SectionHead";

export function DiferenciaisSection() {
  const { diferenciais } = site;
  return (
    <section id="diferenciais" data-section="diferenciais" className="border-y bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHead titulo={diferenciais.titulo} field="diferenciais.titulo" />
        <div className="grid gap-px overflow-hidden rounded-theme border bg-steel/30 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.itens.map((d, i) => {
            const Icon = getIcon(d.icone);
            return (
              <div key={d.id} data-component="card_diferencial" data-item-id={d.id} className="bg-surface p-6">
                <Icon className="text-lime" size={28} />
                <h3 data-field={`diferenciais.itens.${i}.titulo`} className="mt-4 text-2xl font-bold">{d.titulo}</h3>
                <p data-field={`diferenciais.itens.${i}.descricao`} className="mt-2 text-sm text-ink-muted">{d.descricao}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
