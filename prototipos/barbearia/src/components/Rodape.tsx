import { casaHref } from "@/lib/casaHref";
import { site } from "@/content/site";
import { Wordmark } from "./Header";

export function Rodape() {
  const { empresa, rodape } = site;
  const redes = empresa.redes.filter((r) => r.url);
  return (
    <footer data-section="rodape" className="border-t bg-surface pb-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-text-muted md:grid-cols-3">
        <div className="space-y-2">
          <Wordmark />
          {empresa.logo.src && <p data-field="empresa.nome">{empresa.nome}</p>}
          <p data-field="empresa.cnpj">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo">{empresa.horario_resumo}</p>
        </div>
        <ul className="space-y-1">
          {rodape.links.map((l) => (
            <li key={l.id}><a href={casaHref(l.href)} className="hover:text-accent">{l.label}</a></li>
          ))}
          {redes.map((r) => (
            <li key={r.id}><a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{r.label}</a></li>
          ))}
        </ul>
      </div>
      <p data-field="rodape.texto" className="mx-auto max-w-6xl border-t px-4 pt-6 text-xs text-text-muted">{rodape.texto}</p>
    </footer>
  );
}
