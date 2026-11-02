import { Link } from "@tanstack/react-router";
import { site } from "@/content";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero" className="relative isolate overflow-hidden">
      <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="hero-overlay absolute inset-0 -z-10" />
      <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 md:min-h-[640px] md:justify-center">
        <span className="eyebrow-rule" />
        <p data-field="empresa.slogan" className="mb-3 text-sm uppercase tracking-[0.18em] text-background/80">{empresa.slogan}</p>
        <h1 data-field="hero.titulo" className="max-w-2xl text-4xl leading-[1.1] font-semibold text-background md:text-6xl">
          {hero.titulo}
        </h1>
        <p data-field="hero.subtitulo" className="mt-5 max-w-xl text-lg text-background/90">{hero.subtitulo}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/agendar" data-action="agendar" data-field="hero.botao_principal" className="btn-primary border border-background/30">
            {hero.botao_principal}
          </Link>
          <a
            href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)}
            target="_blank" rel="noreferrer" data-action="whatsapp" data-field="hero.botao_secundario"
            className="btn-secondary bg-card"
          >
            {hero.botao_secundario}
          </a>
        </div>
      </div>
    </section>
  );
}
