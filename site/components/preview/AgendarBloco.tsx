"use client";

import { useEffect, useMemo, useState } from "react";
import {
  intervalosDoDia,
  intervalosDoProfissional,
  normalizarAgendaPro,
  type AgendaProVisual,
} from "@/lib/estudio/expediente";

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
  emailNegocio,
  negocioNome,
  siteId,
  nicho,
  fechado,
  studio,
}: {
  titulo?: string;
  subtitulo?: string;
  servicos: Servico[];
  profissionais: Pro[];
  expediente: Expediente[];
  agendaEquipe?: Array<{
    nome: string;
    dias: Array<string | { dia: string; inicio?: string; fim?: string }>;
    inicio?: string;
    fim?: string;
    ausencias?: Array<{ de: string; ate: string; motivo: string }>;
  }>;
  whatsapp?: string;
  emailNegocio?: string;
  negocioNome?: string;
  siteId?: string;
  nicho?: string;
  fechado?: string;
  studio?: boolean;
}) {
  const listaSrv = servicos.filter((s) => s.nome);
  const listaPro = profissionais.filter((p) => p.nome && p.nome !== "Sem preferência");
  const [servico, setServico] = useState(listaSrv[0]?.nome || "");
  const [pro, setPro] = useState(listaPro[0]?.nome || "Sem preferência");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [cancelUrl, setCancelUrl] = useState("");

  const agendas = useMemo(() => {
    const map = new Map<string, AgendaProVisual>();
    for (const a of agendaEquipe || []) {
      if (!a.nome) continue;
      map.set(a.nome, normalizarAgendaPro(a));
    }
    return map;
  }, [agendaEquipe]);

  const disponibilidade = useMemo(() => {
    if (!data) return { slots: null as string[] | null, motivo: "" };
    if (!pro || pro === "Sem preferência") {
      const base = intervalosDoDia(expediente, data);
      return { slots: base, motivo: base ? "" : fechado || "Fechado neste dia." };
    }
    const agenda = agendas.get(pro);
    const r = intervalosDoProfissional(expediente, agenda, data);
    return { slots: r.slots, motivo: r.motivo || fechado || "Fechado neste dia." };
  }, [data, expediente, pro, agendas, fechado]);

  const slots = useMemo(() => {
    if (!disponibilidade.slots) return null;
    return disponibilidade.slots.filter((h) => !ocupados.includes(h));
  }, [disponibilidade.slots, ocupados]);

  const hoje = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!data || !siteId || studio) {
      setOcupados([]);
      return;
    }
    let cancelado = false;
    void fetch(
      `/api/agendamentos?siteId=${encodeURIComponent(siteId)}&data=${encodeURIComponent(data)}&profissional=${encodeURIComponent(pro)}`,
    )
      .then((r) => r.json())
      .then((j: { ocupados?: Array<{ hora: string }> }) => {
        if (cancelado) return;
        setOcupados((j.ocupados || []).map((o) => o.hora));
      })
      .catch(() => {
        if (!cancelado) setOcupados([]);
      });
    return () => {
      cancelado = true;
    };
  }, [data, pro, siteId, studio]);

  function nomeValido() {
    const n = nomeCompleto.replace(/\s+/g, " ").trim();
    return n.length >= 5 && n.includes(" ");
  }

  function emailValido() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function telValido() {
    const d = tel.replace(/\D/g, "");
    return d.length === 10 || d.length === 11 || (d.startsWith("55") && d.length >= 12 && d.length <= 13);
  }

  const podeEnviar = Boolean(servico && data && hora && nomeValido() && emailValido() && telValido() && !enviando);

  async function enviar() {
    if (studio || !podeEnviar) return;
    setEnviando(true);
    setAviso("");
    setCancelUrl("");
    try {
      if (!siteId) {
        // Prévia sem token: só monta o WhatsApp (modo demo).
        const digitos = String(whatsapp || "").replace(/\D/g, "");
        if (!digitos || /^(55)?79999990000$/.test(digitos)) {
          setAviso("Informe o WhatsApp do negócio para confirmar.");
          return;
        }
        const msg = [
          `Olá! Quero agendar.`,
          `Serviço: ${servico}`,
          `Profissional: ${pro}`,
          `Dia: ${data.split("-").reverse().join("/")}`,
          `Horário: ${hora}`,
          `Nome: ${nomeCompleto.trim()}`,
          `E-mail: ${email.trim()}`,
          `Telefone: ${tel.trim()}`,
        ].join("\n");
        window.open(`https://wa.me/${digitos}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
        setAviso("Pedido enviado pelo WhatsApp (prévia sem link de cancelamento).");
        return;
      }

      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          nicho,
          servico,
          profissional: pro,
          data,
          hora,
          nomeCompleto: nomeCompleto.trim(),
          email: email.trim(),
          telefone: tel.trim(),
          negocioNome: negocioNome || "Negócio",
          negocioWhatsapp: whatsapp || "",
          negocioEmail: emailNegocio || "",
        }),
      });
      const j = (await res.json()) as {
        erro?: string;
        cancelUrl?: string;
        whatsappUrl?: string;
        aviso?: string;
      };
      if (!res.ok) {
        setAviso(j.erro || "Não foi possível agendar.");
        return;
      }
      setCancelUrl(j.cancelUrl || "");
      setOcupados((lista) => [...lista, hora]);
      setAviso(j.aviso || "Horário marcado. Guarde o link para desmarcar (até 3h antes).");
      if (j.whatsappUrl) window.open(j.whatsappUrl, "_blank", "noopener,noreferrer");
      setHora("");
    } catch {
      setAviso("Falha de rede. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!listaSrv.length) return null;

  return (
    <section id="agendar" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h2 className="text-3xl font-bold md:text-4xl">{titulo || "Agendar horário"}</h2>
      <p className="mt-3 text-sm" style={{ color: "var(--mt)" }}>
        {subtitulo || "Escolha o serviço, quem atende e um horário. Nome completo, e-mail e telefone são obrigatórios. Dá para desmarcar até 3 horas antes."}
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
              onClick={() => {
                setPro("Sem preferência");
                setHora("");
              }}
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
                onClick={() => {
                  setPro(p.nome || "");
                  setHora("");
                }}
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
                {disponibilidade.motivo || fechado || "Fechado neste dia."}
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--mt)" }}>
                Sem horários livres neste dia.
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
          <label className="block text-sm sm:col-span-2">
            Nome completo *
            <input
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
              placeholder="Nome e sobrenome"
              autoComplete="name"
              required
            />
          </label>
          <label className="block text-sm">
            E-mail *
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm">
            Telefone / WhatsApp *
            <input
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              className="mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
              placeholder="79 99999-0000"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void enviar()}
          disabled={!podeEnviar || studio}
          className="w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
          style={{ background: "var(--a)", color: "var(--bg)" }}
        >
          {enviando ? "Confirmando…" : studio ? "Confirmar (ativo no site publicado)" : "Confirmar agendamento"}
        </button>
        <p className="text-xs" style={{ color: "var(--mt)" }}>
          Sem nome completo, e-mail e telefone o horário não é marcado. Desmarque pelo link até 3 horas antes.
        </p>
        {aviso ? (
          <p className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}>
            {aviso}
            {cancelUrl ? (
              <>
                {" "}
                <a href={cancelUrl} className="underline" style={{ color: "var(--a)" }}>
                  Link para desmarcar
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
