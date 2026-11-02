import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { site } from "@/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function HeroSection() {
  const { hero, empresa } = site;
  return (
    <section id="inicio" data-section="hero" className="relative flex min-h-[88svh] items-end overflow-hidden">
      <img src={hero.imagem.src} alt={hero.imagem.alt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="hero-shade absolute inset-0" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-32">
        <p data-field="empresa.slogan" className="mb-4 inline-block border-l-2 border-lime pl-3 text-sm font-semibold uppercase tracking-[0.2em] text-lime">
          {empresa.slogan}
        </p>
        <h1 data-field="hero.titulo" className="max-w-3xl text-6xl font-bold sm:text-7xl lg:text-8xl">
          {hero.titulo}
        </h1>
        <p data-field="hero.subtitulo" className="mt-5 max-w-xl text-lg text-ink-muted">
          {hero.subtitulo}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/agendar" data-action="agendar" data-field="hero.botao_principal" className="btn-primary">
            {hero.botao_principal}
          </Link>
          <a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="hero.botao_secundario" className="btn-secondary">
            <MessageCircle size={18} /> {hero.botao_secundario}
          </a>
        </div>
      </div>
    </section>
  );
}
