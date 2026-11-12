import Image from "next/image";
import { linkWhatsapp } from "@/lib/contato";

const mensagemCupom =
  "Olá! Quero aproveitar a promoção Black Friday do GuiX.net. Vi o valor de R$ 349,99 e gostaria de solicitar o cupom de desconto. Quais modelos prontos elegíveis da Presença Completa estão disponíveis? Sei que o preço regular é R$ 499,90.";

export function BlackFridayPromo() {
  return (
    <section
      id="black-friday"
      aria-labelledby="black-friday-titulo"
      className="relative overflow-hidden border-b border-slate-800 bg-[#07162d] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_50%,rgba(249,115,22,0.2),transparent_36%),radial-gradient(ellipse_at_90%_10%,rgba(37,99,235,0.28),transparent_42%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-9 px-5 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <p className="inline-flex rounded-full border border-orange-400/50 bg-orange-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-orange-300">
            Oferta Black Friday · por tempo limitado
          </p>
          <h2
            id="black-friday-titulo"
            className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl"
          >
            Seu site profissional por{" "}
            <span className="text-orange-400">R$ 349,99*</span>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
            Peça seu cupom pelo WhatsApp antes de contratar e confira quais modelos prontos participam da promoção.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={linkWhatsapp(mensagemCupom)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-center text-sm font-bold text-slate-950 shadow-lg shadow-orange-950/30 transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
            >
              Quero meu site - Promoção Black Friday
            </a>
            <a
              href="#exemplos"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-orange-300 hover:text-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
            >
              Ver modelos disponíveis
            </a>
          </div>
          <p className="mt-5 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
            *R$ 349,99 mediante cupom solicitado pelo WhatsApp. Oferta válida somente para modelos prontos elegíveis
            da Presença Completa, com preço regular de R$ 499,90. Não inclui Presença Avançada, Presença Personalizada
            nem projetos fora dos modelos disponíveis. Confirme o modelo participante e as condições do cupom no
            atendimento.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.8)]">
          <Image
            src="/midia/black-friday-guix.webp"
            alt="Banner Black Friday do GuiX.net: site profissional, domínio, até cinco e-mails, WhatsApp, agenda online e preço promocional de R$ 349,99"
            width={1122}
            height={1402}
            sizes="(max-width: 1024px) 90vw, 430px"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
