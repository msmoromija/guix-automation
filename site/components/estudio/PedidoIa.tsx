"use client";

import { ALVOS_PEDIDO, type AlvoPedido } from "@/lib/estudio/pedido-fechado";

export function PedidoIa({
  alvo,
  onAlvo,
  texto,
  onTexto,
  onEnviar,
  aviso,
  ocupado,
}: {
  alvo: AlvoPedido | "";
  onAlvo: (v: AlvoPedido) => void;
  texto: string;
  onTexto: (v: string) => void;
  onEnviar: () => void;
  aviso?: string;
  ocupado?: boolean;
}) {
  const dica = ALVOS_PEDIDO.find((a) => a.id === alvo)?.exemplo || "Escolha um bloco";
  return (
    <form
      className="border-t border-black/10 bg-white px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {ALVOS_PEDIDO.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onAlvo(item.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${alvo === item.id ? "bg-ink text-white" : "border border-line text-ink"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          value={texto}
          onChange={(e) => onTexto(e.target.value.slice(0, 80))}
          placeholder={dica}
          disabled={!alvo || ocupado}
          maxLength={80}
          className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={ocupado || !alvo || texto.trim().length < 3}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {ocupado ? "Aplicando…" : "Aplicar"}
        </button>
      </div>
      <p className="mt-1 px-1 text-[11px] text-muted">Só esse bloco. Até 80 caracteres. Cor, foto e telefone não entram aqui.</p>
      {aviso ? <p className="mt-1 px-1 text-xs text-amber-800">{aviso}</p> : null}
    </form>
  );
}
