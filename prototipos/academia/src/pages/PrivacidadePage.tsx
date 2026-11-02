import { site } from "@/content/site";
import { Header } from "@/components/Header";
import { Rodape } from "@/components/Rodape";
import { WhatsappFlutuante } from "@/components/WhatsappFlutuante";
import { Seo } from "@/components/Seo";

export function PrivacidadePage() {
  const { privacidade } = site;
  return (
    <>
      <Seo titulo={privacidade.titulo} />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 data-field="privacidade.titulo" className="text-6xl font-bold">{privacidade.titulo}</h1>
        <div className="mt-8 space-y-4 text-ink-muted">
          {privacidade.paragrafos.map((p, i) => (
            <p key={i} data-field={`privacidade.paragrafos.${i}`}>{p}</p>
          ))}
        </div>
      </main>
      <Rodape />
      <WhatsappFlutuante />
    </>
  );
}
