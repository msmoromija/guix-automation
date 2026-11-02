import { casaHref } from "@/lib/casaHref";
import { site } from "@/content";

export function Rodape() {
  const { empresa, rodape } = site;
  const redes = empresa.redes.filter((r) => r.url);
  return (
    <footer data-section="rodape" className="border-t bg-paper pb-28 pt-14 sm:pb-14">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 text-sm text-ink-muted md:grid-cols-3">
        <div>
          <p data-field="empresa.nome" className="font-display text-xl text-brand">{empresa.nome}</p>
          <p data-field="rodape.texto" className="mt-2">{rodape.texto}</p>
          <p data-field="empresa.cnpj" className="mt-2">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo">{empresa.horario_resumo}</p>
        </div>
        <div className="flex flex-col gap-1">
          {rodape.links.map((l) => (
            <a key={l.id} href={casaHref(l.href)} className="hover:text-brand">{l.label}</a>
          ))}
          {redes.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="hover:text-brand">{r.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
