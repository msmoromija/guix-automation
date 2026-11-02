"use client";

import Link from "next/link";
import { Icone } from "@/components/Icones";
import { useOlaDestaque } from "@/hooks/useOlaDestaque";
import { formatarReais } from "@/lib/dinheiro";
import { planos, TAXA_EQUIPE_CENTAVOS } from "@/lib/planos";

const botao =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark";

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
  const planosOla = useOlaDestaque(planos.length);

  return (
    <>
      <div
        className="feature-wave mt-12 grid items-stretch gap-6 sm:gap-8 lg:grid-cols-2"
        onMouseLeave={() => {
          if (planosOla.modo === "ciclo") planosOla.setPausado(false);
        }}
      >
        {planos.map((plano, indice) => {
          const nivel = planosOla.nivel(indice);
          return (
            <article
              key={plano.id}
              ref={(no) => planosOla.setNoRef(indice, no)}
              className={`feature-card feature-card--${nivel} relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] p-7 sm:p-9`}
              onMouseEnter={() => {
                if (planosOla.reduzido || planosOla.modo !== "ciclo") return;
                planosOla.setPausado(true);
                planosOla.setDestaque(indice);
              }}
            >
              {plano.destaque ? (
                <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                  Mais pedida
                </span>
              ) : null}
              <p className="text-sm font-semibold text-accent">{plano.chamada}</p>
              <h3 className="mt-3 max-w-[16rem] text-3xl font-bold tracking-[-0.04em] text-ink">{plano.nome}</h3>
              <div className="mt-8 flex items-end gap-2">
                <p className="text-5xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">
                  {formatarReais(plano.centavos)}
                </p>
                <p className="pb-2 text-sm text-slate-500">pagamento único</p>
              </div>
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
                <Link href={`/contratar?plano=${plano.id}`} className={`${botao} w-full`}>
                  Quero meu site agora
                </Link>
              </div>
            </article>
          );
        })}
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
