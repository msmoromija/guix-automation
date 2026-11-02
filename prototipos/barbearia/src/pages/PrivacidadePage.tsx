import { site } from "@/content/site";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const p = site.privacidade;
  return (
    <Layout>
      <Seo title={p.titulo} />
      <section className="mx-auto max-w-2xl px-4 py-12 md:py-20">
        <h1 data-field="privacidade.titulo" className="text-4xl font-bold md:text-5xl">{p.titulo}</h1>
        <div className="mt-6 space-y-4 text-text-muted">
          {p.paragrafos.map((t, i) => <p key={i} data-field={`privacidade.paragrafos.${i}`}>{t}</p>)}
        </div>
      </section>
    </Layout>
  );
}
