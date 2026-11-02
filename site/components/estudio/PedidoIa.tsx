"use client";

export function PedidoIa({
  pedido,
  onPedido,
  onEnviar,
  aviso,
  ocupado,
  escrevendo,
}: {
  pedido: string;
  onPedido: (v: string) => void;
  onEnviar: () => void;
  aviso?: string;
  ocupado?: boolean;
  escrevendo?: boolean;
}) {
  return (
    <form
      className="border-t border-black/10 bg-white px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar();
      }}
    >
      <div className="flex items-center gap-2">
        <input
          value={pedido}
          onChange={(e) => onPedido(e.target.value)}
          placeholder={escrevendo ? "Escrevendo os textos do ofício…" : "Peça em texto: deixe a capa mais curta, fale do horário…"}
          className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={ocupado || pedido.trim().length < 3}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {ocupado ? "Ajustando…" : "Pedir"}
        </button>
      </div>
      {aviso ? <p className="mt-1 px-2 text-xs text-amber-800">{aviso}</p> : null}
      {escrevendo && !aviso ? <p className="mt-1 px-2 text-xs text-muted">A capa e o sobre estão sendo escritos com o nome e o ofício.</p> : null}
    </form>
  );
}
