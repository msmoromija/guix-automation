"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LEITURA_MS = 4200;

export type CamadaOla = "peak" | "mid" | "back";
export type ModoOla = "ciclo" | "scroll";

export function camadaOla(indice: number, destaque: number, total: number, circular: boolean): CamadaOla {
  const bruto = Math.abs(indice - destaque);
  const dist = circular ? Math.min(bruto, total - bruto) : bruto;
  if (dist === 0) return "peak";
  if (dist === 1) return "mid";
  return "back";
}

/**
 * Desktop (lg+): ola circular no tempo.
 * Tablet e mobile: destaque no quadro mais perto do centro da tela (ola vertical / por foco).
 */
export function useOlaDestaque(total: number) {
  const [destaque, setDestaque] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reduzido, setReduzido] = useState(false);
  const [modo, setModo] = useState<ModoOla>("ciclo");
  const [circular, setCircular] = useState(true);
  const nosRefs = useRef<Array<HTMLElement | null>>([]);

  const setNoRef = useCallback((indice: number, no: HTMLElement | null) => {
    nosRefs.current[indice] = no;
  }, []);

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");

    const sincronizar = () => {
      setReduzido(reduzir.matches);
      if (desktop.matches) {
        setModo("ciclo");
        setCircular(true);
      } else {
        setModo("scroll");
        setCircular(false);
        setPausado(false);
      }
    };

    sincronizar();
    reduzir.addEventListener("change", sincronizar);
    desktop.addEventListener("change", sincronizar);
    return () => {
      reduzir.removeEventListener("change", sincronizar);
      desktop.removeEventListener("change", sincronizar);
    };
  }, []);

  useEffect(() => {
    if (reduzido || modo !== "ciclo" || pausado || total === 0) return;
    const timer = window.setInterval(() => {
      setDestaque((valor) => (valor + 1) % total);
    }, LEITURA_MS);
    return () => window.clearInterval(timer);
  }, [modo, pausado, reduzido, total]);

  useEffect(() => {
    if (reduzido || modo !== "scroll" || total === 0) return;

    let frame = 0;
    const atualizar = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const centro = window.innerHeight * 0.42;
        let melhor = 0;
        let melhorDist = Number.POSITIVE_INFINITY;

        nosRefs.current.forEach((no, indice) => {
          if (!no || indice >= total) return;
          const caixa = no.getBoundingClientRect();
          if (caixa.bottom < 48 || caixa.top > window.innerHeight - 48) return;
          const meio = caixa.top + caixa.height / 2;
          const dist = Math.abs(meio - centro);
          if (dist < melhorDist) {
            melhorDist = dist;
            melhor = indice;
          }
        });

        setDestaque((atual) => (atual === melhor ? atual : melhor));
      });
    };

    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, [modo, reduzido, total]);

  const nivel = useCallback(
    (indice: number): CamadaOla => {
      if (reduzido) return "mid";
      return camadaOla(indice, destaque, total, circular);
    },
    [circular, destaque, reduzido, total],
  );

  return {
    destaque,
    setDestaque,
    pausado,
    setPausado,
    reduzido,
    modo,
    setNoRef,
    nivel,
  };
}
