"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { formatarReais } from "@/lib/dinheiro";

type Item = {
  id: string;
  titulo: string;
  descricao: string;
  prazo?: string;
  clienteNome: string;
  dominio?: string | null;
  valorCentavos: number;
  descontoCentavos: number;
  totalCentavos: number;
  status: string;
  criadoEm: string;
  url: string;
  criadoPor: string;
};

const STORAGE_KEY = "guix.cupons.senha";

/** Pega um título curto da elaboração gerada (linha após ORÇAMENTO COMERCIAL). */
function tituloDaElaboracao(texto: string) {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const idx = linhas.findIndex((l) => /^or[cç]amento comercial$/i.test(l));
  const candidata = idx >= 0 ? linhas[idx + 1] : linhas[0];
  if (!candidata) return "";
  if (/^guix\.net\.br/i.test(candidata)) return "";
  if (/^\d+\.\s/.test(candidata)) return "";
  return candidata.slice(0, 120);
}

function PainelOrcamentos() {
  const [senha, setSenha] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [liberado, setLiberado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [gerandoIa, setGerandoIa] = useState(false);
  const [corrigindoIa, setCorrigindoIa] = useState(false);
  const [copiado, setCopiado] = useState("");
  const elaboracaoRef = useRef<HTMLTextAreaElement>(null);

  const [titulo, setTitulo] = useState("Presença Personalizada");
  const [clienteNome, setClienteNome] = useState("");
  const [dominio, setDominio] = useState("");
  const [mensagemCliente, setMensagemCliente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [correcaoIa, setCorrecaoIa] = useState("");
  const [prazo, setPrazo] = useState("até 24 horas");
  const [valorReais, setValorReais] = useState("2999.90");
  const [descontoReais, setDescontoReais] = useState("0");
  const [criadoPor, setCriadoPor] = useState("comercial");
  const [notaInterna, setNotaInterna] = useState("");
  const iaOcupada = gerandoIa || corrigindoIa;

  const totalPreview = useMemo(() => {
    const v = Math.round(Number(valorReais || 0) * 100);
    const d = Math.round(Number(descontoReais || 0) * 100);
    return Math.max(0, v - d);
  }, [valorReais, descontoReais]);

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
    if (liberado && senha) void carregar(senha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liberado, senha]);

  async function carregar(s = senha) {
    setErro("");
    const res = await fetch("/api/painel/orcamentos", { headers: { "x-cupons-senha": s } });
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
    setItens(j.itens || []);
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const s = senhaDigitada.trim();
    if (!s) {
      setErro("Digite a senha do comercial.");
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
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function gerarElaboracao() {
    setErro("");
    setOk("");
    if (mensagemCliente.trim().length < 20) {
      setErro("Cole a mensagem do cliente (pelo menos 20 caracteres) para a IA montar a elaboração.");
      return;
    }
    setGerandoIa(true);
    try {
      const res = await fetch("/api/painel/orcamentos/elaborar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cupons-senha": senha },
        body: JSON.stringify({
          modo: "gerar",
          mensagemCliente,
          titulo,
          clienteNome,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não deu para gerar a elaboração.");
        return;
      }
      const texto = String(j.elaboracao || "").trim();
      if (texto.length < 40) {
        setErro("A IA devolveu um texto curto demais. Tente de novo ou escreva à mão.");
        return;
      }
      setDescricao(texto);
      const sugerido = tituloDaElaboracao(texto);
      if (sugerido && (!titulo.trim() || /^presen[cç]a personalizada$/i.test(titulo.trim()))) {
        setTitulo(sugerido);
      }
      setOk("Elaboração gerada. Revise o texto, confira valor/desconto e gere o link.");
      requestAnimationFrame(() => {
        elaboracaoRef.current?.focus();
        elaboracaoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch {
      setErro("Falha ao falar com a IA. Tente de novo.");
    } finally {
      setGerandoIa(false);
    }
  }

  async function corrigirElaboracao() {
    setErro("");
    setOk("");
    if (descricao.trim().length < 20) {
      setErro("Gere ou escreva a elaboração antes de pedir correção.");
      return;
    }
    if (correcaoIa.trim().length < 3) {
      setErro("Digite o que a IA deve corrigir ou alterar.");
      return;
    }
    setCorrigindoIa(true);
    try {
      const res = await fetch("/api/painel/orcamentos/elaborar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cupons-senha": senha },
        body: JSON.stringify({
          modo: "corrigir",
          textoAtual: descricao,
          instrucao: correcaoIa,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não deu para corrigir a elaboração.");
        return;
      }
      const texto = String(j.elaboracao || "").trim();
      if (texto.length < 40) {
        setErro("A correção veio vazia. Tente outra instrução ou edite à mão.");
        return;
      }
      setDescricao(texto);
      setCorrecaoIa("");
      setOk("Texto atualizado pela IA. Revise antes de gerar o link.");
      requestAnimationFrame(() => elaboracaoRef.current?.focus());
    } catch {
      setErro("Falha ao falar com a IA. Tente de novo.");
    } finally {
      setCorrigindoIa(false);
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOk("");
    setEnviando(true);
    try {
      const res = await fetch("/api/painel/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cupons-senha": senha },
        body: JSON.stringify({
          titulo,
          clienteNome,
          dominio,
          descricao,
          prazo,
          valorReais: Number(valorReais),
          descontoReais: Number(descontoReais),
          criadoPor,
          notaInterna,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não deu para criar o orçamento.");
        return;
      }
      setOk(`Link pronto: ${j.orcamento.url}`);
      setMensagemCliente("");
      setDescricao("");
      setCorrecaoIa("");
      setPrazo("até 24 horas");
      setClienteNome("");
      setDominio("");
      setDescontoReais("0");
      setNotaInterna("");
      await carregar();
      try {
        await navigator.clipboard.writeText(j.orcamento.url);
        setCopiado(j.orcamento.id);
      } catch {
        /* ignore */
      }
    } finally {
      setEnviando(false);
    }
  }

  if (!liberado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="text-sm font-semibold text-accent">Comercial</p>
        <h1 className="mt-2 text-3xl font-bold">Orçamentos</h1>
        <p className="mt-2 text-sm text-muted">Mesma senha do painel de cupons / pedidos.</p>
        <form onSubmit={entrar} className="mt-8 space-y-3">
          <input
            type="password"
            className="w-full rounded-xl border border-line px-4 py-3 text-sm"
            placeholder="Senha"
            value={senhaDigitada}
            onChange={(e) => setSenhaDigitada(e.target.value)}
          />
          {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
          <button type="submit" className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-accent">Comercial</p>
          <h1 className="mt-2 text-3xl font-bold">Orçamento personalizado</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Cole a mensagem do cliente, gere a elaboração com a IA, ajuste valor e desconto, e envie o link. O cliente lê
            o contrato e paga. Confirmação chega em msmoromija@gmail.com e atendimento@guix.net.br.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/painel/pedidos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Pedidos
          </a>
          <a href="/painel/cupons" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Cupons
          </a>
          <button type="button" onClick={sair} className="rounded-full border border-line px-4 py-2 text-xs">
            Sair
          </button>
        </div>
      </div>

      <form onSubmit={criar} className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Novo link</h2>
        <label className="block text-sm">
          Título
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Nome do cliente / negócio (opcional)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            placeholder="Ex.: Clínica Horizonte"
          />
        </label>
        <label className="block text-sm">
          Domínio do cliente (opcional)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={dominio}
            onChange={(e) => setDominio(e.target.value)}
            placeholder="cliente.com.br"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <span className="mt-1 block text-xs text-muted">
            Será preenchido automaticamente no painel de e-mails quando o orçamento for selecionado.
          </span>
        </label>

        <div className="rounded-xl border border-dashed border-line bg-slate-50/80 p-3">
          <label className="block text-sm font-medium">
            Mensagem do cliente
            <textarea
              className="mt-1 min-h-[120px] w-full rounded-xl border border-line bg-white px-3 py-2"
              value={mensagemCliente}
              onChange={(e) => setMensagemCliente(e.target.value)}
              placeholder="Cole aqui o WhatsApp / e-mail com o que o cliente pediu…"
            />
          </label>
          <button
            type="button"
            disabled={iaOcupada}
            onClick={() => void gerarElaboracao()}
            className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {gerandoIa ? "Gerando com a IA…" : "Gerar elaboração com a IA"}
          </button>
        </div>

        <label className="block text-sm">
          Elaboração (o que entra no orçamento)
          <textarea
            ref={elaboracaoRef}
            className="mt-1 min-h-[220px] w-full rounded-xl border border-line px-3 py-2 font-mono text-[13px] leading-5"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="A IA preenche neste formato: ORÇAMENTO COMERCIAL → objetivo, funcionalidades e benefícios. Você pode editar à mão."
            required
          />
        </label>
        {!descricao.trim() ? (
          <p className="text-xs text-muted">Gere com a IA ou escreva o escopo antes de criar o link.</p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm">
            Pedir correção à IA (opcional)
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={correcaoIa}
              onChange={(e) => setCorrecaoIa(e.target.value)}
              placeholder="Ex.: tire a área de rotas; destaque o painel admin"
              disabled={!descricao.trim() || iaOcupada}
            />
          </label>
          <button
            type="button"
            disabled={iaOcupada || !descricao.trim()}
            onClick={() => void corrigirElaboracao()}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {corrigindoIa ? "Corrigindo…" : "Corrigir com a IA"}
          </button>
        </div>

        <label className="block text-sm">
          Prazo de elaboração (vai para o contrato)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            placeholder="Ex.: até 24 horas"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Valor padrão (R$)
            <input
              type="number"
              step="0.01"
              min="500"
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={valorReais}
              onChange={(e) => setValorReais(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Desconto (R$)
            <input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={descontoReais}
              onChange={(e) => setDescontoReais(e.target.value)}
            />
          </label>
        </div>
        <p className="text-sm text-muted">
          Total a cobrar: <strong className="text-ink">{formatarReais(totalPreview)}</strong>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Criado por
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={criadoPor}
              onChange={(e) => setCriadoPor(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Nota interna (não aparece no link)
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
            />
          </label>
        </div>
        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
        {ok ? <p className="break-all text-sm text-emerald-700">{ok}</p> : null}
        <button
          type="submit"
          disabled={enviando || iaOcupada || descricao.trim().length < 20}
          className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {enviando ? "Gerando…" : "Gerar link de orçamento"}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Links recentes</h2>
        <ul className="mt-4 space-y-3">
          {itens.map((o) => (
            <li key={o.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.titulo}</p>
                  <p className="text-xs text-muted">
                    {o.clienteNome || "—"} · {o.dominio || "domínio não informado"} · prazo {o.prazo || "—"} · {o.status} ·{" "}
                    {new Date(o.criadoEm).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 text-sm">
                    {formatarReais(o.valorCentavos)}
                    {o.descontoCentavos ? ` − ${formatarReais(o.descontoCentavos)}` : ""} ={" "}
                    <strong>{formatarReais(o.totalCentavos)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                  onClick={() => {
                    void navigator.clipboard.writeText(o.url);
                    setCopiado(o.id);
                  }}
                >
                  {copiado === o.id ? "Copiado" : "Copiar link"}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-[11px] text-muted">{o.url}</p>
            </li>
          ))}
          {!itens.length ? <p className="text-sm text-muted">Nenhum orçamento ainda.</p> : null}
        </ul>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando…</main>}>
      <PainelOrcamentos />
    </Suspense>
  );
}
