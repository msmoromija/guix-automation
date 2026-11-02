import { site } from "@/content/site";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const { privacidade } = site;
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-20">
      <Seo titulo={privacidade.titulo} />
      <span className="eyebrow-line" />
      <h1 data-field="privacidade.titulo" className="text-3xl font-bold text-brand md:text-5xl">{privacidade.titulo}</h1>
      <div className="mt-8 space-y-5 text-ink-muted">
        {privacidade.paragrafos.map((p, i) => <p key={i} data-field={`privacidade.paragrafos.${i}`}>{p}</p>)}
      </div>
    </div>
  );
}
