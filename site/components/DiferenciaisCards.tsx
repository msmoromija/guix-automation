"use client";

import Link from "next/link";
import { useOlaDestaque } from "@/hooks/useOlaDestaque";
import type { DiferencialItem } from "@/lib/diferenciais";

export function DiferenciaisCards({ itens }: { itens: DiferencialItem[] }) {
  const ola = useOlaDestaque(itens.length);

  return (
    <div
      className="feature-wave mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      onMouseLeave={() => {
        if (ola.modo === "ciclo") ola.setPausado(false);
      }}
    >
      {itens.map((item, indice) => {
        const nivel = ola.nivel(indice);
        return (
          <Link
            key={item.slug}
            href={`/por-que/${item.slug}`}
            ref={(no) => ola.setNoRef(indice, no)}
            className={`diferencial-card diferencial-card--${nivel} min-w-0 rounded-[24px] p-6`}
            aria-label={`Saiba mais: ${item.titulo}`}
            onMouseEnter={() => {
              if (ola.reduzido || ola.modo !== "ciclo") return;
              ola.setPausado(true);
              ola.setDestaque(indice);
            }}
          >
            <p className="text-[11px] font-semibold tabular-nums tracking-[0.16em] text-orange-300">{item.numero}</p>
            <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-white">{item.titulo}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.texto}</p>
            <span className="mt-5 inline-block text-[12px] font-semibold text-orange-300">Saiba mais →</span>
          </Link>
        );
      })}
    </div>
  );
}
