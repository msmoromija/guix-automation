"use client";

import Link from "next/link";
import { Icone } from "@/components/Icones";
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
            <div className="mt-auto pt-10">
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
