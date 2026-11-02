import { site } from "@/content/site";

export function SobreSection() {
  const { sobre } = site;
  return (
    <section id="sobre" data-section="sobre" className="section grid items-center gap-10 md:grid-cols-2">
      <img src={sobre.imagem.src} alt={sobre.imagem.alt} loading="lazy" className="aspect-[4/3] w-full rounded-site object-cover" />
      <div>
        <span className="eyebrow-line" />
        <h2 data-field="sobre.titulo" className="text-3xl font-bold text-brand md:text-4xl">{sobre.titulo}</h2>
        <div className="mt-5 space-y-4 text-ink-muted">
          {sobre.paragrafos.map((p, i) => (
            <p key={i} data-field={`sobre.paragrafos.${i}`}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
