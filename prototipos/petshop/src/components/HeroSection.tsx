import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero">
      <div className="relative h-[68svh] min-h-[420px] max-h-[760px] w-full overflow-hidden">
        <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-8 md:pb-14">
          <p data-field="empresa.slogan" className="mb-3 inline-block rounded-site bg-sand px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
            {empresa.slogan}
          </p>
          <h1 data-field="hero.titulo" className="max-w-3xl text-4xl font-bold leading-[1.05] text-surface sm:text-5xl md:text-7xl">
            {hero.titulo}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8 md:flex md:items-center md:justify-between md:gap-10">
        <p data-field="hero.subtitulo" className="max-w-xl text-lg text-ink-muted">{hero.subtitulo}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-0">
          <Link to="/agendar" data-action="agendar" data-field="hero.botao_principal" className="btn-primary">
            {hero.botao_principal}
          </Link>
          <a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="hero.botao_secundario" className="btn-secondary">
            {hero.botao_secundario}
          </a>
        </div>
      </div>
    </section>
  );
}
