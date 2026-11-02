import { site } from "@/content";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const { privacidade } = site;
  return (
    <section className="py-12 md:py-16">
      <Seo title={privacidade.titulo} />
      <div className="mx-auto max-w-2xl px-4">
        <span className="eyebrow-rule" />
        <h1 data-field="privacidade.titulo" className="text-3xl font-semibold md:text-4xl">{privacidade.titulo}</h1>
        <div className="mt-6 space-y-4 text-muted-foreground">
          {privacidade.paragrafos.map((p, i) => <p key={i} data-field={`privacidade.paragrafos.${i}`}>{p}</p>)}
        </div>
      </div>
    </section>
  );
}
