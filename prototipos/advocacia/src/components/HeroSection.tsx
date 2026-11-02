import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero" className="relative isolate overflow-hidden">
      <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-site-overlay" />
      <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-end px-5 pb-14 pt-32 md:pb-24">
        <p data-field="empresa.slogan" className="eyebrow mb-5 text-site-bg/80">{empresa.slogan}</p>
        <h1 data-field="hero.titulo" className="max-w-3xl text-5xl leading-[1.02] text-site-bg md:text-7xl">
          {hero.titulo}
        </h1>
        <p data-field="hero.subtitulo" className="mt-6 max-w-xl text-lg leading-relaxed text-site-bg/85">
          {hero.subtitulo}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/agendar" data-action="agendar" data-field="hero.botao_principal" className="btn-primary">
            {hero.botao_principal}
          </Link>
          <a
            href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            data-action="whatsapp"
            data-field="hero.botao_secundario"
            className="btn-secondary border-site-bg/60 text-site-bg"
          >
            {hero.botao_secundario}
          </a>
        </div>
      </div>
    </section>
  );
}
