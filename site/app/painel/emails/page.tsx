"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatusEmail = "pendente" | "aguardando_verificacao" | "em_configuracao" | "configurado" | "erro";

type Integracoes = {
  zoho: { configurado: boolean; pendentes: string[] };
  vercel: { configurado: boolean; pendentes: string[] };
  cloudflare: { configurado: boolean; pendentes: string[] };
  retomada: { configurado: boolean; pendentes: string[] };
};

type Projeto = {
  id: string;
  cliente: string;
  criadoEm: string;
  statusOrcamento: string;
  dataAprovacao: string | null;
  dominio: string;
  statusEmail: StatusEmail;
  ultimaExecucaoId: string | null;
  contas: string[];
};

type Passo = {
  chave: string;
  titulo: string;
  status: "ok" | "erro" | "aviso" | "pendente";
  detalhe?: string;
  em: string;
};

type Execucao = {
  id: string;
  projetoId: string;
  cliente: string;
  dominio: string;
  contas: string[];
  contatoTecnico?: { nome: string; email: string };
  verificacaoDominio?: {
    tipo: "TXT";
    nome: string;
    valor: string;
    expiraEm: string;
    verificadoEm?: string | null;
  };
  status: StatusEmail;
  usuario: string;
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string | null;
  passos: Passo[];
  contasCriadas: { email: string; criadoEm: string; zuid?: number }[];
  erro?: string | null;
};

/** Item do histórico (sem os passos — o detalhe vem por id). */
type ExecucaoResumo = {
  id: string;
  projetoId: string;
  cliente: string;
  dominio: string;
  status: StatusEmail;
  usuario: string;
  criadoEm: string;
  concluidoEm: string | null;
  contas: number;
};

/** Senha provisória registrada no log de criação da caixa, quando houver. */
function senhaDoPasso(p: Passo) {
  return p.detalhe?.match(/Senha provisória:\s*(\S+)/)?.[1] || "";
}

const SUGESTOES = ["contato", "comercial", "suporte", "financeiro", "admin"];
const MAX_CONTAS = 5;
const STORAGE_KEY = "guix.emails.login";

const ROTULO_STATUS: Record<StatusEmail, string> = {
  pendente: "Pendente",
  aguardando_verificacao: "Aguardando verificação",
  em_configuracao: "Em Configuração",
  configurado: "Configurado",
  erro: "Erro",
};

const ROTULO_ORCAMENTO: Record<string, string> = {
  aberto: "Aberto",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  cancelado: "Cancelado",
};

const CLASSE_ORCAMENTO: Record<string, string> = {
  aberto: "bg-canvas text-ink",
  aguardando_pagamento: "bg-amber-100 text-amber-900",
  pago: "bg-emerald-100 text-emerald-900",
  cancelado: "bg-rose-100 text-rose-900",
};

const CLASSE_STATUS: Record<StatusEmail, string> = {
  pendente: "bg-canvas text-ink",
  aguardando_verificacao: "bg-amber-100 text-amber-900",
  em_configuracao: "bg-amber-100 text-amber-900",
  configurado: "bg-emerald-100 text-emerald-900",
  erro: "bg-rose-100 text-rose-900",
};

const ICONE_PASSO: Record<Passo["status"], string> = {
  ok: "✅",
  erro: "❌",
  aviso: "⚠️",
  pendente: "⏳",
};

function dataCurta(valor?: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR");
}

function PainelEmails() {
  const sp = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") || "");
  const [senha, setSenha] = useState(sp.get("senha") || sp.get("token") || "");
  const [emailDigitado, setEmailDigitado] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  // Credenciais enviadas às rotas do módulo (login + senha de orçamentos).
  const credenciais = `email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`;

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [execucoes, setExecucoes] = useState<ExecucaoResumo[]>([]);
  const [integracoes, setIntegracoes] = useState<Integracoes | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroDominio, setFiltroDominio] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [selecionado, setSelecionado] = useState<Projeto | null>(null);
  const [dominio, setDominio] = useState("");
  const [prefixos, setPrefixos] = useState<string[]>(["contato", "comercial", "suporte"]);
  const [novoPrefixo, setNovoPrefixo] = useState("");
  const [disparando, setDisparando] = useState(false);
  const [continuando, setContinuando] = useState(false);

  const [exec, setExec] = useState<Execucao | null>(null);

  useEffect(() => {
    if (senha) return;
    try {
      const salvo = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null") as { email?: string; senha?: string } | null;
      if (salvo?.senha) {
        setEmail(salvo.email || "");
        setSenha(salvo.senha);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = useCallback(async () => {
    if (!senha) return;
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch(`/api/painel/emails?${credenciais}`);
      const j = await res.json();
      if (res.status === 401) {
        // Credenciais recusadas — volta ao login com o motivo.
        setErro(j.erro || "E-mail ou senha inválidos.");
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setSenha("");
        return;
      }
      if (!res.ok) {
        setErro(j.erro || "Falha ao carregar.");
        return;
      }
      setProjetos(j.projetos || []);
      setExecucoes(j.execucoes || []);
      setIntegracoes(j.integracoes || null);
    } catch {
      setErro("Não foi possível falar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }, [senha, credenciais]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Acompanha a execução; Vercel Cron retoma etapas que aguardam propagação DNS.
  const execId = exec?.id || "";
  const execRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (execId) execRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [execId]);
  useEffect(() => {
    if (!execId || !senha) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const res = await fetch(`/api/painel/emails/${execId}?${credenciais}`);
        const j = await res.json();
        if (!ativo) return;
        if (res.ok && j.execucao) {
          setExec(j.execucao);
          const rodando = j.execucao.status === "em_configuracao" && !j.execucao.concluidoEm;
          if (rodando) {
            timer = setTimeout(tick, 3000);
            return;
          }
          const propagacaoPendente =
            j.execucao.status === "em_configuracao" && Boolean(j.execucao.concluidoEm) && !j.execucao.erro;
          if (propagacaoPendente) {
            timer = setTimeout(tick, 10000);
            return;
          }
          void carregar();
          return;
        }
        if (res.status === 401) {
          setErro("A sessão expirou. Entre novamente para continuar acompanhando.");
          return;
        }
      } catch {
        /* Mantém o acompanhamento durante instabilidades curtas de rede. */
      }
      if (ativo) timer = setTimeout(tick, 6000);
    };
    timer = setTimeout(tick, 3000);
    return () => {
      ativo = false;
      if (timer) clearTimeout(timer);
    };
  }, [execId, credenciais, carregar]);

  const filtrados = useMemo(() => {
    const c = filtroCliente.trim().toLowerCase();
    const d = filtroDominio.trim().toLowerCase();
    return projetos.filter(
      (p) =>
        (!c || p.cliente.toLowerCase().includes(c)) &&
        (!d || p.dominio.toLowerCase().includes(d)) &&
        (!filtroStatus || p.statusEmail === filtroStatus),
    );
  }, [projetos, filtroCliente, filtroDominio, filtroStatus]);

  function entrar() {
    const e = emailDigitado.trim().toLowerCase();
    const s = senhaDigitada.trim();
    if (!e || !s) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: e, senha: s }));
    } catch {
      /* ignore */
    }
    setErro("");
    setEmail(e);
    setSenha(s);
  }

  function abrir(p: Projeto) {
    setOk("");
    setExec(null);
    setSelecionado(p);
    setDominio(p.dominio || "");
    const usados = p.contas.map((e) => e.split("@")[0]).filter(Boolean);
    setPrefixos(usados.length ? usados.slice(0, MAX_CONTAS) : ["contato", "comercial", "suporte"]);
    if (p.ultimaExecucaoId) void abrirExecucao(p.ultimaExecucaoId);
  }

  async function abrirExecucao(id: string) {
    if (!senha) return;
    try {
      const res = await fetch(`/api/painel/emails/${id}?${credenciais}`);
      const j = await res.json();
      if (res.ok && j.execucao) setExec(j.execucao);
    } catch {
      /* ignore */
    }
  }

  function alternarPrefixo(p: string) {
    setPrefixos((atual) => {
      if (atual.includes(p)) return atual.filter((x) => x !== p);
      if (atual.length >= MAX_CONTAS) return atual;
      return [...atual, p];
    });
  }

  function adicionarPrefixo() {
    const v = novoPrefixo.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!v || prefixos.includes(v) || prefixos.length >= MAX_CONTAS) return;
    setPrefixos((atual) => [...atual, v]);
    setNovoPrefixo("");
  }

  async function configurar() {
    if (!selecionado || !senha) return;
    setErro("");
    setOk("");
    if (
      !integracoes?.zoho.configurado ||
      !integracoes.vercel.configurado ||
      !integracoes.cloudflare.configurado
    ) {
      setErro("Antes de iniciar, configure Zoho Mail, Vercel e DNS (Cloudflare ou Vercel) no ambiente de produção.");
      return;
    }
    const dominioNormalizado = dominio
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
    if (!dominioNormalizado.includes(".")) {
      setErro("Informe um domínio válido, como cliente.com.br.");
      return;
    }
    const contas = prefixos.filter(Boolean).map((p) => `${p}@${dominioNormalizado}`);
    if (contas.length === 0) {
      setErro("Escolha pelo menos uma caixa de e-mail.");
      return;
    }
    setDominio(dominioNormalizado);
    setDisparando(true);
    try {
      const res = await fetch(`/api/painel/emails?${credenciais}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projetoId: selecionado.id, dominio: dominioNormalizado, contas, cliente: selecionado.cliente }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Falha ao iniciar a configuração.");
        return;
      }
      setOk("Provisionamento iniciado. DNS e verificações dos provedores serão configurados automaticamente.");
      await abrirExecucao(j.id);
    } catch {
      setErro("Não foi possível iniciar a configuração.");
    } finally {
      setDisparando(false);
    }
  }

  async function continuarExecucao(id: string) {
    if (!exec || !senha) return;
    setErro("");
    setContinuando(true);
    try {
      const res = await fetch(`/api/painel/emails/${id}/continuar?${credenciais}`, { method: "POST" });
      const j = await res.json();
      if (j.execucao) setExec(j.execucao);
      if (!res.ok) {
        setErro(j.erro || "Não foi possível retomar o provisionamento.");
        return;
      }
      setOk("Nova tentativa automática iniciada.");
    } catch {
      setErro("Não foi possível retomar o provisionamento agora.");
    } finally {
      setContinuando(false);
    }
  }

  if (!senha) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">OPS GUIX</p>
        <h1 className="mt-2 text-2xl font-bold">Gestão de E-mails</h1>
        <p className="mt-2 text-sm text-muted">
          Área interna — acesse com seu e-mail autorizado e a senha de orçamentos.
        </p>
        {erro ? <p className="mt-3 text-sm text-rose-700">{erro}</p> : null}
        <div className="mt-6 space-y-2">
          <input
            type="email"
            value={emailDigitado}
            onChange={(e) => setEmailDigitado(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="username"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            type="password"
            value={senhaDigitada}
            onChange={(e) => setSenhaDigitada(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            placeholder="Senha do painel"
            autoComplete="current-password"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={entrar}
            disabled={!emailDigitado.trim() || !senhaDigitada.trim()}
            className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  const totalPassos = exec?.passos.length || 0;
  const okPassos = exec?.passos.filter((p) => p.status === "ok").length || 0;
  const percentual = totalPassos ? Math.round((okPassos / totalPassos) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">OPS GUIX</p>
      <h1 className="mt-2 text-3xl font-bold">Gestão de E-mails</h1>
      <p className="mt-2 text-sm text-muted">
        Provisionamento de caixas profissionais no Zoho Mail por projeto (domínio, DNS e contas). Lista todos os
        orçamentos, aprovados ou não, para testes do motor.
      </p>

      {erro ? <p className="mt-4 text-sm text-rose-700">{erro}</p> : null}
      {ok ? <p className="mt-4 text-sm text-emerald-800">{ok}</p> : null}

      {integracoes ? (
        <section className="mt-5 rounded-2xl border border-line bg-white p-4">
          <h2 className="text-sm font-semibold">Prontidão das integrações</h2>
          <p className="mt-1 text-xs text-muted">
            Os segredos nunca são exibidos. O token Cloudflare precisa de Zone Read e DNS Edit; a zona e seu ID são
            descobertos automaticamente pelo domínio. As permissões são confirmadas ao chamar a API.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Zoho Mail", integracoes.zoho, true],
              ["Vercel", integracoes.vercel, true],
              ["DNS (Cloudflare/Vercel)", integracoes.cloudflare, true],
              ["Agendador", integracoes.retomada, false],
            ] as const).map(([nome, integracao, obrigatorio]) => (
              <div key={nome} className="rounded-xl bg-canvas p-3 text-xs">
                <p className="font-semibold">
                  {nome}: {integracao.configurado ? "variáveis presentes" : obrigatorio ? "bloqueado" : "não configurado"}
                </p>
                {!integracao.configurado ? (
                  <p className="mt-1 text-muted">
                    Configure no ambiente de produção: {integracao.pendentes.join(", ") || "revise as credenciais"}.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Projetos */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Projetos</h2>
          <button type="button" onClick={() => void carregar()} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <input
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            placeholder="Filtrar por cliente"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            value={filtroDominio}
            onChange={(e) => setFiltroDominio(e.target.value)}
            placeholder="Filtrar por domínio"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Todos os status</option>
            {(Object.keys(ROTULO_STATUS) as StatusEmail[]).map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Orçamento</th>
                <th className="px-4 py-3">Aprovação</th>
                <th className="px-4 py-3">Status do e-mail</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted">
                    {carregando ? "Carregando…" : "Nenhum projeto encontrado."}
                  </td>
                </tr>
              ) : null}
              {filtrados.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{p.cliente}</td>
                  <td className="px-4 py-3 text-muted">{p.dominio || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        CLASSE_ORCAMENTO[p.statusOrcamento] || "bg-canvas text-ink"
                      }`}
                    >
                      {ROTULO_ORCAMENTO[p.statusOrcamento] || p.statusOrcamento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{dataCurta(p.dataAprovacao)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CLASSE_STATUS[p.statusEmail]}`}>
                      {ROTULO_STATUS[p.statusEmail]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => abrir(p)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      Configurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Configuração */}
      {selecionado ? (
        <section className="mt-10 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                {selecionado.statusEmail === "configurado" ? "Reconfigurar" : "Configurar"} e-mails — {selecionado.cliente}
              </h2>
              <p className="mt-1 text-xs text-muted">
                Orçamento {ROTULO_ORCAMENTO[selecionado.statusOrcamento] || selecionado.statusOrcamento} · projeto{" "}
                {selecionado.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
            >
              Fechar
            </button>
          </div>

          <label className="mt-5 block text-xs font-semibold text-muted">
            Domínio
            <input
              value={dominio}
              onChange={(e) => setDominio(e.target.value)}
              placeholder="cliente.com.br"
              className="mt-1 block w-full max-w-sm rounded-xl border border-line bg-white px-3 py-2 text-sm font-normal text-ink outline-none focus:border-accent"
            />
            <span className="mt-1 block font-normal">
              O domínio é pré-preenchido a partir do orçamento quando informado pelo comercial.
            </span>
          </label>

          <p className="mt-5 text-xs font-semibold text-muted">Caixas (até {MAX_CONTAS})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGESTOES.map((s) => {
              const on = prefixos.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => alternarPrefixo(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    on ? "border-accent bg-accent/10 text-ink" : "border-line text-muted"
                  }`}
                >
                  {s}@{dominio || "domínio"}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {prefixos
              .filter((p) => !SUGESTOES.includes(p))
              .map((p) => (
                <span key={p} className="inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold">
                  {p}@{dominio || "domínio"}
                  <button type="button" onClick={() => alternarPrefixo(p)} className="text-muted">
                    ×
                  </button>
                </span>
              ))}
            <input
              value={novoPrefixo}
              onChange={(e) => setNovoPrefixo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarPrefixo()}
              placeholder="outra caixa"
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-accent"
            />
            <button type="button" onClick={adicionarPrefixo} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">
              Adicionar
            </button>
          </div>

          <p className="mt-4 text-xs text-muted">
            Serão criadas:{" "}
            <strong className="text-ink">
              {prefixos.length ? prefixos.map((p) => `${p}@${dominio || "domínio"}`).join(", ") : "nenhuma"}
            </strong>
          </p>

          <button
            type="button"
            onClick={() => void configurar()}
            disabled={
              disparando ||
              !integracoes?.zoho.configurado ||
              !integracoes.vercel.configurado ||
              !integracoes.cloudflare.configurado
            }
            className="mt-5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {disparando ? "Iniciando…" : selecionado.statusEmail === "configurado" ? "Reconfigurar e-mails" : "Configurar E-mails"}
          </button>
          <p className="mt-2 text-xs text-muted">
            Vercel, Zoho e Cloudflare são verificados automaticamente. Desafios TXT, MX e SPF são publicados sem
            intervenção manual. Enquanto esta tela estiver aberta, a propagação é retomada a cada 15 segundos; se for
            fechada, o agendador do servidor assume a retomada.
          </p>
        </section>
      ) : null}

      {/* Execução / progresso */}
      {exec ? (
        <section ref={execRef} className="mt-10 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Progresso — {exec.cliente}</h2>
              <p className="mt-1 text-xs text-muted">
                {exec.dominio} · execução {exec.id} · iniciado {dataCurta(exec.criadoEm)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExec(null)}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
            >
              Fechar
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CLASSE_STATUS[exec.status]}`}>
              {ROTULO_STATUS[exec.status]}
            </span>
            <span className="text-xs text-muted">
              {okPassos}/{totalPassos} etapas
                {exec.status === "em_configuracao" && exec.concluidoEm ? " · DNS pendente, retomada automática pelo agendador" : ""}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percentual}%` }} />
          </div>

          {exec.status === "erro" ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold">O motor interrompeu por uma falha</p>
              <p className="mt-1 text-xs text-muted">
                Consulte o log. Após corrigir uma credencial ou permissão, você pode tentar novamente sem perder
                as etapas já concluídas.
              </p>
              <button
                type="button"
                onClick={() => void continuarExecucao(exec.id)}
                disabled={continuando}
                className="mt-3 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {continuando ? "Reiniciando…" : "Tentar novamente"}
              </button>
            </div>
          ) : null}

          <ul className="mt-4 space-y-2">
            {exec.passos.map((p) => {
              const senha = senhaDoPasso(p);
              return (
                <li key={p.chave} className="flex gap-2 text-sm">
                  <span aria-hidden>{ICONE_PASSO[p.status]}</span>
                  <span className="min-w-0">
                    <span className="font-medium text-ink">{p.titulo}</span>
                    {p.detalhe ? <span className="block text-xs text-muted">{p.detalhe}</span> : null}
                    {senha ? (
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(senha);
                          setOk(`${p.titulo} — senha provisória copiada.`);
                        }}
                        className="mt-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold"
                      >
                        Copiar senha provisória
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>

          {exec.erro ? <p className="mt-3 text-sm text-rose-700">{exec.erro}</p> : null}

          {exec.contasCriadas.length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">Contas criadas</p>
              <ul className="mt-1 space-y-1 text-sm">
                {exec.contasCriadas.map((c) => (
                  <li key={c.email}>{c.email}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Histórico */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Histórico de execuções</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {execucoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhuma execução registrada.
                  </td>
                </tr>
              ) : null}
              {execucoes.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{e.cliente}</td>
                  <td className="px-4 py-3 text-muted">{e.dominio}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CLASSE_STATUS[e.status]}`}>
                      {ROTULO_STATUS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{e.usuario}</td>
                  <td className="px-4 py-3 text-muted">{dataCurta(e.criadoEm)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void abrirExecucao(e.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      Ver logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default function PainelEmailsPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Abrindo…</main>}>
      <PainelEmails />
    </Suspense>
  );
}
