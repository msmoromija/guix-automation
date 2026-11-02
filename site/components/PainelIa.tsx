"use client";

import { useEffect, useRef, useState } from "react";

/** Um ciclo do vídeo de criação no tema claro: 9,80s. Todas as seções usam esse tempo. */
const CICLO_MS = 9800;

const sequencia = [
  {
    tipo: "video" as const,
    src: "/midia/geracao-escura.mp4",
    etiqueta: "Criação com IA",
    nome: "Tema escuro",
    legenda: "A IA monta o site no tema escuro, até a página ficar pronta.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-barbearia.webp",
    etiqueta: "Modelo publicado",
    nome: "Barbearia Vila Norte",
    legenda: "Modelo de barbearia. O site no ar, com agenda e WhatsApp.",
  },
  {
    tipo: "video" as const,
    src: "/midia/geracao-clara.mp4",
    etiqueta: "Criação com IA",
    nome: "Tema claro",
    legenda: "A IA monta o site no tema claro, até a página ficar pronta.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-salao.webp",
    etiqueta: "Modelo publicado",
    nome: "Salão Vila Flor",
    legenda: "Modelo de salão de beleza. Corte, cor e unhas com hora marcada.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-estetica.webp",
    etiqueta: "Modelo publicado",
    nome: "Estúdio Serra Clara",
    legenda: "Modelo de estética. A sala fica reservada no horário marcado.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-petshop.webp",
    etiqueta: "Modelo publicado",
    nome: "Pet Shop Bento",
    legenda: "Modelo de pet shop. Banho e tosa com preço por porte.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-academia.webp",
    etiqueta: "Modelo publicado",
    nome: "Academia Farol",
    legenda: "Modelo de academia. Avaliação e aula, manhã e tarde separadas.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-contabilidade.webp",
    etiqueta: "Modelo publicado",
    nome: "Lima Contabilidade",
    legenda: "Modelo de contabilidade. A reunião com o contador tem hora.",
  },
  {
    tipo: "modelo" as const,
    src: "/midia/modelo-advocacia.webp",
    etiqueta: "Modelo publicado",
    nome: "Vale Luz Advogados",
    legenda: "Modelo de advocacia. A consulta tem dia e hora.",
  },
];

export function PainelIa() {
  const [indice, setIndice] = useState(0);
  const [reduzido, setReduzido] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fila = reduzido ? sequencia.filter((item) => item.tipo === "modelo") : sequencia;
  const atual = fila[indice] ?? fila[0];

  useEffect(() => {
    setReduzido(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    setIndice(0);
  }, [reduzido]);

  useEffect(() => {
    if (!atual) return;
    const timer = window.setTimeout(() => {
      setIndice((valor) => (valor + 1) % fila.length);
    }, CICLO_MS);
    return () => window.clearTimeout(timer);
  }, [atual, fila.length, indice]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [atual]);

  if (!atual) return null;

  return (
    <div className="rise rise-4 relative">
      <div className="absolute -inset-6 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_70%_0%,rgba(249,115,22,0.22),transparent_55%)] blur-2xl" />
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_80px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
          </div>
          <p className="truncate text-xs font-semibold text-ink">
            <span className="font-medium text-muted">{atual.etiqueta}</span>
            <span className="px-1.5 text-[#CBD5E1]">·</span>
            {atual.nome}
          </p>
        </div>
        <div className="relative aspect-[1400/780] bg-[#0c0f14]">
          {atual.tipo === "video" ? (
            <video
              key={atual.src}
              ref={videoRef}
              src={atual.src}
              muted
              playsInline
              autoPlay
              preload="auto"
              aria-label={atual.legenda}
              className="painel-troca absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              key={atual.src}
              src={atual.src}
              alt={atual.legenda}
              width={1400}
              height={780}
              className="painel-troca absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="h-0.5 bg-line">
          <div
            key={`${atual.src}-${indice}`}
            className="painel-progresso h-full bg-accent"
            style={{ animationDuration: `${CICLO_MS}ms` }}
          />
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
          <p className="text-sm font-medium leading-6 text-ink sm:text-[15px]" aria-live="polite">
            {atual.legenda}
          </p>
          <p className="shrink-0 pt-0.5 text-xs font-medium tabular-nums text-muted">
            {String(indice + 1).padStart(2, "0")}
            <span className="text-[#CBD5E1]"> / </span>
            {String(fila.length).padStart(2, "0")}
          </p>
        </div>
        <div className="flex justify-center gap-1.5 px-4 pb-4">
          {fila.map((item, posicao) => (
            <button
              key={`${item.src}-${posicao}`}
              type="button"
              aria-label={item.legenda}
              aria-current={posicao === indice ? "true" : undefined}
              onClick={() => setIndice(posicao)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: posicao === indice ? 22 : 8,
                background: posicao === indice ? "#F97316" : "#E2E8F0",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
