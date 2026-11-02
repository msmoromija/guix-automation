"use client";

import Link from "next/link";
import { useOlaDestaque } from "@/hooks/useOlaDestaque";
import type { PassoItem } from "@/lib/passos";

export function PassosCards({ itens }: { itens: PassoItem[] }) {
  const ola = useOlaDestaque(itens.length);

  return (
    <div
      className="feature-wave relative mt-10 grid items-stretch gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-4"
      onMouseLeave={() => {
        if (ola.modo === "ciclo") ola.setPausado(false);
      }}
    >
      <div className="pointer-events-none absolute left-[6%] right-[6%] top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-line to-transparent lg:block" />
      {itens.map((item, indice) => {
        const nivel = ola.nivel(indice);
        return (
          <Link
            key={item.slug}
            href={`/como-funciona/${item.slug}`}
            ref={(no) => ola.setNoRef(indice, no)}
            className={`feature-card feature-card--${nivel} min-w-0 rounded-[20px] p-5 sm:p-6`}
            aria-label={`Saiba mais sobre o passo ${item.numero}: ${item.titulo}`}
            onMouseEnter={() => {
              if (ola.reduzido || ola.modo !== "ciclo") return;
              ola.setPausado(true);
              ola.setDestaque(indice);
            }}
          >
            <p className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-accent shadow-sm">
              {item.numero}
            </p>
            <h3 className="feature-title mt-5 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-ink">
              {item.titulo}
            </h3>
            <p className="feature-copy mt-2.5 text-[13.5px] leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {item.texto}
            </p>
            <span className="mt-4 text-[12px] font-semibold text-accent">Saiba mais →</span>
          </Link>
        );
      })}
    </div>
  );
}
