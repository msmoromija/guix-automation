import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero" className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
      <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/10" />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 md:pb-20">
        <p data-field="empresa.slogan" className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">{empresa.slogan}</p>
        <h1 data-field="hero.titulo" className="max-w-3xl text-5xl font-bold md:text-7xl">{hero.titulo}</h1>
        <p data-field="hero.subtitulo" className="mt-4 max-w-xl text-base text-text-muted md:text-lg">{hero.subtitulo}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link to="/agendar" data-action="agendar" data-field="hero.botao_principal" className="btn-primary">{hero.botao_principal}</Link>
          <a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noopener noreferrer" data-action="whatsapp" data-field="hero.botao_secundario" className="btn-secondary">
            {hero.botao_secundario}
          </a>
        </div>
      </div>
    </section>
  );
}
