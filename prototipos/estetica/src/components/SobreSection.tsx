import { site } from "@/content";

export function SobreSection() {
  const { sobre } = site;
  return (
    <section id="sobre" data-section="sobre" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 data-field="sobre.titulo" className="text-3xl text-brand sm:text-5xl">{sobre.titulo}</h2>
          <div className="mt-6 space-y-4 text-ink-muted leading-relaxed">
            {sobre.paragrafos.map((p, i) => (
              <p key={i} data-field={`sobre.paragrafos.${i}`}>{p}</p>
            ))}
          </div>
        </div>
        <img src={sobre.imagem.src} alt={sobre.imagem.alt} className="aspect-[4/5] w-full rounded-ui object-cover" loading="lazy" />
      </div>
    </section>
  );
}
