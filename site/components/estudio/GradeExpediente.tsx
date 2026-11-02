"use client";

import { useState } from "react";
import {
  aplicarAlmocoNosAbertos,
  aplicarExpedienteNosAbertos,
  horarioCompartilhado,
  type DiaExpediente,
} from "@/lib/estudio/expediente";

const hora =
  "h-9 w-[6.4rem] rounded-lg border border-line bg-white px-2 text-sm tabular-nums shadow-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-45";

export function GradeExpediente({
  value,
  onChange,
  compacto,
}: {
  value: DiaExpediente[];
  onChange: (prox: DiaExpediente[]) => void;
  compacto?: boolean;
}) {
  const [detalhe, setDetalhe] = useState(false);
  const compartilhado = horarioCompartilhado(value);
  const algumAberto = value.some((d) => d.aberto);
  const precisaDetalhe = !compartilhado.homogeneo;

  function patch(dia: string, parcial: Partial<DiaExpediente>) {
    onChange(value.map((d) => (d.dia === dia ? { ...d, ...parcial } : d)));
  }

  function toggleDia(dia: DiaExpediente) {
    const abrir = !dia.aberto;
    patch(dia.dia, {
      aberto: abrir,
      inicio: compartilhado.inicio,
      fim: compartilhado.fim,
      pausa: abrir ? compartilhado.pausa : false,
      pausaInicio: compartilhado.pausaInicio,
      pausaFim: compartilhado.pausaFim,
    });
  }

  return (
    <div className={`gx-grade-exp ${compacto ? "gx-grade-exp--compacto" : ""}`}>
      <div className="gx-grade-dias" role="group" aria-label="Dias da semana">
        {value.map((dia, i) => (
          <button
            key={dia.dia}
            type="button"
            className={`gx-dia-chip ${dia.aberto ? "is-on" : ""}`}
            style={{ animationDelay: `${0.03 + i * 0.035}s` }}
            aria-pressed={dia.aberto}
            onClick={() => toggleDia(dia)}
          >
            <span className="gx-dia-chip__dot" aria-hidden />
            {compacto ? dia.label.slice(0, 3) : dia.label}
          </button>
        ))}
      </div>

      {algumAberto ? (
        <div className="gx-grade-painel">
          <div className="gx-grade-linha">
            <span className="gx-grade-rotulo">Expediente</span>
            <div className="gx-grade-horas">
              <label className="gx-grade-campo">
                <span>Abre</span>
                <input
                  type="time"
                  className={hora}
                  value={compartilhado.inicio}
                  onChange={(e) => onChange(aplicarExpedienteNosAbertos(value, e.target.value, compartilhado.fim))}
                />
              </label>
              <span className="gx-grade-sep" aria-hidden>
                →
              </span>
              <label className="gx-grade-campo">
                <span>Fecha</span>
                <input
                  type="time"
                  className={hora}
                  value={compartilhado.fim}
                  onChange={(e) => onChange(aplicarExpedienteNosAbertos(value, compartilhado.inicio, e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className={`gx-grade-almoco ${compartilhado.pausa ? "is-on" : ""}`}>
            <label className="gx-grade-toggle">
              <input
                type="checkbox"
                checked={compartilhado.pausa}
                onChange={(e) =>
                  onChange(
                    aplicarAlmocoNosAbertos(value, e.target.checked, compartilhado.pausaInicio, compartilhado.pausaFim),
                  )
                }
              />
              <span>
                <strong>Pausa para almoço</strong>
                <em>O agendar não oferece horários neste intervalo</em>
              </span>
            </label>
            <div className={`gx-grade-horas gx-grade-horas--almoco ${compartilhado.pausa ? "is-visivel" : ""}`}>
              <label className="gx-grade-campo">
                <span>Início</span>
                <input
                  type="time"
                  className={hora}
                  value={compartilhado.pausaInicio}
                  disabled={!compartilhado.pausa}
                  onChange={(e) => onChange(aplicarAlmocoNosAbertos(value, true, e.target.value, compartilhado.pausaFim))}
                />
              </label>
              <span className="gx-grade-sep" aria-hidden>
                →
              </span>
              <label className="gx-grade-campo">
                <span>Fim</span>
                <input
                  type="time"
                  className={hora}
                  value={compartilhado.pausaFim}
                  disabled={!compartilhado.pausa}
                  onChange={(e) => onChange(aplicarAlmocoNosAbertos(value, true, compartilhado.pausaInicio, e.target.value))}
                />
              </label>
            </div>
          </div>

          {!compacto || precisaDetalhe ? (
            <div className="gx-grade-detalhe">
              <button
                type="button"
                className="gx-grade-detalhe__btn"
                aria-expanded={detalhe || precisaDetalhe}
                onClick={() => setDetalhe((v) => !v)}
              >
                {detalhe || precisaDetalhe ? "Ocultar ajuste por dia" : "Ajustar um dia diferente"}
                <span aria-hidden>{detalhe || precisaDetalhe ? "▴" : "▾"}</span>
              </button>

              {detalhe || precisaDetalhe ? (
                <div className="gx-grade-tabela" role="list">
                  {value.map((dia) => (
                    <div
                      key={dia.dia}
                      role="listitem"
                      className={`gx-grade-linha-dia ${dia.aberto ? "is-on" : ""}`}
                    >
                      <label className="gx-grade-dia-check">
                        <input type="checkbox" checked={dia.aberto} onChange={() => toggleDia(dia)} />
                        <span>{dia.label}</span>
                      </label>
                      <div className="gx-grade-horas gx-grade-horas--mini">
                        <input
                          type="time"
                          className={hora}
                          value={dia.inicio}
                          disabled={!dia.aberto}
                          onChange={(e) => patch(dia.dia, { inicio: e.target.value })}
                          aria-label={`${dia.label} início`}
                        />
                        <span className="gx-grade-sep" aria-hidden>
                          –
                        </span>
                        <input
                          type="time"
                          className={hora}
                          value={dia.fim}
                          disabled={!dia.aberto}
                          onChange={(e) => patch(dia.dia, { fim: e.target.value })}
                          aria-label={`${dia.label} fim`}
                        />
                      </div>
                      {dia.aberto ? (
                        <label className="gx-grade-mini-almoco" title="Almoço neste dia">
                          <input
                            type="checkbox"
                            checked={dia.pausa}
                            onChange={(e) =>
                              patch(dia.dia, {
                                pausa: e.target.checked,
                                pausaInicio: dia.pausaInicio || compartilhado.pausaInicio,
                                pausaFim: dia.pausaFim || compartilhado.pausaFim,
                              })
                            }
                          />
                          <span>Almoço</span>
                        </label>
                      ) : (
                        <span className="gx-grade-fechado">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="gx-grade-vazio">Marque ao menos um dia em que a casa atende.</p>
      )}
    </div>
  );
}
