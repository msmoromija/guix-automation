import { casaHref } from "@/lib/casaHref";
import { site } from "@/content";

export function Rodape() {
  const { empresa, rodape } = site;
  return (
    <footer data-section="rodape" className="bg-primary pb-24 pt-12 text-background/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
        <div>
          <p data-field="empresa.nome" className="font-[family-name:var(--font-heading)] text-xl font-semibold text-background">{empresa.nome}</p>
          <p data-field="empresa.cnpj" className="mt-1 text-sm">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1 text-sm">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo">{empresa.horario_resumo}</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {rodape.links.map((l) => (
            <a key={l.id} href={casaHref(l.href)} className="hover:text-background">{l.label}</a>
          ))}
          {empresa.redes.filter((r) => r.url).map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="hover:text-background">{r.label}</a>
          ))}
        </nav>
      </div>
      <p data-field="rodape.texto" className="mx-auto mt-10 max-w-6xl border-t border-background/15 px-4 pt-6 text-xs">{rodape.texto}</p>
    </footer>
  );
}
