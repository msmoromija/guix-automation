import { casaHref } from "@/lib/casaHref";
import { site } from "@/content/site";

export function Rodape() {
  const { empresa, rodape } = site;
  const redes = empresa.redes.filter((r) => r.url);
  return (
    <footer data-section="rodape" className="bg-brand pb-24 text-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <p data-field="empresa.nome" className="font-display text-2xl font-bold">{empresa.nome}</p>
          <p data-field="rodape.texto" className="mt-2 text-sm opacity-80">{rodape.texto}</p>
          <p data-field="empresa.cnpj" className="mt-1 text-xs opacity-60">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1 text-sm">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo" className="opacity-80">{empresa.horario_resumo}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold md:justify-end">
          {rodape.links.map((l) => <a key={l.id} href={casaHref(l.href)} className="text-sand hover:underline">{l.label}</a>)}
          {redes.map((r) => <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="text-sand hover:underline">{r.label}</a>)}
        </div>
      </div>
    </footer>
  );
}
