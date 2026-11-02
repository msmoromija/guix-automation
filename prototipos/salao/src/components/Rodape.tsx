import { casaHref } from "@/lib/casaHref";
import { site } from "@/content";

export function Rodape() {
  const { empresa, rodape } = site;
  return (
    <footer data-section="rodape" className="border-t border-secondary/20 bg-surface pb-24 pt-12 text-sm text-text-muted">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
        <div>
          <p data-field="empresa.nome" className="font-heading text-2xl text-primary">{empresa.nome}</p>
          <p data-field="rodape.texto" className="mt-2">{rodape.texto}</p>
          <p data-field="empresa.cnpj" className="mt-1">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo">{empresa.horario_resumo}</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
          {rodape.links.map((l) => <a key={l.id} href={casaHref(l.href)} className="text-primary hover:underline">{l.label}</a>)}
          {empresa.redes.filter((r) => r.url).map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
