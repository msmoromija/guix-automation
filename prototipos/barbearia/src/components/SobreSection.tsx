import { site } from "@/content/site";
import { SectionTitle } from "./SectionTitle";

export function SobreSection() {
  const { sobre } = site;
  return (
    <section id="sobre" data-section="sobre" className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
      <div>
        <SectionTitle field="sobre.titulo" title={sobre.titulo} />
        <div className="space-y-4 text-text-muted">
          {sobre.paragrafos.map((p, i) => (
            <p key={i} data-field={`sobre.paragrafos.${i}`}>{p}</p>
          ))}
        </div>
      </div>
      <img src={sobre.imagem.src} alt={sobre.imagem.alt} loading="lazy" className="aspect-[4/5] w-full rounded-brand border object-cover" />
    </section>
  );
}
