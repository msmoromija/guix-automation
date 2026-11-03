import Link from "next/link";
import { Faq } from "@/components/Faq";
import { DiferenciaisCards } from "@/components/DiferenciaisCards";
import { FeatureCards } from "@/components/FeatureCards";
import { PainelIa } from "@/components/PainelIa";
import { PassosCards } from "@/components/PassosCards";
import { PrecosOla } from "@/components/PrecosOla";
import { contato, linkWhatsapp } from "@/lib/contato";
import { diferenciais } from "@/lib/diferenciais";
import { nichos } from "@/lib/nichos";
import { passos } from "@/lib/passos";
import { produtos } from "@/lib/produto";

const primario =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark";
const secundario =
  "inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent";

export default function HomePage() {
  const faixa = [...nichos, ...nichos];
  const endereco: Record<string, string> = {
    barbearia: "barbeariavilanorte.com.br",
    salao: "salaovilaflor.com.br",
    estetica: "estudioserraclara.com.br",
    petshop: "petshopbento.com.br",
    academia: "academiafarol.com.br",
    contabilidade: "limacontabilidade.com.br",
    advocacia: "valeluzadvogados.com.br",
  };

  return (
    <main>
      <section className="hero-bg overflow-x-clip border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20 lg:pb-20">
          <div className="max-w-3xl">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold text-accent shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              IA configura. Você publica em até 24 horas.
            </p>
            <h1 className="rise rise-2 mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl">
              Seu negócio no ar em até <span className="text-accent">24 horas</span>
            </h1>
            <p className="rise rise-3 mt-5 max-w-xl text-lg leading-8 text-muted">
              Domínio, e-mail profissional, site, agenda e WhatsApp. A IA monta a estrutura. Depois da publicação, o painel fica com você.
            </p>
            <div className="rise rise-4 mt-8 flex flex-wrap gap-3">
              <Link href="/contratar" className={primario}>
                Quero meu site
              </Link>
              <Link href="/#exemplos" className={secundario}>
                Ver exemplos reais
              </Link>
            </div>
          </div>
          <div className="mt-12 lg:mt-14">
            <PainelIa />
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b border-line bg-white py-4">
        <div className="marquee-track flex w-max items-center text-sm font-medium text-ink">
          {faixa.map((item, indice) => (
            <span key={`${item.slug}-${indice}`} className="inline-flex items-center">
              <span className="px-5">{item.nome}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>

      <section id="produto" className="scroll-mt-24 overflow-x-clip bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_42%,#f8fafc_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">Tudo o que seu negócio precisa, pronto</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-600">Sem precisar contratar agência ou entender de tecnologia.</p>
          <FeatureCards itens={produtos} />
        </div>
      </section>

      <section id="exemplos" className="scroll-mt-24 border-y border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Veja exemplos reais no ar</h2>
          <p className="mt-3 max-w-xl text-muted">O mesmo sistema, com a cara de cada tipo de negócio.</p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {nichos.map((item) => (
              <article
                key={item.slug}
                className="group flex flex-col rounded-3xl border border-line bg-white p-3 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(15,23,42,0.4)]"
              >
                <div className="overflow-hidden rounded-2xl border border-line bg-[#F8FAFC]">
                  <div className="flex items-center gap-2 border-b border-line bg-white px-3 py-2.5">
                    <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    </span>
                    <span className="min-w-0 flex-1 truncate rounded-md bg-[#F1F5F9] px-2.5 py-1 text-center text-[11px] text-muted">
                      {endereco[item.slug]}
                    </span>
                  </div>
                  <div className="aspect-[3/2] overflow-hidden bg-white">
                    <img
                      src={`/midia/modelo-${item.slug}.webp`}
                      alt={`Página inicial de ${item.negocio}`}
                      width={1400}
                      height={780}
                      className="h-full w-full origin-top-left object-cover object-left-top transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{item.nome}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{item.negocio}</h3>
                  <p className="mt-1 text-sm text-muted">{item.lugar}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-ink">{item.frase}</p>
                  <div className="mt-5 flex flex-col gap-2">
                    <a href={item.demo} className={`${primario} w-full`}>
                      Ver demonstração
                    </a>
                    <a
                      href={`/prototipar?nicho=${item.slug}`}
                      className={`${secundario} w-full text-center`}
                    >
                      Usar este modelo
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 overflow-x-clip bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_42%,#f8fafc_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">Como funciona</h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">Do pedido à publicação em poucos passos.</p>
          <PassosCards itens={passos} />
        </div>
      </section>

      <section id="por-que" className="scroll-mt-24 overflow-x-clip border-y border-line bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.35fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">Por que o GuiX.net</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
                Não é agência.
                <span className="mt-1 block text-orange-300">Não é mensalidade.</span>
                <span className="mt-1 block">É presença pronta.</span>
              </h2>
            </div>
            <p className="max-w-xl text-[15px] leading-7 text-slate-300 lg:justify-self-end">
              O cliente precisa achar o negócio, marcar horário e falar no WhatsApp. O GuiX.net entrega isso junto — rápido,
              com cara profissional e com o painel ficando com você.
            </p>
          </div>

          <DiferenciaisCards itens={diferenciais} />
        </div>
      </section>

      <section id="precos" className="scroll-mt-24 bg-canvas">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Preços</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-5xl">Preço simples e transparente</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              Um pagamento pela estrutura completa. Sem mensalidade de site. Você escolhe o plano de acordo com a
              complexidade do seu negócio e, se quiser, a configuração pela equipe.
            </p>
          </div>

          <PrecosOla />
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.35fr] lg:gap-14">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Dúvidas</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-5xl">Perguntas frequentes</h2>
              <p className="mt-4 text-[15px] leading-7 text-slate-600">
                Respostas diretas sobre prazo, entrega, painel, domínio, renovação, IA e pagamento. Se ainda
                restar dúvida, fale no WhatsApp.
              </p>
              <a href={linkWhatsapp()} className={`${secundario} mt-6`}>
                Falar no WhatsApp
              </a>
            </div>
            <Faq />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-orange-100 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_55%),linear-gradient(#fff,#fff)] px-6 py-14 text-center shadow-[0_24px_80px_-40px_rgba(249,115,22,0.8)] sm:px-12">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Pronto para colocar seu negócio no ar?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Em até 24 horas você pode ter domínio, e-mail, site, agenda e WhatsApp funcionando. O painel continua com você.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contratar" className={primario}>
              Quero meu site
            </Link>
            <a href={linkWhatsapp()} className={secundario}>
              Falar no WhatsApp
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">{contato.whatsappExibicao}</p>
        </div>
      </section>
    </main>
  );
}
