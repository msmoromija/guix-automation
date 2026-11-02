"use client";

import { useMemo, useState } from "react";
import { intervalosDoDia } from "@/lib/estudio/expediente";

type Servico = { id?: string; nome?: string; preco_label?: string; duracao_label?: string };
type Pro = { id?: string; nome?: string; cargo?: string; whatsapp?: string };
type Expediente = { dia: string; label?: string; intervalos: string[] };

export function AgendarBloco({
  titulo,
  subtitulo,
  servicos,
  profissionais,
  expediente,
  agendaEquipe,
  whatsapp,
  fechado,
  studio,
}: {
  titulo?: string;
  subtitulo?: string;
  servicos: Servico[];
  profissionais: Pro[];
  expediente: Expediente[];
  agendaEquipe?: Array<{ nome: string; dias: string[] }>;
  whatsapp?: string;
  fechado?: string;
  studio?: boolean;
}) {
  const listaSrv = servicos.filter((s) => s.nome);
  const listaPro = profissionais.filter((p) => p.nome && p.nome !== "Sem preferência");
  const [servico, setServico] = useState(listaSrv[0]?.nome || "");
  const [pro, setPro] = useState(listaPro[0]?.nome || "Sem preferência");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");

  const slots = useMemo(() => {
    if (!data) return null;
    const base = intervalosDoDia(expediente, data);
    if (!base) return null;
    if (!pro || pro === "Sem preferência" || !agendaEquipe?.length) return base;
    const agenda = agendaEquipe.find((a) => a.nome === pro);
    if (!agenda?.dias?.length) return base;
    const js = new Date(Number(data.slice(0, 4)), Number(data.slice(5, 7)) - 1, Number(data.slice(8, 10))).getDay();
    const mapa = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    return agenda.dias.includes(mapa[js] || "") ? base : null;
  }, [data, expediente, pro, agendaEquipe]);
  const hoje = new Date().toISOString().slice(0, 10);

  function enviar() {
    if (studio) return;
    const escolhido = listaPro.find((p) => p.nome === pro);
    const digitosPro = String(escolhido?.whatsapp || "").replace(/\D/g, "");
    const digitosCasa = String(whatsapp || "").replace(/\D/g, "");
    const digitos = digitosPro || digitosCasa;
    if (!digitos || /^(55)?79999990000$/.test(digitos)) return;
    const msg = [
      `Olá! Quero agendar.`,
      servico ? `Serviço: ${servico}` : "",
      pro ? `Profissional: ${pro}` : "",
      data ? `Dia: ${data.split("-").reverse().join("/")}` : "",
      hora ? `Horário: ${hora}` : "",
      nome ? `Nome: ${nome}` : "",
      tel ? `Meu WhatsApp: ${tel}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/${digitos}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  if (!listaSrv.length) return null;

  return (
    <section id="agendar" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h2 className="text-3xl font-bold md:text-4xl">{titulo || "Agendar horário"}</h2>
      <p className="mt-3 text-sm" style={{ color: "var(--mt)" }}>
        {subtitulo || "Escolha o serviço, quem atende e um horário. A confirmação é pelo WhatsApp."}
      </p>
      <div className="mt-8 space-y-5 rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--tx) 12%, transparent)", background: "var(--sf)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
            01 · Serviço
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {listaSrv.map((s) => (
              <button
                key={s.id || s.nome}
                type="button"
                onClick={() => setServico(s.nome || "")}
                className="rounded-xl border px-3 py-3 text-left text-sm"
                style={{
                  borderColor: servico === s.nome ? "var(--a)" : "color-mix(in srgb, var(--tx) 14%, transparent)",
                  background: servico === s.nome ? "color-mix(in srgb, var(--a) 18%, transparent)" : "transparent",
                }}
              >
                <span className="font-medium">{s.nome}</span>
                <span className="mt-1 block text-xs" style={{ color: "var(--mt)" }}>
                  {[s.duracao_label, s.preco_label].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
            02 · Profissional
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPro("Sem preferência")}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: pro === "Sem preferência" ? "var(--a)" : "color-mix(in srgb, var(--tx) 14%, transparent)",
                background: pro === "Sem preferência" ? "color-mix(in srgb, var(--a) 18%, transparent)" : "transparent",
              }}
            >
              Sem preferência
            </button>
            {listaPro.map((p) => (
              <button
                key={p.id || p.nome}
                type="button"
                onClick={() => setPro(p.nome || "")}
                className="rounded-full border px-3 py-1.5 text-sm"
                style={{
                  borderColor: pro === p.nome ? "var(--a)" : "color-mix(in srgb, var(--tx) 14%, transparent)",
                  background: pro === p.nome ? "color-mix(in srgb, var(--a) 18%, transparent)" : "transparent",
                }}
              >
                {p.nome}
                {p.cargo ? <span className="opacity-60"> · {p.cargo}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
              03 · Dia
            </span>
            <input
              type="date"
              min={hoje}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                setHora("");
              }}
              className="mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
            />
          </label>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
              04 · Horário
            </p>
            {!data ? (
              <p className="mt-3 text-sm" style={{ color: "var(--mt)" }}>
                Escolha o dia.
              </p>
            ) : !slots ? (
              <p className="mt-3 text-sm" style={{ color: "var(--mt)" }}>
                {fechado || "Fechado neste dia. Combine o horário no WhatsApp."}
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHora(h)}
                    className="rounded-lg border px-2 py-2 text-sm"
                    style={{
                      borderColor: hora === h ? "var(--a)" : "color-mix(in srgb, var(--tx) 14%, transparent)",
                      background: hora === h ? "color-mix(in srgb, var(--a) 18%, transparent)" : "transparent",
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Seu nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
              placeholder="Como te chamamos"
            />
          </label>
          <label className="block text-sm">
            Seu WhatsApp
            <input
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              className="mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
              placeholder="79 99999-0000"
              inputMode="tel"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={enviar}
          disabled={!servico || !data || !hora || !nome.trim() || !tel.trim()}
          className="w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
          style={{ background: "var(--a)", color: "var(--bg)" }}
        >
          Confirmar no WhatsApp
        </button>
      </div>
    </section>
  );
}
