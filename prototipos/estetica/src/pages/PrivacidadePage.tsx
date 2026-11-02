import { site } from "@/content";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const { privacidade } = site;
  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <Seo titulo={privacidade.titulo} />
      <h1 data-field="privacidade.titulo" className="text-4xl text-brand sm:text-5xl">{privacidade.titulo}</h1>
      <div className="mt-8 space-y-5 leading-relaxed text-ink-muted">
        {privacidade.paragrafos.map((p, i) => <p key={i} data-field={`privacidade.paragrafos.${i}`}>{p}</p>)}
      </div>
    </div>
  );
}
