"use client";

import { useState } from "react";
import { LIMITE_PEDIDOS_IA } from "@/lib/estudio/pedido-fechado";

const AVISO_SALVAR =
  "Ao confirmar, o salvamento carrega o site no banco para aprovação em até 72 horas. Depois disso, a edição é com o suporte técnico. Tela nova, função nova ou mudança de estrutura é cotada à parte com o time de atendimento, no contato.";

export function PedidoIa({
  texto,
  onTexto,
  onEnviar,
  aviso,
  ocupado,
  fechado,
  onConfirmarFechar,
  onDesfazer,
  passosDesfazer = 0,
  usos = 0,
  onAnexarFoto,
  onAnexarLogo,
  linkSuporte,
}: {
  texto: string;
  onTexto: (v: string) => void;
  onEnviar: () => void;
  aviso?: string;
  ocupado?: boolean;
  fechado?: boolean;
  onConfirmarFechar?: () => void;
  onDesfazer?: () => void;
  passosDesfazer?: number;
  usos?: number;
  onAnexarFoto?: () => void;
  onAnexarLogo?: () => void;
  linkSuporte?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [mais, setMais] = useState(false);
  const noLimite = usos >= LIMITE_PEDIDOS_IA;
  const faltam = LIMITE_PEDIDOS_IA - usos;

  if (fechado) {
    return (
      <div className="bg-zinc-950 px-4 py-3 text-sm text-white">
        <p>{AVISO_SALVAR}</p>
        {linkSuporte ? (
          <a href={linkSuporte} className="mt-2 inline-block font-semibold text-orange-300 underline" target="_blank" rel="noreferrer">
            Falar com o time GuiX
          </a>
        ) : null}
      </div>
    );
  }

  if (confirmando) {
    return (
      <div className="bg-zinc-950 px-4 py-3 text-sm text-white">
        <p>
          {onConfirmarFechar
            ? AVISO_SALVAR
            : "No link de teste, Fechar alteração grava o site no banco para aprovação em até 72 horas. Depois, a edição é com o suporte técnico. Tela nova, função nova ou mudança de estrutura é cotada à parte com o atendimento."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {onConfirmarFechar ? (
            <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950" onClick={() => onConfirmarFechar()}>
              Confirmar encerramento
            </button>
          ) : null}
          <button type="button" className="rounded-full border border-white/20 px-4 py-2 text-sm" onClick={() => setConfirmando(false)}>
            Continuar editando
          </button>
          {linkSuporte ? (
            <a href={linkSuporte} className="rounded-full px-4 py-2 text-sm text-orange-300 underline" target="_blank" rel="noreferrer">
              Falar com o time GuiX
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      className="bg-zinc-950 px-3 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!noLimite) onEnviar();
      }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 shadow-lg">
        <textarea
          value={texto}
          onChange={(e) => onTexto(e.target.value.slice(0, 900))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!noLimite && texto.trim().length >= 3 && !ocupado) onEnviar();
            }
          }}
          placeholder={
            noLimite
              ? "Limite de alterações deste teste"
              : "Mande no motor: FAQ, eventos, textos, equipe, visual, fotos… Ex.: preencha campos vazios e crie 3 eventos"
          }
          disabled={ocupado || noLimite}
          maxLength={900}
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-60"
        />
        <div className="mt-1 flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-label="Mais opções"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/80 hover:bg-white/10"
              onClick={() => setMais((v) => !v)}
            >
              +
            </button>
            {mais ? (
              <div className="absolute bottom-10 left-0 z-10 w-48 rounded-xl border border-white/10 bg-zinc-800 p-1 text-sm text-white shadow-xl">
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                  onClick={() => {
                    setMais(false);
                    onAnexarFoto?.();
                  }}
                >
                  Trocar foto da capa
                </button>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                  onClick={() => {
                    setMais(false);
                    onAnexarLogo?.();
                  }}
                >
                  Trocar logo
                </button>
              </div>
            ) : null}
          </div>
          <span className={`text-xs ${ocupado ? "animate-pulse text-orange-300" : "text-emerald-300/90"}`}>
            {ocupado ? "OpenAI · aplicando…" : "OpenAI · motor liberado"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={!onDesfazer || passosDesfazer < 1 || ocupado}
              onClick={() => onDesfazer?.()}
              className="rounded-full px-2 py-1 text-xs text-white/70 disabled:opacity-30"
            >
              Desfazer{passosDesfazer > 0 ? ` ${passosDesfazer}` : ""}
            </button>
            <button
              type="submit"
              disabled={ocupado || noLimite || texto.trim().length < 3}
              aria-label="Enviar alteração"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950 disabled:opacity-30"
            >
              {ocupado ? "…" : "↑"}
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-white/50">
        <span>
          {usos} de {LIMITE_PEDIDOS_IA}
          {faltam > 0 && faltam <= 2 ? ` · faltam ${faltam}` : ""}
        </span>
        <button type="button" className="underline" onClick={() => setConfirmando(true)}>
          Fechar alteração
        </button>
        {noLimite && linkSuporte ? (
          <a href={linkSuporte} className="text-orange-300 underline" target="_blank" rel="noreferrer">
            Falar com o time GuiX
          </a>
        ) : null}
      </div>
      {aviso ? <p className="mx-auto mt-1 max-w-3xl px-1 text-xs text-amber-200">{aviso}</p> : null}
    </form>
  );
}
