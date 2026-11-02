import { site } from "@/content";

export function SobreSection() {
  const { sobre } = site;
  return (
    <section id="sobre" data-section="sobre" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
      <div>
        <h2 data-field="sobre.titulo" className="text-4xl sm:text-5xl">{sobre.titulo}</h2>
        <div className="mt-6 space-y-4 text-text-muted">
          {sobre.paragrafos.map((p, i) => <p key={i} data-field={`sobre.paragrafos.${i}`}>{p}</p>)}
        </div>
      </div>
      <img src={sobre.imagem.src} alt={sobre.imagem.alt} loading="lazy" className="rounded-site aspect-[4/5] w-full object-cover" />
    </section>
  );
}
