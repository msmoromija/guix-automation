import { site } from "@/content";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const { privacidade } = site;
  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <Seo title={privacidade.titulo} />
      <h1 data-field="privacidade.titulo" className="text-4xl sm:text-5xl">{privacidade.titulo}</h1>
      <div className="mt-8 space-y-4 text-text-muted">
        {privacidade.paragrafos.map((p, i) => <p key={i} data-field={`privacidade.paragrafos.${i}`}>{p}</p>)}
      </div>
    </section>
  );
}
