"use client";

import type { ReactNode } from "react";

export function SecaoColapsavel({
  id,
  titulo,
  resumo,
  aberto,
  onToggle,
  children,
  destaque,
}: {
  id: string;
  titulo: string;
  /** Texto curto quando fechado (ex.: WhatsApp preenchido). */
  resumo?: string;
  aberto: boolean;
  onToggle: () => void;
  children: ReactNode;
  destaque?: boolean;
}) {
  return (
    <div
      id={id}
      className={`gx-acordeao gx-form-card ${aberto ? "is-open" : ""} ${destaque ? "gx-acordeao--destaque" : ""}`}
    >
      <button
        type="button"
        className="gx-acordeao__cabeca"
        aria-expanded={aberto}
        aria-controls={`${id}-corpo`}
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="gx-acordeao__titulo">{titulo}</span>
          {!aberto && resumo ? <span className="gx-acordeao__resumo">{resumo}</span> : null}
        </span>
        <span className="gx-acordeao__chev" aria-hidden>
          {aberto ? "▴" : "▾"}
        </span>
      </button>
      {aberto ? (
        <div id={`${id}-corpo`} className="gx-acordeao__corpo">
          {children}
        </div>
      ) : null}
    </div>
  );
}
