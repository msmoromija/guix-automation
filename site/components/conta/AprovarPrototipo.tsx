"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Canal = "email" | "sms" | "whatsapp";

export function AprovarPrototipo({
  token,
  nome,
  emailInicial,
  telefoneInicial,
  jaAprovado,
  prazoIntegracao,
  contratarUrl,
  extratoUrl,
  compacto,
}: {
  token: string;
  nome: string;
  emailInicial?: string;
  telefoneInicial?: string;
  jaAprovado?: boolean;
  prazoIntegracao?: string;
  contratarUrl: string;
  extratoUrl: string;
  compacto?: boolean;
}) {
  const [email, setEmail] = useState(emailInicial || "");
  const [telefone, setTelefone] = useState(telefoneInicial || "");
  const [canais, setCanais] = useState<Canal[]>(["email", "whatsapp"]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [waManual, setWaManual] = useState("");
  const [aprovado, setAprovado] = useState(Boolean(jaAprovado));
  const [prazo, setPrazo] = useState(prazoIntegracao || "");

  const qs = useMemo(() => `t=${encodeURIComponent(token)}`, [token]);

  function toggleCanal(c: Canal) {
    setCanais((lista) => (lista.includes(c) ? lista.filter((x) => x !== c) : [...lista, c]));
  }

  async function aprovar() {
    if (!canais.length) {
      setErro("Escolha ao menos um canal para receber o token.");
      return;
    }
    setLoading(true);
    setErro("");
    setOk("");
    setWaManual("");
    try {
      const res = await fetch(`/api/prototipo/${token}?${qs}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprovar: true, email, telefone, canais }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || j.aviso || "Não aprovou.");
        return;
      }
      setAprovado(true);
      setPrazo(j.prazoIntegracao || "");
      const falhas = Object.entries(j.envios || {})
        .filter(([, v]) => v && typeof v === "object" && !(v as { ok?: boolean }).ok)
        .map(([k, v]) => `${k}: ${(v as { motivo?: string }).motivo || "falhou"}`);
      setOk(
        falhas.length
          ? `Rascunho fechado. Token ${token} guardado. Alguns envios falharam (${falhas.join("; ")}). Use os botões abaixo — a publicação só começa depois da compra.`
          : `Rascunho fechado e token enviado. Guarde o código. A publicação no domínio só começa depois que você contratar.`,
      );
      const wa = (j.envios?.whatsapp as { waMe?: string } | undefined)?.waMe;
      if (wa) setWaManual(wa);
    } catch {
      setErro("Falha de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={`rounded-2xl border border-line bg-white ${compacto ? "p-4" : "p-5"}`}>
      <h2 className="font-semibold">{aprovado ? "Rascunho fechado" : "Fechar o rascunho (opcional)"}</h2>
      <p className="mt-2 text-sm text-muted">
        {aprovado
          ? "Você fechou o teste e guardou o token. Isso ainda não publica no domínio — o próximo passo é contratar."
          : `Fecha o ciclo de edição de ${nome || "seu site"} e envia o token por e-mail/WhatsApp. Não substitui a compra: domínio e e-mail só saem depois do pagamento.`}
      </p>

      {!aprovado ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-muted">
            E-mail para receber o token
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Celular (SMS / WhatsApp)
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="79 99999-0000"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["email", "E-mail"],
                ["sms", "SMS"],
                ["whatsapp", "WhatsApp"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleCanal(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  canais.includes(id) ? "bg-ink text-white" : "border border-line"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void aprovar()}
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Salvando…" : "Fechar rascunho e enviar token"}
          </button>
          <p className="text-xs text-muted">
            Quer publicar de uma vez?{" "}
            <Link href={contratarUrl} className="font-semibold text-accent underline">
              Ir para comprar e publicar
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl bg-canvas px-3 py-2 text-sm">
            Token: <strong className="font-mono tracking-wide">{token}</strong>
          </p>
          {prazo ? (
            <p className="text-xs text-muted">
              Referência de prazo (após a compra): {new Date(prazo).toLocaleString("pt-BR")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              href={contratarUrl}
              className="rounded-full bg-orange-400 px-4 py-2 text-xs font-semibold text-slate-950"
            >
              Comprar e publicar
            </Link>
            <Link href={extratoUrl} className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
              Baixar PDF
            </Link>
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold"
              onClick={() => void navigator.clipboard.writeText(token)}
            >
              Copiar token
            </button>
          </div>
          {!jaAprovado ? (
            <button type="button" className="text-xs text-accent underline" disabled={loading} onClick={() => void aprovar()}>
              Reenviar token
            </button>
          ) : null}
        </div>
      )}

      {ok ? <p className="mt-3 text-sm text-emerald-900">{ok}</p> : null}
      {erro ? <p className="mt-3 text-sm text-rose-700">{erro}</p> : null}
      {waManual ? (
        <a href={waManual} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-accent underline">
          Abrir WhatsApp com o token
        </a>
      ) : null}
    </article>
  );
}
