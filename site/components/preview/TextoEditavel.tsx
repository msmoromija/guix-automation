"use client";

import { useEffect, useRef } from "react";

type Tag = "p" | "h1" | "h2" | "h3" | "span" | "dt";

export function TextoEditavel({
  as = "p",
  valor,
  campo,
  onTexto,
  className,
  style,
  multiline,
}: {
  as?: Tag;
  valor?: string;
  campo: string;
  onTexto?: (campo: string, valor: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const focado = useRef(false);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el || focado.current) return;
    const texto = valor || "";
    if ((el.textContent || "") !== texto) el.textContent = texto;
  }, [valor]);

  if (!onTexto) {
    return (
      <Tag className={className} style={style}>
        {valor}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement>}
      className={`${className || ""} cursor-text rounded-sm outline-none hover:outline hover:outline-1 hover:outline-white/60 focus:outline focus:outline-2 focus:outline-[var(--a)]`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Editar texto"
      spellCheck
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onFocus={() => {
        focado.current = true;
      }}
      onBlur={(e) => {
        focado.current = false;
        const next = (e.currentTarget.textContent || "").replace(/\s+/g, " ").trim();
        if (next && next !== (valor || "")) onTexto(campo, next);
        else e.currentTarget.textContent = valor || "";
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    />
  );
}
