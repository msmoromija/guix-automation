import { site } from "@/content/site";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const { privacidade } = site;
  return (
    <section className="mx-auto max-w-2xl px-5 py-14 md:py-20">
      <Seo titulo={privacidade.titulo} />
      <h1 data-field="privacidade.titulo" className="text-4xl text-site-primary md:text-5xl">{privacidade.titulo}</h1>
      <div className="mt-8 space-y-5">
        {privacidade.paragrafos.map((p, i) => (
          <p key={i} data-field={`privacidade.paragrafos.${i}`} className="leading-relaxed text-site-muted">{p}</p>
        ))}
      </div>
    </section>
  );
}
