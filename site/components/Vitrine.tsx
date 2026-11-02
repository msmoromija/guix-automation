"use client";

import { useEffect, useState } from "react";
import { tintaSobre, luminosidade } from "@/lib/cor";
import { nichos } from "@/lib/nichos";

function dominio(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return `${base}.com.br`;
}

export function Vitrine() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido || pausado) return;
    const timer = window.setInterval(() => {
      setIndice((atual) => (atual + 1) % nichos.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [pausado]);

  const exemplo = nichos[indice];
  const clara = luminosidade(exemplo.tema.fundo) > 0.6;

  return (
    <div
      className="rise rise-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_rgb(15_23_42_/_0.08)]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" />
        <span className="ml-2 truncate rounded-full bg-canvas px-3 py-1 text-xs text-muted">{dominio(exemplo.negocio)}</span>
      </div>
      <div
        className="relative min-h-[320px] p-6 transition-colors duration-500 sm:p-8"
        style={{ background: exemplo.tema.fundo, color: exemplo.tema.tinta }}
      >
        <p className="text-sm font-medium opacity-70">{exemplo.nome}</p>
        <p className="mt-8 max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-0.03em]">{exemplo.frase}</p>
        <p className="mt-3 text-sm opacity-80">{exemplo.lugar}</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {["Agenda", "WhatsApp", "Serviços"].map((item) => (
            <span
              key={item}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: clara ? "#ffffff" : "rgb(255 255 255 / 0.1)",
                color: exemplo.tema.tinta,
                border: `1px solid ${clara ? "rgb(15 23 42 / 0.14)" : "rgb(255 255 255 / 0.22)"}`,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <span
          className="mt-8 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: exemplo.tema.acento, color: tintaSobre(exemplo.tema.acento) }}
        >
          Agendar horário
        </span>
      </div>
      <div className="flex gap-1.5 px-4 py-3">
        {nichos.map((item, posicao) => (
          <button
            key={item.slug}
            type="button"
            aria-label={`Ver ${item.nome}`}
            onClick={() => setIndice(posicao)}
            className="h-1.5 flex-1 rounded-full transition"
            style={{ background: posicao === indice ? "#F97316" : "#E2E8F0" }}
          />
        ))}
      </div>
    </div>
  );
}
