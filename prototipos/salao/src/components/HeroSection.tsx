import { Link } from "@tanstack/react-router";
import { site } from "@/content";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero" className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
      <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/90 via-primary/50 to-primary/10" />
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-24 sm:pb-20">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent" data-field="empresa.slogan">{empresa.slogan}</p>
        <h1 data-field="hero.titulo" className="max-w-3xl text-5xl text-surface sm:text-7xl">{hero.titulo}</h1>
        <p data-field="hero.subtitulo" className="mt-5 max-w-xl text-base text-surface/85 sm:text-lg">{hero.subtitulo}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/agendar" data-action="agendar" data-field="hero.botao_principal" className="btn-primary">{hero.botao_principal}</Link>
          <a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="hero.botao_secundario" className="btn-secondary border-accent bg-background/90">
            {hero.botao_secundario}
          </a>
        </div>
      </div>
    </section>
  );
}
