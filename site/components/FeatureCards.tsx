"use client";

import Link from "next/link";
import { Icone } from "@/components/Icones";
import { useOlaDestaque } from "@/hooks/useOlaDestaque";
import type { ProdutoItem } from "@/lib/produto";

export function FeatureCards({ itens }: { itens: ProdutoItem[] }) {
  const ola = useOlaDestaque(itens.length);

  return (
    <div
      className="feature-wave mt-8 grid items-stretch gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-5"
      onMouseLeave={() => {
        if (ola.modo === "ciclo") ola.setPausado(false);
      }}
    >
      {itens.map((item, indice) => {
        const nivel = ola.nivel(indice);
        return (
          <Link
            key={item.slug}
            href={`/produto/${item.slug}`}
            ref={(no) => ola.setNoRef(indice, no)}
            className={`feature-card feature-card--${nivel} min-w-0 rounded-[20px] p-5 sm:p-6`}
            aria-label={`Saiba mais sobre ${item.titulo}`}
            onMouseEnter={() => {
              if (ola.reduzido || ola.modo !== "ciclo") return;
              ola.setPausado(true);
              ola.setDestaque(indice);
            }}
          >
            <span className="feature-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-accent">
              <Icone nome={item.icone} />
            </span>
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
