import { site } from "@/content";

export function SobreSection() {
  const { sobre } = site;
  return (
    <section id="sobre" data-section="sobre" className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center">
        <div>
          <span className="eyebrow-rule" />
          <h2 data-field="sobre.titulo" className="text-3xl font-semibold md:text-4xl">{sobre.titulo}</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            {sobre.paragrafos.map((p, i) => (
              <p key={i} data-field={`sobre.paragrafos.${i}`}>{p}</p>
            ))}
          </div>
        </div>
        <img src={sobre.imagem.src} alt={sobre.imagem.alt} loading="lazy" className="aspect-[4/3] w-full rounded-[var(--radius)] object-cover" />
      </div>
    </section>
  );
}
