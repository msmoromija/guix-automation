"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sugestoes } from "@/lib/estudio/corretor-pt";

type Tag = "p" | "h1" | "h2" | "h3" | "span" | "dt";

const ignoradas = new Set<string>();

type Dica = { palavra: string; opcoes: string[]; inicio: number; fim: number; top: number; left: number };

function palavraNoCursor(node: Text, offset: number) {
  const text = node.textContent || "";
  let i = Math.min(offset, text.length);
  if (i > 0 && !/\p{L}/u.test(text[i] || "") && /\p{L}/u.test(text[i - 1] || "")) i -= 1;
  let a = i;
  let b = i;
  while (a > 0 && /\p{L}/u.test(text[a - 1] || "")) a--;
  while (b < text.length && /\p{L}/u.test(text[b] || "")) b++;
  const palavra = text.slice(a, b);
  if (!palavra) return null;
  return { palavra, inicio: a, fim: b };
}

function lerTexto(el: HTMLElement, multiline?: boolean) {
  if (!multiline) return (el.textContent || "").replace(/\s+/g, " ").trim();
  return (el.innerText || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function TextoEditavel({
  as = "p",
  valor,
  campo,
  onTexto,
  className,
  style,
  multiline,
  corretor = true,
}: {
  as?: Tag;
  valor?: string;
  campo: string;
  onTexto?: (campo: string, valor: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  corretor?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const focado = useRef(false);
  const [dica, setDica] = useState<Dica | null>(null);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el || focado.current) return;
    const texto = valor || "";
    if ((el.textContent || "") !== texto) el.textContent = texto;
  }, [valor]);

  useEffect(() => {
    if (!onTexto || !corretor) return;
    const atualizar = () => {
      const el = ref.current;
      const sel = window.getSelection();
      if (!el || !focado.current || document.activeElement !== el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) {
        setDica(null);
        return;
      }
      if (sel.anchorNode.nodeType !== Node.TEXT_NODE) {
        setDica(null);
        return;
      }
      const achou = palavraNoCursor(sel.anchorNode as Text, sel.anchorOffset);
      if (!achou || ignoradas.has(achou.palavra.toLocaleLowerCase("pt-BR"))) {
        setDica(null);
        return;
      }
      const opcoes = sugestoes(achou.palavra).filter((s) => s !== achou.palavra);
      if (!opcoes.length) {
        setDica(null);
        return;
      }
      const range = document.createRange();
      range.setStart(sel.anchorNode, achou.inicio);
      range.setEnd(sel.anchorNode, achou.fim);
      const rect = range.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 280));
      setDica({ ...achou, opcoes, top: rect.bottom + 6, left });
    };
    document.addEventListener("selectionchange", atualizar);
    return () => document.removeEventListener("selectionchange", atualizar);
  }, [onTexto, corretor]);

  if (!onTexto) {
    return (
      <Tag className={className} style={style}>
        {valor}
      </Tag>
    );
  }

  function aplicarSugestao(opcao: string) {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel?.anchorNode || !dica || sel.anchorNode.nodeType !== Node.TEXT_NODE) return;
    const node = sel.anchorNode as Text;
    const text = node.textContent || "";
    node.textContent = text.slice(0, dica.inicio) + opcao + text.slice(dica.fim);
    const pos = dica.inicio + opcao.length;
    const range = document.createRange();
    range.setStart(node, Math.min(pos, node.textContent?.length || 0));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    setDica(null);
  }

  function inserir(texto: string) {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(texto);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  return (
    <span className={`group/ed relative ${as === "span" ? "inline" : "block"}`}>
      <Tag
        ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement>}
        className={`${className || ""} cursor-text rounded-sm outline-none hover:outline hover:outline-1 hover:outline-white/70 focus:outline focus:outline-2 focus:outline-[var(--a)] ${multiline ? "whitespace-pre-wrap" : ""}`}
        style={style}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Editar texto"
        lang="pt-BR"
        spellCheck={corretor}
        autoCapitalize="sentences"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onFocus={() => {
          focado.current = true;
        }}
        onBlur={(e) => {
          focado.current = false;
          setDica(null);
          const next = lerTexto(e.currentTarget, multiline);
          if (next && next !== (valor || "")) onTexto(campo, next);
          else e.currentTarget.textContent = valor || "";
        }}
        onPaste={(e) => {
          e.preventDefault();
          const texto = e.clipboardData.getData("text/plain");
          if (texto) inserir(multiline ? texto : texto.replace(/\s+/g, " "));
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          if (!multiline) {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
            return;
          }
          e.preventDefault();
          inserir("\n");
        }}
      />
      <button
        type="button"
        data-editar=""
        className="absolute -top-2 right-0 hidden rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover/ed:inline"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          ref.current?.focus();
        }}
      >
        editar
      </button>
      {dica && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[80] flex max-w-[280px] items-center gap-1 rounded-full bg-zinc-950 px-2 py-1 text-xs text-white shadow-lg"
              style={{ top: dica.top, left: dica.left }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="px-1 text-[10px] uppercase tracking-wide text-zinc-400">Corretor</span>
              {dica.opcoes.map((opcao) => (
                <button key={opcao} type="button" className="rounded-full bg-white px-2 py-0.5 font-semibold text-zinc-950" onClick={() => aplicarSugestao(opcao)}>
                  {opcao}
                </button>
              ))}
              <button
                type="button"
                className="px-1 text-zinc-400"
                onClick={() => {
                  ignoradas.add(dica.palavra.toLocaleLowerCase("pt-BR"));
                  setDica(null);
                }}
              >
                Ignorar
              </button>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
