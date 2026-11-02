import { casaHref } from "@/lib/casaHref";
import { site } from "@/content/site";

export function Rodape() {
  const { empresa, rodape } = site;
  const redes = empresa.redes.filter((r) => r.url);
  return (
    <footer data-section="rodape" className="bg-site-primary text-site-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-28 pt-16 md:grid-cols-3">
        <div>
          <p data-field="empresa.nome" className="font-heading text-2xl">{empresa.nome}</p>
          <p data-field="rodape.texto" className="mt-3 text-sm opacity-70">{rodape.texto}</p>
          <p data-field="empresa.cnpj" className="mt-1 text-sm opacity-70">{empresa.cnpj}</p>
        </div>
        <div className="space-y-1 text-sm opacity-80">
          <p data-field="empresa.telefone_label">{empresa.telefone_label}</p>
          <p data-field="empresa.email">{empresa.email}</p>
          <p data-field="empresa.horario_resumo">{empresa.horario_resumo}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:justify-end">
          {rodape.links.map((l) => (
            <a key={l.id} href={casaHref(l.href)} className="underline-offset-4 hover:underline">{l.label}</a>
          ))}
          {redes.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{r.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
