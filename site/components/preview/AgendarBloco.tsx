"use client";

import { useEffect, useMemo, useState } from "react";
import { minutosDeRotulo } from "@/lib/estudio/aplicar";
import {
  intervalosDoDia,
  intervalosDoProfissional,
  normalizarAgendaPro,
  normalizarPassoMinutos,
  slotsNecessarios,
  type AgendaProVisual,
} from "@/lib/estudio/expediente";

type Servico = { id?: string; nome?: string; preco_label?: string; duracao_label?: string; duracao_minutos?: number };
type Pro = { id?: string; nome?: string; cargo?: string; whatsapp?: string };
type Expediente = { dia: string; label?: string; intervalos: string[] };
type Canal = "email" | "telefone";
type SessaoLocal = {
  token: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  expiraEm: string;
};

function chaveSessao(siteId: string) {
  return `guix-agendar-sessao:${siteId}`;
}

function lerSessao(siteId?: string): SessaoLocal | null {
  if (!siteId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(chaveSessao(siteId));
    if (!raw) return null;
    const s = JSON.parse(raw) as SessaoLocal;
    if (!s?.token || !s.expiraEm || new Date(s.expiraEm).getTime() < Date.now()) {
      localStorage.removeItem(chaveSessao(siteId));
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function salvarSessao(siteId: string, s: SessaoLocal) {
  localStorage.setItem(chaveSessao(siteId), JSON.stringify(s));
}

const campo =
  "mt-1.5 w-full rounded-xl border bg-transparent px-3 py-2.5 shadow-sm outline-none transition focus:ring-2";
const chipBase = "rounded-full border px-3 py-1.5 text-sm shadow-sm transition";

export function AgendarBloco({
  titulo,
  subtitulo,
  servicos,
  profissionais,
  expediente,
  agendaEquipe,
  duracaoSlotMinutos,
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
  /** Passo da grade (ex.: 30). */
  duracaoSlotMinutos?: number;
  whatsapp?: string;
  emailNegocio?: string;
  negocioNome?: string;
  siteId?: string;
  nicho?: string;
  fechado?: string;
  studio?: boolean;
}) {
  const passo = normalizarPassoMinutos(duracaoSlotMinutos);
  const listaSrv = servicos.filter((s) => s.nome);
  const listaPro = profissionais.filter((p) => p.nome && p.nome !== "Sem preferência");
  const [servico, setServico] = useState(listaSrv[0]?.nome || "");
  const [pro, setPro] = useState(listaPro[0]?.nome || "Sem preferência");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [canal, setCanal] = useState<Canal>("email");
  const [codigo, setCodigo] = useState("");
  const [passoCadastro, setPassoCadastro] = useState<"dados" | "codigo">("dados");
  const [destinoMask, setDestinoMask] = useState("");
  const [sessao, setSessao] = useState<SessaoLocal | null>(null);
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [cancelUrl, setCancelUrl] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    setSessao(lerSessao(siteId));
  }, [siteId]);

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

  const duracaoServicoMin = useMemo(() => {
    const s = listaSrv.find((x) => x.nome === servico);
    if (!s) return passo;
    return Number(s.duracao_minutos) || minutosDeRotulo(s.duracao_label) || passo;
  }, [listaSrv, servico, passo]);

  const slots = useMemo(() => {
    if (!disponibilidade.slots) return null;
    const livres = disponibilidade.slots.filter((h) => !ocupados.includes(h));
    const precisa = slotsNecessarios(duracaoServicoMin, passo);
    if (precisa <= 1) return livres;
    const ordem = disponibilidade.slots;
    return livres.filter((h) => {
      const idx = ordem.indexOf(h);
      if (idx < 0) return false;
      for (let k = 0; k < precisa; k++) {
        const slot = ordem[idx + k];
        if (!slot || ocupados.includes(slot)) return false;
        if (k > 0) {
          // slots devem ser consecutivos no passo
          const prev = ordem[idx + k - 1];
          const [ph, pm] = prev.split(":").map(Number);
          const [ch, cm] = slot.split(":").map(Number);
          if (ch * 60 + cm - (ph * 60 + pm) !== passo) return false;
        }
      }
      return true;
    });
  }, [disponibilidade.slots, ocupados, duracaoServicoMin, passo]);

  const hoje = new Date().toISOString().slice(0, 10);
  const verificado = Boolean(sessao?.token) || Boolean(studio);

  useEffect(() => {
    if (!data || !siteId || studio || !verificado) {
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
  }, [data, pro, siteId, studio, verificado]);

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

  const podePedirCodigo = nomeValido() && emailValido() && telValido() && !enviando;
  const podeConfirmarCodigo = codigo.replace(/\D/g, "").length === 6 && !enviando;
  const podeEnviar = Boolean(servico && data && hora && sessao?.token && !enviando);

  const estiloBorda = (ativo: boolean) => ({
    borderColor: ativo ? "var(--a)" : "color-mix(in srgb, var(--tx) 14%, transparent)",
    background: ativo ? "color-mix(in srgb, var(--a) 18%, transparent)" : "transparent",
  });

  async function pedirCodigo() {
    if (studio) {
      setPassoCadastro("codigo");
      setDestinoMask(canal === "email" ? email.trim() : tel.trim());
      setAviso("Na prévia o código não é enviado. No site publicado, o cliente confirma e-mail ou WhatsApp.");
      return;
    }
    if (!podePedirCodigo || !siteId) return;
    setEnviando(true);
    setAviso("");
    try {
      const res = await fetch("/api/agendamentos/cliente/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          nomeCompleto: nomeCompleto.trim(),
          email: email.trim(),
          telefone: tel.trim(),
          canal,
          negocioNome: negocioNome || "Negócio",
        }),
      });
      const j = (await res.json()) as { erro?: string; destinoMascarado?: string; aviso?: string; canal?: Canal };
      if (!res.ok) {
        setAviso(j.erro || "Não foi possível enviar o código.");
        return;
      }
      if (j.canal === "email" || j.canal === "telefone") setCanal(j.canal);
      setDestinoMask(j.destinoMascarado || "");
      setPassoCadastro("codigo");
      setAviso(j.aviso || `Código enviado para ${j.destinoMascarado || "seu contato"}.`);
    } catch {
      setAviso("Falha de rede. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCodigo() {
    if (studio) {
      setSessao({
        token: "studio",
        nomeCompleto: nomeCompleto.trim() || "Cliente demonstração",
        email: email.trim() || "cliente@exemplo.com",
        telefone: tel.trim() || "79999990000",
        expiraEm: new Date(Date.now() + 86400000).toISOString(),
      });
      setAviso("Cadastro liberado na prévia. No site publicado, o código precisa ser confirmado.");
      return;
    }
    if (!podeConfirmarCodigo || !siteId) return;
    setEnviando(true);
    setAviso("");
    try {
      const res = await fetch("/api/agendamentos/cliente/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          email: email.trim(),
          telefone: tel.trim(),
          canal,
          codigo,
        }),
      });
      const j = (await res.json()) as {
        erro?: string;
        sessaoToken?: string;
        nomeCompleto?: string;
        email?: string;
        telefone?: string;
        expiraEm?: string;
      };
      if (!res.ok || !j.sessaoToken) {
        setAviso(j.erro || "Código inválido.");
        return;
      }
      const nova: SessaoLocal = {
        token: j.sessaoToken,
        nomeCompleto: j.nomeCompleto || nomeCompleto.trim(),
        email: j.email || email.trim(),
        telefone: j.telefone || tel.trim(),
        expiraEm: j.expiraEm || new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      salvarSessao(siteId, nova);
      setSessao(nova);
      setAviso("Identidade confirmada. Agora escolha o horário.");
    } catch {
      setAviso("Falha de rede. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function sairCadastro() {
    if (siteId) localStorage.removeItem(chaveSessao(siteId));
    setSessao(null);
    setPassoCadastro("dados");
    setCodigo("");
    setAviso("");
    setHora("");
    setData("");
  }

  async function enviar() {
    if (studio || !podeEnviar || !siteId || !sessao) return;
    setEnviando(true);
    setAviso("");
    setCancelUrl("");
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          sessaoToken: sessao.token,
          nicho,
          servico,
          profissional: pro,
          data,
          hora,
          negocioNome: negocioNome || "Negócio",
          negocioWhatsapp: whatsapp || "",
          negocioEmail: emailNegocio || "",
          observacao: observacao.trim(),
        }),
      });
      const j = (await res.json()) as {
        erro?: string;
        codigo?: string;
        cancelUrl?: string;
        whatsappUrl?: string;
        aviso?: string;
      };
      if (!res.ok) {
        if (j.codigo === "SEM_SESSAO") {
          sairCadastro();
          setAviso("Sua confirmação expirou. Cadastre-se de novo.");
          return;
        }
        setAviso(j.erro || "Não foi possível agendar.");
        return;
      }
      setCancelUrl(j.cancelUrl || "");
      setOcupados((lista) => [...lista, hora]);
      setAviso(
        j.aviso ||
          "Solicitação enviada. O horário fica reservado até o profissional confirmar. Acompanhe pelo link.",
      );
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
      <h2 className="text-3xl font-bold md:text-4xl">{titulo || "Solicitar horário"}</h2>
      <p className="mt-3 text-sm" style={{ color: "var(--mt)" }}>
        {subtitulo ||
          "Confirme seu contato, escolha o profissional e o horário. A marcação só vale depois que o profissional confirmar."}
      </p>

      <div
        className="gx-agendar-card mt-8 space-y-6 rounded-2xl border p-5 shadow-[0_22px_48px_-28px_rgba(15,23,42,0.45)] sm:p-6"
        style={{ borderColor: "color-mix(in srgb, var(--tx) 12%, transparent)", background: "var(--sf)" }}
      >
        {!verificado || (studio && !sessao) ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
                00 · Cadastro do cliente
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--mt)" }}>
                Sem confirmação de contato, o agendamento fica bloqueado.
              </p>
            </div>

            {passoCadastro === "dados" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm sm:col-span-2">
                    Nome completo *
                    <input
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className={campo}
                      style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
                      placeholder="Nome e sobrenome"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block text-sm">
                    E-mail *
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={campo}
                      style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
                      placeholder="seu@email.com"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block text-sm">
                    Telefone / WhatsApp *
                    <input
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      className={campo}
                      style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
                      placeholder="79 99999-0000"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
                    Confirmar por
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className={chipBase} style={estiloBorda(canal === "email")} onClick={() => setCanal("email")}>
                      E-mail
                    </button>
                    <button type="button" className={chipBase} style={estiloBorda(canal === "telefone")} onClick={() => setCanal("telefone")}>
                      SMS / telefone
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void pedirCodigo()}
                  disabled={!podePedirCodigo && !studio}
                  className="w-full rounded-full px-5 py-3 text-sm font-semibold shadow-md disabled:opacity-40"
                  style={{ background: "var(--a)", color: "var(--bg)" }}
                >
                  {enviando ? "Enviando código…" : "Enviar código de verificação"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm" style={{ color: "var(--mt)" }}>
                  Digite o código de 6 dígitos enviado para <strong style={{ color: "var(--tx)" }}>{destinoMask || "seu contato"}</strong>.
                </p>
                <label className="block text-sm">
                  Código *
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`${campo} tracking-[0.35em]`}
                    style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void confirmarCodigo()}
                    disabled={!podeConfirmarCodigo && !studio}
                    className="flex-1 rounded-full px-5 py-3 text-sm font-semibold shadow-md disabled:opacity-40"
                    style={{ background: "var(--a)", color: "var(--bg)" }}
                  >
                    {enviando ? "Confirmando…" : "Confirmar e liberar agenda"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border px-4 py-3 text-sm"
                    style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
                    onClick={() => {
                      setPassoCadastro("dados");
                      setCodigo("");
                      setAviso("");
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 shadow-sm"
              style={{ borderColor: "color-mix(in srgb, var(--a) 35%, transparent)", background: "color-mix(in srgb, var(--a) 10%, transparent)" }}
            >
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{sessao?.nomeCompleto || nomeCompleto}</p>
                <p className="truncate text-xs" style={{ color: "var(--mt)" }}>
                  {sessao?.email || email} · {sessao?.telefone || tel}
                </p>
              </div>
              {!studio ? (
                <button type="button" className="text-xs font-medium underline" style={{ color: "var(--a)" }} onClick={sairCadastro}>
                  Trocar cadastro
                </button>
              ) : null}
            </div>

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
                    className="rounded-xl border px-3 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5"
                    style={estiloBorda(servico === s.nome)}
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
                  className={chipBase}
                  style={estiloBorda(pro === "Sem preferência")}
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
                    className={chipBase}
                    style={estiloBorda(pro === p.nome)}
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
                  className={campo}
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
                        className="rounded-lg border px-2 py-2 text-sm shadow-sm transition"
                        style={estiloBorda(hora === h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
                05 · Observação para o profissional
              </span>
              <textarea
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value.slice(0, 280))}
                placeholder="Ex.: preferência de horário, alergia, primeira visita…"
                className={campo}
                style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}
              />
            </label>

            <button
              type="button"
              onClick={() => void enviar()}
              disabled={!podeEnviar || studio}
              className="w-full rounded-full px-5 py-3 text-sm font-semibold shadow-md disabled:opacity-40"
              style={{ background: "var(--a)", color: "var(--bg)" }}
            >
              {enviando
                ? "Enviando solicitação…"
                : studio
                  ? "Solicitar (ativo no site publicado)"
                  : "Solicitar horário ao profissional"}
            </button>
            <p className="text-xs" style={{ color: "var(--mt)" }}>
              O profissional recebe horário e seus dados e responde (aceitar ou recusar). Enquanto estiver pendente, o
              horário fica reservado. Depois de confirmado, desmarque pelo link até 3 horas antes.
            </p>
          </>
        )}

        {aviso ? (
          <p className="rounded-xl border px-3 py-2 text-sm shadow-sm" style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}>
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
