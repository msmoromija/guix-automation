"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InboxSolicitacoes } from "@/components/conta/InboxSolicitacoes";
import { GradeExpediente } from "@/components/estudio/GradeExpediente";
import {
  agendaProParaExpediente,
  agendaProParaVisual,
  expedienteParaSchema,
  normalizarDiaExpediente,
  resumoDoExpediente,
  schemaParaExpediente,
  type AusenciaPro,
  type DiaExpediente,
} from "@/lib/estudio/expediente";
import type { VisualConfig } from "@/lib/estudio/visual";

const campo =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15";

type ProLinha = {
  nome: string;
  cargo: string;
  expediente: DiaExpediente[];
  ausencias: AusenciaPro[];
};

function carregarPros(
  site: Record<string, unknown>,
  visual: VisualConfig | undefined,
  casa: DiaExpediente[],
): ProLinha[] {
  const bloco = (site.profissionais || {}) as { itens?: Array<{ nome?: string; cargo?: string }> };
  const itens = Array.isArray(bloco.itens) ? bloco.itens : [];
  const agendas = visual?.agendaEquipe || [];
  const nomes = itens
    .map((p) => String(p.nome || "").trim())
    .filter((n) => n && n.toLowerCase() !== "sem preferência");

  if (!nomes.length && agendas.length) {
    return agendas.map((a) => ({
      nome: a.nome,
      cargo: "",
      expediente: agendaProParaExpediente({
        nome: a.nome,
        dias: (a.dias || []).map((d) =>
          typeof d === "string"
            ? { dia: d as DiaExpediente["dia"], inicio: a.inicio || "09:00", fim: a.fim || "18:00" }
            : {
                dia: d.dia as DiaExpediente["dia"],
                inicio: d.inicio,
                fim: d.fim,
                pausa: d.pausa,
                pausaInicio: d.pausaInicio,
                pausaFim: d.pausaFim,
              },
        ),
        ausencias: a.ausencias,
      }),
      ausencias: (a.ausencias || []).map((u) => ({ ...u })),
    }));
  }

  return nomes.map((nome, i) => {
    const cargo = String(itens[i]?.cargo || "");
    const agenda = agendas.find((a) => a.nome.trim().toLowerCase() === nome.toLowerCase());
    if (agenda) {
      return {
        nome,
        cargo,
        expediente: agendaProParaExpediente({
          nome: agenda.nome,
          dias: (agenda.dias || []).map((d) =>
            typeof d === "string"
              ? { dia: d as DiaExpediente["dia"], inicio: agenda.inicio || "09:00", fim: agenda.fim || "18:00" }
              : {
                  dia: d.dia as DiaExpediente["dia"],
                  inicio: d.inicio,
                  fim: d.fim,
                  pausa: d.pausa,
                  pausaInicio: d.pausaInicio,
                  pausaFim: d.pausaFim,
                },
          ),
          ausencias: agenda.ausencias,
        }),
        ausencias: (agenda.ausencias || []).map((u) => ({ ...u })),
      };
    }
    return {
      nome,
      cargo,
      expediente: casa.map((d) => normalizarDiaExpediente(d)),
      ausencias: [],
    };
  });
}

export function EditorAgenda({ id, token }: { id: string; token: string }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [fechado, setFechado] = useState(false);
  const [expediente, setExpediente] = useState<DiaExpediente[]>([]);
  const [pros, setPros] = useState<ProLinha[]>([]);
  const [proAberto, setProAberto] = useState(0);
  const [aba, setAba] = useState<"grade" | "solicitacoes">("solicitacoes");

  const qs = useMemo(() => `t=${encodeURIComponent(token)}`, [token]);

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch(`/api/prototipo/${id}/conteudo?${qs}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Não foi possível abrir a agenda.");
        return;
      }
      const site = (json.site || {}) as Record<string, unknown>;
      const visual = json.visual as VisualConfig | undefined;
      const emp = (site.empresa || {}) as { nome?: string; expediente?: Array<{ dia: string; label?: string; intervalos?: string[] }> };
      const casa = schemaParaExpediente(emp.expediente);
      setEmpresa(emp.nome || "");
      setExpediente(casa);
      setPros(carregarPros(site, visual, casa));
      setFechado(Boolean(json.edicaoFechada));
      setProAberto(0);
    } catch {
      setErro("Falha de rede ao carregar a agenda.");
    } finally {
      setCarregando(false);
    }
  }, [id, qs]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function salvar() {
    setOk("");
    setErro("");
    setSalvando(true);
    try {
      const agendaEquipe = pros
        .filter((p) => p.nome.trim())
        .map((p) => agendaProParaVisual(p.nome, p.expediente, p.ausencias));
      const res = await fetch(`/api/prototipo/${id}?${qs}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          somenteAgenda: true,
          expediente: expedienteParaSchema(expediente),
          agendaEquipe,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || json.aviso || "Não salvou.");
        return;
      }
      if (json.aviso && json.edicaoFechada) {
        setFechado(true);
        setErro(json.aviso);
        return;
      }
      if (json.visual) {
        const emp = ((json.site || {}).empresa || {}) as {
          expediente?: Array<{ dia: string; label?: string; intervalos?: string[] }>;
        };
        const casa = schemaParaExpediente(emp.expediente);
        setExpediente(casa);
        setPros(carregarPros(json.site || {}, json.visual, casa));
      }
      setOk("Agenda atualizada. O site de agendamento já usa estes horários.");
    } catch {
      setErro("Falha de rede ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo agenda…</main>;
  }

  if (erro && !expediente.length && !pros.length) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Agenda e horários</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <Link href={`/conta/${id}?${qs}`} className="mt-6 inline-flex text-sm font-semibold text-accent underline">
          Voltar à área do cliente
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">ÁREA DO CLIENTE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Agenda e horários</h1>
          <p className="mt-2 text-sm text-muted">
            {empresa || "Seu negócio"} · altere a rotina da casa e de cada profissional quando mudar.
          </p>
        </div>
        <Link href={`/conta/${id}?${qs}`} className="text-sm font-medium text-muted underline">
          Voltar
        </Link>
      </div>

      {fechado ? (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Edição do protótipo fechada. Para mudanças permanentes após a publicação, fale com o suporte GuiX.
        </p>
      ) : null}

      {erro ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</p> : null}
      {ok ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{ok}</p> : null}

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium ${aba === "solicitacoes" ? "bg-ink text-white" : "border border-line bg-white"}`}
          onClick={() => setAba("solicitacoes")}
        >
          Solicitações
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium ${aba === "grade" ? "bg-ink text-white" : "border border-line bg-white"}`}
          onClick={() => setAba("grade")}
        >
          Grade e ausências
        </button>
      </div>

      {aba === "solicitacoes" ? (
        <section className="gx-form-card mt-5 p-5 sm:p-6">
          <InboxSolicitacoes siteId={id} token={token} />
        </section>
      ) : null}

      {aba === "grade" ? (
      <>
      <section className="gx-form-card mt-5 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Horário da casa</h2>
        <p className="mt-1 text-sm text-muted">Dias e intervalos em que o negócio atende. Base do agendamento.</p>
        <div className="mt-4">
          <GradeExpediente
            atalhos
            value={expediente}
            onChange={setExpediente}
            vazio="Marque ao menos um dia em que a casa atende."
          />
        </div>
        <p className="mt-2 text-[11px] text-muted">{resumoDoExpediente(expediente)}</p>
      </section>

      <section className="gx-form-card mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Profissionais</h2>
            <p className="mt-1 text-sm text-muted">
              Cada pessoa tem grade e ausências próprias. O site só libera horários em que ela está disponível.
            </p>
          </div>
        </div>

        {pros.length === 0 ? (
          <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
            Ninguém cadastrado na equipe. O agendamento usa só o horário da casa (“Sem preferência”).
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {pros.map((p, i) => (
                <button
                  key={`tab-${p.nome}-${i}`}
                  type="button"
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    proAberto === i ? "bg-ink text-white" : "border border-line bg-white text-ink"
                  }`}
                  onClick={() => setProAberto(i)}
                >
                  {p.nome}
                </button>
              ))}
            </div>

            {pros.map((p, i) =>
              i === proAberto ? (
                <article key={`pro-panel-${i}`} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{p.nome}</p>
                      {p.cargo ? <p className="text-xs text-muted">{p.cargo}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-accent underline"
                      onClick={() =>
                        setPros((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, expediente: expediente.map((d) => normalizarDiaExpediente(d)) } : r,
                          ),
                        )
                      }
                    >
                      Copiar horário da casa
                    </button>
                  </div>

                  <div className="mt-4">
                    <GradeExpediente
                      atalhos
                      detalheAberto
                      vazio="Marque os dias em que esta pessoa atende."
                      value={p.expediente}
                      onChange={(prox) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, expediente: prox } : r)))}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{resumoDoExpediente(p.expediente)}</p>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Ausências</p>
                        <p className="mt-1 text-xs text-muted">Férias, folga, consulta — bloqueiam esta pessoa no site.</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium"
                        disabled={p.ausencias.length >= 24}
                        onClick={() =>
                          setPros((rows) =>
                            rows.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    ausencias: [...r.ausencias, { de: "", ate: "", motivo: "Ausente" }],
                                  }
                                : r,
                            ),
                          )
                        }
                      >
                        Incluir ausência
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {p.ausencias.length === 0 ? (
                        <p className="rounded-xl bg-canvas px-3 py-2 text-xs text-muted">Nenhuma ausência cadastrada.</p>
                      ) : null}
                      {p.ausencias.map((a, ai) => (
                        <div key={`aus-${i}-${ai}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
                          <label className="block text-xs font-medium text-muted">
                            De
                            <input
                              type="date"
                              className={campo}
                              value={a.de}
                              onChange={(e) =>
                                setPros((rows) =>
                                  rows.map((r, j) =>
                                    j === i
                                      ? {
                                          ...r,
                                          ausencias: r.ausencias.map((x, k) =>
                                            k === ai ? { ...x, de: e.target.value, ate: x.ate || e.target.value } : x,
                                          ),
                                        }
                                      : r,
                                  ),
                                )
                              }
                            />
                          </label>
                          <label className="block text-xs font-medium text-muted">
                            Até
                            <input
                              type="date"
                              className={campo}
                              value={a.ate || a.de}
                              min={a.de || undefined}
                              onChange={(e) =>
                                setPros((rows) =>
                                  rows.map((r, j) =>
                                    j === i
                                      ? {
                                          ...r,
                                          ausencias: r.ausencias.map((x, k) =>
                                            k === ai ? { ...x, ate: e.target.value } : x,
                                          ),
                                        }
                                      : r,
                                  ),
                                )
                              }
                            />
                          </label>
                          <label className="block text-xs font-medium text-muted sm:col-span-2">
                            Motivo
                            <input
                              className={campo}
                              value={a.motivo}
                              placeholder="Ex.: férias · folga · consulta"
                              onChange={(e) =>
                                setPros((rows) =>
                                  rows.map((r, j) =>
                                    j === i
                                      ? {
                                          ...r,
                                          ausencias: r.ausencias.map((x, k) =>
                                            k === ai ? { ...x, motivo: e.target.value } : x,
                                          ),
                                        }
                                      : r,
                                  ),
                                )
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="text-xs text-muted"
                            onClick={() =>
                              setPros((rows) =>
                                rows.map((r, j) =>
                                  j === i ? { ...r, ausencias: r.ausencias.filter((_, k) => k !== ai) } : r,
                                ),
                              )
                            }
                          >
                            Remover ausência
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ) : null,
            )}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={salvando || fechado}
          onClick={() => void salvar()}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar agenda"}
        </button>
        <Link
          href={`/visualizar/${id}#agendar`}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium"
        >
          Ver agendamento no site
        </Link>
      </div>
      </>
      ) : null}
    </main>
  );
}
