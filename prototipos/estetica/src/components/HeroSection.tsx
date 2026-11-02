import { Link } from "@tanstack/react-router";
import { site } from "@/content";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero" className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative mx-auto min-h-[82svh] max-w-7xl overflow-hidden rounded-ui">
        <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/50 to-transparent" />
        <div className="relative flex min-h-[82svh] flex-col justify-end p-6 pb-10 sm:p-12 lg:p-16">
          <p className="eyebrow !text-sand" data-field="empresa.slogan">{empresa.slogan}</p>
          <h1 data-field="hero.titulo" className="mt-4 max-w-3xl text-4xl leading-[1.05] text-paper sm:text-6xl lg:text-7xl">
            {hero.titulo}
          </h1>
          <p data-field="hero.subtitulo" className="mt-5 max-w-xl text-base leading-relaxed text-paper/90 sm:text-lg">
            {hero.subtitulo}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/agendar" data-action="agendar" className="btn-primary" data-field="hero.botao_principal">
              {hero.botao_principal}
            </Link>
            <a
              href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)}
              target="_blank"
              rel="noreferrer"
              data-action="whatsapp"
              data-field="hero.botao_secundario"
              className="btn-secondary !border-sand !text-paper"
            >
              {hero.botao_secundario}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
