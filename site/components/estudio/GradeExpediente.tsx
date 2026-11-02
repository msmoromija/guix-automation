"use client";

import { aplicarAlmocoNosAbertos, type DiaExpediente } from "@/lib/estudio/expediente";

const campoHora = "rounded-lg border border-line bg-white px-2 py-1.5 text-sm disabled:opacity-40";

export function GradeExpediente({
  value,
  onChange,
  compacto,
}: {
  value: DiaExpediente[];
  onChange: (prox: DiaExpediente[]) => void;
  compacto?: boolean;
}) {
  const algumAberto = value.some((d) => d.aberto);
  const almocoPadrao = value.filter((d) => d.aberto).every((d) => d.pausa);

  function patch(dia: string, parcial: Partial<DiaExpediente>) {
    onChange(value.map((d) => (d.dia === dia ? { ...d, ...parcial } : d)));
  }

  return (
    <div className="space-y-2">
      {algumAberto ? (
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={almocoPadrao}
              onChange={(e) => onChange(aplicarAlmocoNosAbertos(value, e.target.checked))}
            />
            Pausa para almoço nos dias abertos (12h–13h)
          </label>
        </div>
      ) : null}
      {value.map((dia, i) => (
        <div
          key={dia.dia}
          className={`gx-dia-row rounded-xl border border-line bg-white/80 px-3 py-2.5 transition ${
            dia.aberto ? "shadow-sm" : "opacity-80"
          }`}
          style={{ animationDelay: `${0.04 + i * 0.045}s` }}
        >
          <div className={`grid items-center gap-2 ${compacto ? "grid-cols-[auto_1fr_auto_auto]" : "grid-cols-[auto_minmax(4.5rem,1fr)_auto_auto] sm:gap-3"}`}>
            <input
              type="checkbox"
              checked={dia.aberto}
              onChange={(e) => patch(dia.dia, { aberto: e.target.checked, pausa: e.target.checked ? dia.pausa : false })}
              aria-label={`${dia.label} aberto`}
            />
            <span className={`text-sm ${dia.aberto ? "font-medium text-ink" : "text-muted"}`}>{dia.label}</span>
            <input
              type="time"
              className={campoHora}
              value={dia.inicio}
              disabled={!dia.aberto}
              onChange={(e) => patch(dia.dia, { inicio: e.target.value })}
              aria-label={`${dia.label} início`}
            />
            <input
              type="time"
              className={campoHora}
              value={dia.fim}
              disabled={!dia.aberto}
              onChange={(e) => patch(dia.dia, { fim: e.target.value })}
              aria-label={`${dia.label} fim`}
            />
          </div>
          {dia.aberto ? (
            <div
              className={`gx-almoco mt-2 grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-lg border border-dashed px-2 py-2 sm:gap-3 ${
                dia.pausa ? "border-accent/35 bg-orange-50/60" : "border-line/80 bg-slate-50/40"
              }`}
            >
              <input
                type="checkbox"
                checked={dia.pausa}
                onChange={(e) => patch(dia.dia, { pausa: e.target.checked })}
                aria-label={`${dia.label} pausa almoço`}
              />
              <span className={`text-xs ${dia.pausa ? "font-medium text-ink" : "text-muted"}`}>Almoço</span>
              <input
                type="time"
                className={campoHora}
                value={dia.pausaInicio}
                disabled={!dia.pausa}
                onChange={(e) => patch(dia.dia, { pausaInicio: e.target.value })}
                aria-label={`${dia.label} início almoço`}
              />
              <input
                type="time"
                className={campoHora}
                value={dia.pausaFim}
                disabled={!dia.pausa}
                onChange={(e) => patch(dia.dia, { pausaFim: e.target.value })}
                aria-label={`${dia.label} fim almoço`}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
