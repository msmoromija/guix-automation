import { casaHref } from "@/lib/casaHref";
import { site } from "@/content/site";

export function Rodape() {
  const { empresa, rodape } = site;
  return (
    <footer data-section="rodape" className="border-t bg-surface pb-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 text-sm text-ink-muted md:grid-cols-3">
        <div>
          <p data-field="empresa.nome" className="font-heading text-3xl font-bold uppercase text-ink">{empresa.nome}</p>
          <p data-field="empresa.cnpj" className="mt-1">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo">{empresa.horario_resumo}</p>
        </div>
        <div className="space-y-1">
          {rodape.links.map((l) => (
            <a key={l.id} href={casaHref(l.href)} className="block hover:text-ink">{l.label}</a>
          ))}
          {empresa.redes.filter((r) => r.url !== "").map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block hover:text-ink">{r.label}</a>
          ))}
        </div>
        <p data-field="rodape.texto" className="border-t pt-6 md:col-span-3">{rodape.texto}</p>
      </div>
    </footer>
  );
}
