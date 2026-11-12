"use client";

import Link from "next/link";
import { Icone } from "@/components/Icones";
import { clientesPorFaixa } from "@/lib/clientes";
import { linkWhatsapp } from "@/lib/contato";
import { formatarReais } from "@/lib/dinheiro";
import { planos, TAXA_EQUIPE_CENTAVOS } from "@/lib/planos";

const botao =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark";

const botaoSec =
  "inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/30";

const notas = [
  {
    icone: "equipe" as const,
    titulo: "Equipe no lugar da IA",
    texto: `Configuração humana opcional: + ${formatarReais(TAXA_EQUIPE_CENTAVOS)}. Você escolhe na contratação.`,
  },
  {
    icone: "pagamento" as const,
    titulo: "PIX, boleto ou cartão",
    texto: "Até 12x no cartão. O pagamento é processado pelo Asaas.",
  },
  {
    icone: "chave" as const,
    titulo: "Sem mensalidade de site",
    texto: "Você paga a estrutura uma vez e assume o controle pelo painel.",
  },
];

export function PrecosOla() {
  const waPersonalizado = linkWhatsapp(
    "Olá, quero orçar a Presença Personalizada do GuiX.net para o meu negócio.",
  );
  const waBlackFriday = linkWhatsapp(
    "Olá! Quero solicitar o cupom Black Friday para um modelo pronto da Presença Completa. O preço regular é R$ 499,90. Quais modelos participam?",
  );

  return (
    <>
      <div className="preco-grade mt-12 grid items-stretch gap-6 sm:gap-8 lg:grid-cols-3">
        {planos.map((plano) => (
          <article
            key={plano.id}
            className="preco-card relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] p-7 sm:p-8"
          >
            {plano.destaque ? (
              <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                Mais pedida
              </span>
            ) : null}
            <p className="text-sm font-semibold text-accent">{plano.chamada}</p>
            <h3 className="mt-3 max-w-[16rem] text-2xl font-bold tracking-[-0.04em] text-ink sm:text-3xl">{plano.nome}</h3>
            <div className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-1">
              {plano.aPartirDe ? <p className="pb-2 text-sm text-slate-500">A partir de</p> : null}
              <p className="text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-5xl">
                {formatarReais(plano.centavos)}
              </p>
              {!plano.aPartirDe ? <p className="pb-2 text-sm text-slate-500">pagamento único</p> : null}
            </div>
            {plano.aPartirDe ? <p className="mt-1 text-sm text-slate-500">Valor final conforme a personalização</p> : null}
            {plano.id === "simples" ? (
              <div className="mt-5 rounded-2xl border border-orange-300/60 bg-[#07162d] p-4 text-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.8)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-300">Black Friday</p>
                  <p className="text-[11px] font-medium text-slate-300">Por tempo limitado</p>
                </div>
                <p className="mt-2 text-xl font-black">
                  R$ 349,99 <span className="text-sm font-semibold text-orange-200">com cupom*</span>
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-200">
                  Só para modelos prontos da Presença Completa. Preço regular: R$ 499,90. Peça o cupom pelo WhatsApp
                  e aplique no checkout.
                </p>
                <a
                  href={waBlackFriday}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-center text-sm font-bold text-slate-950 transition hover:bg-orange-400"
                >
                  Solicitar cupom no WhatsApp
                </a>
              </div>
            ) : null}
            <p className="mt-5 text-[15px] leading-7 text-slate-600">{plano.resumo}</p>
            <ul className="mt-8 space-y-3.5 text-[15px] text-ink">
              {plano.itens.map((item) => {
                const ehPrazo = /24\s*horas/i.test(item);
                return (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-accent">
                      <Icone nome={ehPrazo ? "relogio" : "check"} className="h-[15px] w-[15px]" />
                    </span>
                    <span className="leading-6">{item}</span>
                  </li>
                );
              })}
            </ul>
            {(() => {
              const exemplo =
                plano.id === "avancado"
                  ? clientesPorFaixa("avancado")[0]
                  : plano.id === "personalizado"
                    ? clientesPorFaixa("personalizado")[0]
                    : null;
              if (!exemplo) return null;
              const hrefExterno = exemplo.siteUrl || exemplo.appUrl || `/clientes#${exemplo.slug}`;
              return (
                <div className="mt-8 rounded-2xl border border-line bg-[#F8FAFC] px-4 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Exemplo nesta faixa</p>
                  <p className="mt-1.5 text-sm font-semibold text-ink">{exemplo.nome}</p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600">{exemplo.segmento}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
                    <a href={hrefExterno} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
                      Ver no ar →
                    </a>
                    <Link href={`/clientes#${exemplo.slug}`} className="text-ink/70 underline-offset-2 hover:underline">
                      Detalhes
                    </Link>
                  </div>
                </div>
              );
            })()}
            <div className="mt-auto pt-8">
              {plano.contratavel ? (
                <Link href={`/contratar?plano=${plano.id}`} className={`${botao} w-full`}>
                  {plano.ctaLabel}
                </Link>
              ) : (
                <a href={waPersonalizado} className={`${botaoSec} w-full`} target="_blank" rel="noreferrer">
                  {plano.ctaLabel}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 border-t border-line pt-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Na contratação</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white sm:grid sm:grid-cols-3">
          {notas.map((nota) => (
            <div
              key={nota.titulo}
              className="preco-nota flex gap-3.5 border-b border-line px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <span className="preco-nota-icone flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-accent">
                <Icone nome={nota.icone} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-snug text-ink">{nota.titulo}</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600">{nota.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
