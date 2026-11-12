"use client";

import { Suspense, useEffect, useState } from "react";

type StatusLead = "novo" | "mensagem_gerada" | "enviado" | "respondeu" | "descartado";

type Lead = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  nicho: string;
  endereco: string;
  categoria?: string;
  status: StatusLead;
  data_ultimo_contato: string | null;
  conta_whatsapp: string | null;
  modelo_usado: string | null;
  mensagem_gerada: string | null;
  observacoes: string;
  external_id: string | null;
  fonte: string;
  created_at: string;
  updated_at: string;
};

type Conta = {
  id: string;
  nome: string;
  limite_diario: number;
  enviados_hoje: number;
};

type NichoCfg = {
  slug: string;
  nome: string;
  modelo_url: string;
  termos_busca: string[];
  categorias_foursquare?: string[];
};

type Template = { id: string; nome: string; texto: string };

type ResultadoBusca = {
  nome: string;
  telefone: string;
  telefone_normalizado: string;
  endereco: string;
  cidade: string;
  categoria: string;
  external_id: string;
  lead_id: string | null;
  status: StatusLead;
  ja_contatado: boolean;
  contatado_recentemente: boolean;
};

type Config = {
  api: { provedor: string; chave: string; endpoint_busca: string; endpoint_detalhes: string };
  contas: Conta[];
  nichos: NichoCfg[];
  templates: Template[];
  template_ativo: string;
  periodo_recontato_dias: number;
};

const STORAGE_KEY = "guix.prospeccao.senha";

const STATUS_META: Record<StatusLead, { label: string; cor: string }> = {
  novo: { label: "Novo", cor: "bg-sky-100 text-sky-800" },
  mensagem_gerada: { label: "Mensagem gerada", cor: "bg-violet-100 text-violet-800" },
  enviado: { label: "Enviado", cor: "bg-amber-100 text-amber-800" },
  respondeu: { label: "Respondeu", cor: "bg-emerald-100 text-emerald-800" },
  descartado: { label: "Descartado", cor: "bg-slate-200 text-slate-600" },
};

function inicial(chave: string) {
  return chave.slice(0, 2).toUpperCase();
}

function PainelProspeccao() {
  const [senha, setSenha] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [liberado, setLiberado] = useState(false);

  const [config, setConfig] = useState<Config | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [nicho, setNicho] = useState("dentista");
  const [cidade, setCidade] = useState("");
  const [soComTelefone, setSoComTelefone] = useState(true);
  const [soNovos, setSoNovos] = useState(true);
  const [naoContatados, setNaoContatados] = useState(false);

  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [totalBruto, setTotalBruto] = useState(0);
  const [buscando, setBuscando] = useState(false);

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [gerandoMsg, setGerandoMsg] = useState(false);

  const [contaEnvio, setContaEnvio] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvandoObs, setSalvandoObs] = useState(false);

  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [uso, setUso] = useState<{ mes: string; buscas: number; limite_mensal: number } | null>(null);

  const [abaConfig, setAbaConfig] = useState(false);

  useEffect(() => {
    try {
      const salva = sessionStorage.getItem(STORAGE_KEY) || "";
      if (salva) {
        setSenha(salva);
        setLiberado(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (liberado && senha) void carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liberado, senha]);

  const headers = () => ({
    "Content-Type": "application/json",
    "x-painel-token": senha,
  });

  async function carregarTudo() {
    setErro("");
    const res = await fetch("/api/painel/prospeccao", { headers: headers() });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Senha incorreta.");
      setLiberado(false);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    setConfig(j.config);
    setContas(j.contas || []);
    setLeads(j.leads || []);
    if (j.uso) setUso(j.uso);
    if (j.config?.nichos?.[0]?.slug) setNicho(j.config.nichos[0].slug);
    if (j.contas?.[0]?.id) setContaEnvio(j.contas[0].id);
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const s = senhaDigitada.trim();
    if (!s) {
      setErro("Digite a senha do painel.");
      return;
    }
    setSenha(s);
    setLiberado(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  function sair() {
    setLiberado(false);
    setSenha("");
    setSenhaDigitada("");
    setConfig(null);
    setLeads([]);
    setContas([]);
    setResultados([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    setErro("");
    setOk("");
    if (!nicho || !cidade) {
      setErro("Selecione o nicho e digite a cidade.");
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch("/api/painel/prospeccao/buscar", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          nicho,
          cidade,
          soComTelefone,
          excluirContatados: soNovos,
          excluirRecontato: naoContatados,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Falha na busca.");
        return;
      }
      setResultados(j.resultados || []);
      setTotalBruto(j.total_bruto || j.resultados?.length || 0);
      if (j.uso) setUso(j.uso);
      setOk(`${j.total} resultado(s)${j.total_bruto && j.total_bruto !== j.total ? ` de ${j.total_bruto}` : ""}.`);
    } finally {
      setBuscando(false);
    }
  }

  async function gerarMensagem(r: ResultadoBusca) {
    setErro("");
    setOk("");
    setGerandoMsg(true);
    setLeadSelecionado(null);
    setMensagem("");
    setWhatsappUrl("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          nome: r.nome,
          telefone: r.telefone,
          cidade: r.cidade,
          nicho,
          endereco: r.endereco,
          categoria: r.categoria,
          external_id: r.external_id,
          fonte: "foursquare",
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível gerar a mensagem.");
        return;
      }
      setLeadSelecionado(j.lead);
      setMensagem(j.mensagem);
      setWhatsappUrl(j.whatsapp_url);
      setObservacoes(j.lead.observacoes || "");
      setContaEnvio(j.lead.conta_whatsapp || contas[0]?.id || "");
      setOk(`Mensagem gerada para ${j.lead.nome}.`);
      await carregarTudo();
    } finally {
      setGerandoMsg(false);
    }
  }

  async function gerarMensagemDeLead(lead: Lead) {
    setErro("");
    setOk("");
    setGerandoMsg(true);
    setLeadSelecionado(null);
    setMensagem("");
    setWhatsappUrl("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ id: lead.id }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível gerar a mensagem.");
        return;
      }
      setLeadSelecionado(j.lead);
      setMensagem(j.mensagem);
      setWhatsappUrl(j.whatsapp_url);
      setObservacoes(j.lead.observacoes || "");
      setContaEnvio(j.lead.conta_whatsapp || contas[0]?.id || "");
      setOk(`Mensagem gerada para ${j.lead.nome}.`);
      await carregarTudo();
    } finally {
      setGerandoMsg(false);
    }
  }

  async function removerLeadUI(lead: Lead) {
    if (!window.confirm(`Remover "${lead.nome}" do histórico?`)) return;
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ id: lead.id }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível remover o lead.");
        return;
      }
      if (leadSelecionado?.id === lead.id) {
        setLeadSelecionado(null);
        setMensagem("");
        setWhatsappUrl("");
      }
      setOk(`Lead "${lead.nome}" removido.`);
      await carregarTudo();
    } catch {
      setErro("Falha de rede ao remover o lead.");
    }
  }

  async function copiarMensagem() {
    if (!mensagem) return;
    try {
      await navigator.clipboard.writeText(mensagem);
      setOk("Mensagem copiada.");
    } catch {
      setErro("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  async function marcarEnviado() {
    if (!leadSelecionado) return;
    if (!contaEnvio) {
      setErro("Escolha a conta WhatsApp usada.");
      return;
    }
    setErro("");
    setOk("");
    const res = await fetch("/api/painel/prospeccao/lead", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
        id: leadSelecionado.id,
        marcar_enviado: true,
        conta_whatsapp: contaEnvio,
        observacoes,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não foi possível marcar como enviado.");
      return;
    }
    setLeadSelecionado(j.lead);
    setContas(j.contas || contas);
    setOk("Marcado como enviado. Contador atualizado.");
    await carregarTudo();
  }

  async function salvarObservacoes() {
    if (!leadSelecionado) return;
    setSalvandoObs(true);
    setErro("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id: leadSelecionado.id, observacoes }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não salvou as observações.");
        return;
      }
      setLeadSelecionado(j.lead);
      setOk("Observações salvas.");
    } finally {
      setSalvandoObs(false);
    }
  }

  async function mudarStatus(status: StatusLead) {
    if (!leadSelecionado) return;
    setErro("");
    const res = await fetch("/api/painel/prospeccao/lead", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id: leadSelecionado.id, status, observacoes }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não atualizou o status.");
      return;
    }
    setLeadSelecionado(j.lead);
    setOk(`Status → ${STATUS_META[status].label}.`);
    await carregarTudo();
  }

  if (!liberado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">GUIX ADMIN</p>
        <h1 className="mt-2 text-3xl font-bold">Prospecção</h1>
        <p className="mt-2 text-sm text-muted">Acesso restrito ao time comercial.</p>
        <form onSubmit={entrar} className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6">
          <label className="block text-sm font-semibold">
            Senha
            <input
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              type="password"
              autoComplete="current-password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              required
            />
          </label>
          {erro ? <p className="text-sm text-rose-700">{erro}</p> : null}
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">GUIX ADMIN</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Prospecção de leads</h1>
          <p className="mt-1 text-sm text-muted">
            Busque negócios locais, gere mensagens personalizadas e acompanhe o histórico de contatos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/painel/cupons" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Cupons
          </a>
          <a href="/painel/orcamentos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Orçamentos
          </a>
          <a href="/painel/pedidos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Pedidos / ZIP
          </a>
          <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold">
            Carlos Mendes · Administrador
          </span>
          <button
            type="button"
            onClick={sair}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold"
          >
            Sair
          </button>
        </div>
      </header>

      {erro ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{erro}</p> : null}
      {ok ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{ok}</p> : null}

      {/* Layout principal */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[18rem_1fr_22rem]">
        {/* Coluna esquerda: filtros de busca */}
        <aside className="space-y-4">
          <form
            onSubmit={buscar}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span>🔍</span> Filtros de busca
            </h2>

            <label className="mt-4 block text-sm font-semibold">
              Nicho
              <select
                className={campo}
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
              >
                {(config?.nichos || []).map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-sm font-semibold">
              Cidade
              <input
                className={campo}
                placeholder="Aracaju"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={buscando}
              className="mt-4 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {buscando ? "Buscando…" : "Buscar"}
            </button>

            <p className="mt-3 text-xs text-muted">
              {resultados.length > 0 ? `${resultados.length} resultado(s) exibidos` : "Resultados aparecerão aqui."}
            </p>

            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Filtros rápidos</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={soNovos}
                  onChange={(e) => setSoNovos(e.target.checked)}
                />
                Só novos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={soComTelefone}
                  onChange={(e) => setSoComTelefone(e.target.checked)}
                />
                Com telefone
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={naoContatados}
                  onChange={(e) => setNaoContatados(e.target.checked)}
                />
                Não contatados {config?.periodo_recontato_dias || 45} dias
              </label>
            </div>
          </form>

          {/* Cota mensal da API */}
          {uso ? (
            (() => {
              const pct = Math.min(100, Math.round((uso.buscas / uso.limite_mensal) * 100));
              const alerta = pct >= 80;
              const critico = pct >= 100;
              return (
                <div
                  className={`rounded-2xl border p-5 ${
                    critico
                      ? "border-rose-300 bg-rose-50"
                      : alerta
                        ? "border-amber-300 bg-amber-50"
                        : "border-line bg-white"
                  }`}
                >
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <span>📡</span> Cota da API (mês)
                  </h2>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span
                      className={`font-mono text-xs ${
                        critico ? "text-rose-700" : alerta ? "text-amber-700" : "text-muted"
                      }`}
                    >
                      {uso.buscas} / {uso.limite_mensal} buscas
                    </span>
                    <span className="text-[10px] text-muted">{uso.mes}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        critico ? "bg-rose-500" : alerta ? "bg-amber-500" : "bg-accent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {critico ? (
                    <p className="mt-2 text-xs text-rose-800">
                      Cota mensal esgotada. As buscas podem falhar até a renovação do plano.
                    </p>
                  ) : alerta ? (
                    <p className="mt-2 text-xs text-amber-800">
                      Cota quase esgotada. Evite buscas desnecessárias ou atualize o plano da Foursquare.
                    </p>
                  ) : null}
                </div>
              );
            })()
          ) : null}

          {/* Contadores */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-sm font-bold">Limite diário</h2>
            <p className="mt-1 text-xs text-muted">
              Contadores claros evitam excesso de envios e garantem conformidade com as políticas do WhatsApp.
            </p>
            <div className="mt-4 space-y-4">
              {contas.map((c) => {
                const pct = Math.min(100, Math.round((c.enviados_hoje / c.limite_diario) * 100));
                const perto = pct >= 80;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{c.nome}</span>
                      <span className={`font-mono text-xs ${perto ? "text-rose-600" : "text-muted"}`}>
                        {c.enviados_hoje} / {c.limite_diario}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${perto ? "bg-rose-500" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">Limite diário: {c.limite_diario} mensagens</p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Coluna central: tabela de leads */}
        <section className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold">
              Leads encontrados ({resultados.length})
              {totalBruto > resultados.length ? (
                <span className="ml-2 text-xs font-normal text-muted">
                  {totalBruto - resultados.length} filtrados
                </span>
              ) : null}
            </h2>
          </div>

          {resultados.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              {buscando ? "Buscando…" : "Selecione nicho e cidade para buscar leads."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nome</th>
                    <th className="px-3 py-3 font-semibold">Telefone</th>
                    <th className="px-3 py-3 font-semibold">Endereço</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resultados.map((r, i) => (
                    <tr key={`${r.external_id}-${i}`} className="hover:bg-canvas/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                            {inicial(r.nome)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{r.nome}</p>
                            {r.categoria ? (
                              <p className="truncate text-xs text-muted">{r.categoria}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{r.telefone || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted">
                        <span className="line-clamp-2">{r.endereco || "—"}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[r.status].cor}`}
                        >
                          {STATUS_META[r.status].label}
                        </span>
                        {r.contatado_recentemente ? (
                          <p className="mt-1 text-[10px] text-rose-600">contatado recentemente</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void gerarMensagem(r)}
                            disabled={gerandoMsg}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            Gerar mensagem
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legenda de status */}
          <div className="border-t border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Legenda de status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(STATUS_META) as StatusLead[]).map((s) => (
                <span key={s} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[s].cor}`}>
                  {STATUS_META[s].label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Prevenção de duplicidade: leads já contatados recentemente são destacados.
            </p>
          </div>
        </section>

        {/* Coluna direita: prévia WhatsApp + configurações */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span>💬</span> Prévia da mensagem WhatsApp
            </h2>
            <p className="mt-1 text-xs text-muted">
              Mensagem personalizada baseada no template selecionado.
            </p>

            {leadSelecionado ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-[#ECE5DD] p-3 text-sm text-ink">
                  <p className="whitespace-pre-wrap break-words">{mensagem || "Nenhuma mensagem."}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copiarMensagem}
                    className="flex-1 rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-accent"
                  >
                    Copiar
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-full bg-[#25D366] px-3 py-2 text-center text-xs font-semibold text-white hover:opacity-90"
                  >
                    Abrir WhatsApp
                  </a>
                </div>

                <div className="space-y-2 border-t border-line pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status do lead</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[leadSelecionado.status].cor}`}
                    >
                      {STATUS_META[leadSelecionado.status].label}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold">Conta WhatsApp usada</label>
                    <select
                      className={campo}
                      value={contaEnvio}
                      onChange={(e) => setContaEnvio(e.target.value)}
                    >
                      <option value="">— escolha —</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.enviados_hoje}/{c.limite_diario} hoje)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={marcarEnviado}
                    className="w-full rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark"
                  >
                    Marcar como enviado
                  </button>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => void mudarStatus("respondeu")}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold hover:border-emerald-500"
                    >
                      Respondeu
                    </button>
                    <button
                      type="button"
                      onClick={() => void mudarStatus("descartado")}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold hover:border-slate-500"
                    >
                      Descartar
                    </button>
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <label className="block text-sm font-semibold">Observações</label>
                  <textarea
                    className={`${campo} min-h-[5rem] resize-y`}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione notas sobre este lead…"
                    maxLength={1000}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted">{observacoes.length}/1000</span>
                    <button
                      type="button"
                      onClick={salvarObservacoes}
                      disabled={salvandoObs}
                      className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold hover:border-accent disabled:opacity-50"
                    >
                      {salvandoObs ? "Salvando…" : "Salvar obs."}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
                Clique em <strong>“Gerar mensagem”</strong> em um lead para ver a prévia aqui.
              </p>
            )}
          </div>

          {/* Configurações */}
          <ConfigPanel
            config={config}
            senha={senha}
            onSalvo={(cfg) => {
              setConfig(cfg);
              setOk("Configurações salvas.");
              void carregarTudo();
            }}
            aberto={abaConfig}
            onToggle={() => setAbaConfig((v) => !v)}
          />
        </aside>
      </div>

      {/* Histórico de leads salvos */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-sm font-bold">Histórico de leads ({leads.length})</h2>
        <p className="mt-1 text-xs text-muted">
          Todos os leads gerados ficam salvos para consulta futura e para a IA da Meta.
        </p>
        {leads.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum lead salvo ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Nome</th>
                  <th className="px-3 py-2 font-semibold">Telefone</th>
                  <th className="px-3 py-2 font-semibold">Nicho</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Último contato</th>
                  <th className="px-3 py-2 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.slice(0, 50).map((l) => (
                  <tr key={l.id} className="hover:bg-canvas/50">
                    <td className="px-3 py-2 font-semibold">{l.nome}</td>
                    <td className="px-3 py-2 font-mono text-xs">{l.telefone}</td>
                    <td className="px-3 py-2 text-xs">{l.nicho}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[l.status].cor}`}>
                        {STATUS_META[l.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {l.data_ultimo_contato
                        ? new Date(l.data_ultimo_contato).toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void gerarMensagemDeLead(l)}
                          disabled={gerandoMsg}
                          className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold hover:border-accent hover:text-accent disabled:opacity-50"
                        >
                          Gerar mensagem
                        </button>
                        <button
                          type="button"
                          onClick={() => void removerLeadUI(l)}
                          className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                          title="Remover do histórico"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

// —— Subcomponente: Configurações ——

function ConfigPanel({
  config,
  senha,
  onSalvo,
  aberto,
  onToggle,
}: {
  config: Config | null;
  senha: string;
  onSalvo: (cfg: Config) => void;
  aberto: boolean;
  onToggle: () => void;
}) {
  const [chave, setChave] = useState("");
  const [endpointBusca, setEndpointBusca] = useState("");
  const [endpointDetalhes, setEndpointDetalhes] = useState("");
  const [periodo, setPeriodo] = useState(45);
  const [templateAtivo, setTemplateAtivo] = useState("");

  const [contas, setContas] = useState<Conta[]>([]);
  const [nichos, setNichos] = useState<NichoCfg[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (config) {
      setChave(config.api.chave || "");
      setEndpointBusca(config.api.endpoint_busca);
      setEndpointDetalhes(config.api.endpoint_detalhes);
      setPeriodo(config.periodo_recontato_dias);
      setTemplateAtivo(config.template_ativo);
      setContas(config.contas.map((c) => ({ ...c })));
      setNichos(
        config.nichos.map((n) => ({
          slug: n.slug,
          nome: n.nome,
          modelo_url: n.modelo_url,
          termos_busca: [...(n.termos_busca || [])],
          categorias_foursquare: [...(n.categorias_foursquare || [])],
        })),
      );
      setTemplates(config.templates.map((t) => ({ ...t })));
    }
  }, [config]);

  function novaConta() {
    const id = `conta_${Date.now().toString(36)}`;
    setContas((prev) => [...prev, { id, nome: `Conta ${prev.length + 1}`, limite_diario: 30, enviados_hoje: 0 }]);
  }
  function atualizarConta(i: number, patch: Partial<Conta>) {
    setContas((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removerConta(i: number) {
    setContas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function novoNicho() {
    setNichos((prev) => [
      ...prev,
      { slug: `nicho_${Date.now().toString(36)}`, nome: "", modelo_url: "", termos_busca: [] },
    ]);
  }
  function atualizarNicho(i: number, patch: Partial<NichoCfg>) {
    setNichos((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));
  }
  function removerNicho(i: number) {
    setNichos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function novoTemplate() {
    const id = `tpl_${Date.now().toString(36)}`;
    setTemplates((prev) => [...prev, { id, nome: "Novo template", texto: "" }]);
    setTemplateAtivo(id);
  }
  function atualizarTemplate(i: number, patch: Partial<Template>) {
    setTemplates((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function removerTemplate(i: number) {
    setTemplates((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (templateAtivo && !next.find((t) => t.id === templateAtivo)) {
        setTemplateAtivo(next[0]?.id || "");
      }
      return next;
    });
  }

  async function salvar() {
    if (!config) return;
    setSalvando(true);
    setErro("");
    try {
      // Sanitiza contas (remove enviados_hoje que não faz parte da config)
      const contasCfg = contas.map(({ enviados_hoje: _e, ...resto }) => resto);
      const res = await fetch("/api/painel/prospeccao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-painel-token": senha },
        body: JSON.stringify({
          api: {
            provedor: "foursquare",
            chave,
            endpoint_busca: endpointBusca,
            endpoint_detalhes: endpointDetalhes,
          },
          periodo_recontato_dias: periodo,
          template_ativo: templateAtivo,
          contas: contasCfg,
          nichos,
          templates,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não salvou.");
        return;
      }
      onSalvo(j.config);
    } finally {
      setSalvando(false);
    }
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const btnGhost =
    "rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent";

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <span>⚙️</span> Configurações
        </h2>
        <span className="text-muted">{aberto ? "▾" : "▸"}</span>
      </button>

      {aberto ? (
        <div className="mt-4 space-y-5">
          {erro ? <p className="text-sm text-rose-700">{erro}</p> : null}

          {/* API Foursquare */}
          <div className="space-y-2">
            <p className="flex items-center justify-between text-xs font-semibold">
              API Foursquare
              {config?.api.chave ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                  Conectada
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                  Pendente
                </span>
              )}
            </p>
            <div>
              <label className="text-[11px] text-muted">API Key</label>
              <input
                type="password"
                className={campo}
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder="fsq3..."
              />
            </div>
            <div>
              <label className="text-[11px] text-muted">Endpoint de busca</label>
              <input
                className={campo}
                value={endpointBusca}
                onChange={(e) => setEndpointBusca(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted">Endpoint de detalhes</label>
              <input
                className={campo}
                value={endpointDetalhes}
                onChange={(e) => setEndpointDetalhes(e.target.value)}
              />
            </div>
          </div>

          {/* Contas WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Contas WhatsApp</p>
              <button type="button" onClick={novaConta} className={btnGhost}>
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {contas.map((c, i) => (
                <div key={c.id} className="rounded-lg border border-line p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${campo} mt-0`}
                      value={c.nome}
                      onChange={(e) => atualizarConta(i, { nome: e.target.value })}
                      placeholder="Nome da conta"
                    />
                    <input
                      type="number"
                      min={1}
                      max={500}
                      className={`${campo} mt-0 w-24`}
                      value={c.limite_diario}
                      onChange={(e) => atualizarConta(i, { limite_diario: Number(e.target.value) })}
                      title="Limite diário"
                    />
                    <button
                      type="button"
                      onClick={() => removerConta(i)}
                      className="rounded-full px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      title="Remover conta"
                    >
                      ✕
                    </button>
                  </div>
                  {c.enviados_hoje != null ? (
                    <p className="mt-1 text-[10px] text-muted">
                      Envios hoje: {c.enviados_hoje}
                    </p>
                  ) : null}
                </div>
              ))}
              {contas.length === 0 ? (
                <p className="text-xs text-muted">Nenhuma conta cadastrada.</p>
              ) : null}
            </div>
          </div>

          {/* Nichos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Nichos</p>
              <button type="button" onClick={novoNicho} className={btnGhost}>
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {nichos.map((n, i) => (
                <div key={`${n.slug}-${i}`} className="space-y-1.5 rounded-lg border border-line p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${campo} mt-0`}
                      value={n.slug}
                      onChange={(e) =>
                        atualizarNicho(i, { slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                      }
                      placeholder="slug (ex: dentista)"
                    />
                    <input
                      className={`${campo} mt-0`}
                      value={n.nome}
                      onChange={(e) => atualizarNicho(i, { nome: e.target.value })}
                      placeholder="Nome (ex: Dentista)"
                    />
                    <button
                      type="button"
                      onClick={() => removerNicho(i)}
                      className="rounded-full px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className={campo}
                    value={n.modelo_url}
                    onChange={(e) => atualizarNicho(i, { modelo_url: e.target.value })}
                    placeholder="URL do modelo de site"
                  />
                  <input
                    className={campo}
                    value={(n.termos_busca || []).join(", ")}
                    onChange={(e) =>
                      atualizarNicho(i, {
                        termos_busca: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Termos de busca (separados por vírgula)"
                  />
                  <input
                    className={campo}
                    value={(n.categorias_foursquare || []).join(", ")}
                    onChange={(e) =>
                      atualizarNicho(i, {
                        categorias_foursquare: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Categorias Foursquare (ids, separados por vírgula)"
                  />
                </div>
              ))}
              {nichos.length === 0 ? (
                <p className="text-xs text-muted">Nenhum nicho cadastrado.</p>
              ) : null}
            </div>
          </div>

          {/* Templates de mensagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Templates de mensagem</p>
              <button type="button" onClick={novoTemplate} className={btnGhost}>
                + Adicionar
              </button>
            </div>
            <div>
              <label className="text-[11px] text-muted">Template ativo</label>
              <select
                className={campo}
                value={templateAtivo}
                onChange={(e) => setTemplateAtivo(e.target.value)}
              >
                {templates.length === 0 ? <option value="">—</option> : null}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {templates.map((t, i) => (
                <div
                  key={t.id}
                  className={`space-y-1.5 rounded-lg border p-2.5 ${
                    t.id === templateAtivo ? "border-accent" : "border-line"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      className={`${campo} mt-0 flex-1`}
                      value={t.nome}
                      onChange={(e) => atualizarTemplate(i, { nome: e.target.value })}
                      placeholder="Nome do template"
                    />
                    {t.id === templateAtivo ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        ativo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTemplateAtivo(t.id)}
                        className="rounded-full px-2 py-0.5 text-[10px] text-muted hover:text-accent"
                      >
                        usar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removerTemplate(i)}
                      className="rounded-full px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    className={`${campo} min-h-[7rem] resize-y font-mono text-xs`}
                    value={t.texto}
                    onChange={(e) => atualizarTemplate(i, { texto: e.target.value })}
                    placeholder="Texto da mensagem. Use {{nome}}, {{cidade}}, {{nicho}}, {{modelo_url}}"
                  />
                  <p className="text-[10px] text-muted">
                    Variáveis: {"{{nome}}"}, {"{{cidade}}"}, {"{{nicho}}"}, {"{{modelo_url}}"}
                  </p>
                </div>
              ))}
              {templates.length === 0 ? (
                <p className="text-xs text-muted">Nenhum template cadastrado.</p>
              ) : null}
            </div>
          </div>

          {/* Período de recontato */}
          <div>
            <label className="text-xs font-semibold">
              Período mínimo entre recontatos (dias)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              className={campo}
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
            />
          </div>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar todas as configurações"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando painel…</main>}>
      <PainelProspeccao />
    </Suspense>
  );
}
