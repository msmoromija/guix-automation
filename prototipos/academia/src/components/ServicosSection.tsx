import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

export function ServicosSection() {
  const { servicos, header } = site;
  return (
    <section id="servicos" data-section="servicos" className="border-t bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHead titulo={servicos.titulo} field="servicos.titulo" subtitulo={servicos.subtitulo} subField="servicos.subtitulo" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.itens.map((s, i) => (
            <article key={s.id} data-component="card_servico" data-item-id={s.id} className="flex flex-col overflow-hidden rounded-theme border bg-page">
              <img src={s.imagem.src} alt={s.imagem.alt} className="aspect-[16/10] w-full object-cover" loading="lazy" />
              <div className="flex flex-1 flex-col p-5">
                <h3 data-field={`servicos.itens.${i}.nome`} className="text-3xl font-bold">{s.nome}</h3>
                <p data-field={`servicos.itens.${i}.descricao`} className="mt-2 flex-1 text-sm text-ink-muted">{s.descricao}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span data-field={`servicos.itens.${i}.preco_label`} className="font-heading text-3xl font-bold text-lime">{s.preco_label}</span>
                  <span data-field={`servicos.itens.${i}.duracao_label`} className="inline-flex items-center gap-1 text-sm text-ink-muted">
                    <Clock size={14} /> {s.duracao_label}
                  </span>
                </div>
                <Link to="/agendar" search={{ servico: s.id }} data-action="agendar" className="btn-primary mt-5">
                  {header.botao_agendar}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
