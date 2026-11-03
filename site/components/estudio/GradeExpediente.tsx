"use client";

import { useState } from "react";
import {
  aplicarAlmocoNosAbertos,
  aplicarExpedienteNosAbertos,
  aplicarTurnoNosAbertos,
  horarioCompartilhado,
  type DiaExpediente,
} from "@/lib/estudio/expediente";

const hora =
  "h-10 w-[7.25rem] shrink-0 rounded-xl border border-line bg-white px-2.5 text-sm tabular-nums shadow-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-45";

export function GradeExpediente({
  value,
  onChange,
  compacto,
  detalheAberto,
  vazio = "Marque ao menos um dia em que atende.",
  atalhos,
}: {
  value: DiaExpediente[];
  onChange: (prox: DiaExpediente[]) => void;
  compacto?: boolean;
  /** Já abre o ajuste dia a dia (útil na grade do profissional). */
  detalheAberto?: boolean;
  vazio?: string;
  /** Mostra atalhos Manhã / Tarde / Integral / Noite. */
  atalhos?: boolean;
}) {
  const compartilhado = horarioCompartilhado(value);
  const algumAberto = value.some((d) => d.aberto);
  const precisaDetalhe = !compartilhado.homogeneo;
  const [detalhe, setDetalhe] = useState(Boolean(detalheAberto) || precisaDetalhe);
  const mostrarDetalhe = detalhe || precisaDetalhe;

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
      <div className="gx-grade-bloco">
        <div className="gx-grade-bloco__head">
          <p className="gx-grade-bloco__titulo">Dias da semana</p>
          <p className="gx-grade-bloco__hint">Toque para abrir ou fechar</p>
        </div>
        <div className="gx-grade-semana" role="group" aria-label="Dias da semana">
          {value.map((dia) => (
            <button
              key={dia.dia}
              type="button"
              className={`gx-dia-chip ${dia.aberto ? "is-on" : ""}`}
              aria-pressed={dia.aberto}
              onClick={() => toggleDia(dia)}
            >
              <span className="gx-dia-chip__curto">{dia.label.slice(0, 3)}</span>
              <span className="gx-dia-chip__longo">{dia.label}</span>
            </button>
          ))}
        </div>
      </div>

      {algumAberto ? (
        <>
          <div className="gx-grade-bloco">
            <div className="gx-grade-bloco__head gx-grade-bloco__head--row">
              <div>
                <p className="gx-grade-bloco__titulo">Expediente</p>
                <p className="gx-grade-bloco__hint">Vale para todos os dias abertos</p>
              </div>
              {atalhos ? (
                <div className="gx-grade-atalhos" role="group" aria-label="Atalhos de turno">
                  {(
                    [
                      ["manha", "Manhã"],
                      ["tarde", "Tarde"],
                      ["integral", "Integral"],
                      ["noite", "Noite"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="gx-grade-atalho"
                      onClick={() => onChange(aplicarTurnoNosAbertos(value, id))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="gx-grade-horas gx-grade-horas--principal">
              <label className="gx-grade-campo">
                <span>Entra</span>
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
                <span>Sai</span>
                <input
                  type="time"
                  className={hora}
                  value={compartilhado.fim}
                  onChange={(e) => onChange(aplicarExpedienteNosAbertos(value, compartilhado.inicio, e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className={`gx-grade-bloco gx-grade-bloco--almoco ${compartilhado.pausa ? "is-on" : ""}`}>
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
            {compartilhado.pausa ? (
              <div className="gx-grade-horas gx-grade-horas--principal">
                <label className="gx-grade-campo">
                  <span>Começa</span>
                  <input
                    type="time"
                    className={hora}
                    value={compartilhado.pausaInicio}
                    onChange={(e) => onChange(aplicarAlmocoNosAbertos(value, true, e.target.value, compartilhado.pausaFim))}
                  />
                </label>
                <span className="gx-grade-sep" aria-hidden>
                  →
                </span>
                <label className="gx-grade-campo">
                  <span>Termina</span>
                  <input
                    type="time"
                    className={hora}
                    value={compartilhado.pausaFim}
                    onChange={(e) => onChange(aplicarAlmocoNosAbertos(value, true, compartilhado.pausaInicio, e.target.value))}
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="gx-grade-detalhe">
            <button
              type="button"
              className="gx-grade-detalhe__btn"
              aria-expanded={mostrarDetalhe}
              onClick={() => setDetalhe((v) => !v)}
            >
              {mostrarDetalhe ? "Ocultar ajuste por dia" : "Ajustar um dia diferente"}
              <span aria-hidden>{mostrarDetalhe ? "▴" : "▾"}</span>
            </button>

            {mostrarDetalhe ? (
              <div className="gx-grade-tabela" role="list">
                {value.map((dia) => (
                  <div
                    key={dia.dia}
                    role="listitem"
                    className={`gx-grade-dia-card ${dia.aberto ? "is-on" : ""}`}
                  >
                    <div className="gx-grade-dia-card__topo">
                      <label className="gx-grade-dia-check">
                        <input type="checkbox" checked={dia.aberto} onChange={() => toggleDia(dia)} />
                        <span>{dia.label}</span>
                      </label>
                      {!dia.aberto ? <span className="gx-grade-fechado">Fechado</span> : null}
                    </div>

                    {dia.aberto ? (
                      <div className="gx-grade-dia-card__corpo">
                        <div className="gx-grade-dia-card__linha">
                          <span className="gx-grade-dia-card__rotulo">Trabalha</span>
                          <div className="gx-grade-horas gx-grade-horas--mini">
                            <input
                              type="time"
                              className={hora}
                              value={dia.inicio}
                              onChange={(e) => patch(dia.dia, { inicio: e.target.value })}
                              aria-label={`${dia.label} entra`}
                            />
                            <span className="gx-grade-sep" aria-hidden>
                              →
                            </span>
                            <input
                              type="time"
                              className={hora}
                              value={dia.fim}
                              onChange={(e) => patch(dia.dia, { fim: e.target.value })}
                              aria-label={`${dia.label} sai`}
                            />
                          </div>
                        </div>

                        <div className="gx-grade-dia-card__linha">
                          <label className="gx-grade-mini-almoco">
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
                          {dia.pausa ? (
                            <div className="gx-grade-horas gx-grade-horas--mini">
                              <input
                                type="time"
                                className={hora}
                                value={dia.pausaInicio}
                                onChange={(e) => patch(dia.dia, { pausaInicio: e.target.value })}
                                aria-label={`${dia.label} almoço começa`}
                              />
                              <span className="gx-grade-sep" aria-hidden>
                                →
                              </span>
                              <input
                                type="time"
                                className={hora}
                                value={dia.pausaFim}
                                onChange={(e) => patch(dia.dia, { pausaFim: e.target.value })}
                                aria-label={`${dia.label} almoço termina`}
                              />
                            </div>
                          ) : (
                            <span className="gx-grade-dia-card__sem">Sem pausa</span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <p className="gx-grade-vazio">{vazio}</p>
      )}
    </div>
  );
}
