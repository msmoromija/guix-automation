import { site } from "@/content/site";

export function SobreSection() {
  const { sobre } = site;
  return (
    <section id="sobre" data-section="sobre" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:gap-16 md:py-28">
      <div>
        <h2 data-field="sobre.titulo" className="text-4xl leading-tight text-site-primary md:text-5xl">{sobre.titulo}</h2>
        <div className="mt-6 h-px w-16 bg-site-accent" />
        <div className="mt-8 space-y-5">
          {sobre.paragrafos.map((p, i) => (
            <p key={i} data-field={`sobre.paragrafos.${i}`} className="text-base leading-relaxed text-site-muted">{p}</p>
          ))}
        </div>
      </div>
      <img src={sobre.imagem.src} alt={sobre.imagem.alt} className="aspect-[4/5] w-full rounded-site object-cover" loading="lazy" />
    </section>
  );
}
