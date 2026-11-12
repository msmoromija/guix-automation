"use client";

import { Suspense, useEffect, useState } from "react";
import { formatarReais } from "@/lib/dinheiro";

type Pedido = {
  id: string;
  criadoEm: string;
  status: string;
  pagoEm?: string;
  planoNome: string;
  nichoNome: string;
  configuracao: string;
  centavos: number;
  descontoCentavos?: number;
  cupomCodigo?: string | null;
  forma: string;
  descricao: string;
  cliente: { nome: string; email: string; telefone: string; documento: string };
  temPrototipo: boolean;
  previewId?: string | null;
  pacoteZipKey?: string | null;
  pacoteJsonKey?: string | null;
  temZip?: boolean;
  whatsappUrl?: string;
  links?: { visualizar?: string; conta?: string; completo?: string };
  asaas?: { invoiceUrl?: string | null; bankSlipUrl?: string | null };
};

const STORAGE_KEY = "guix.cupons.senha";

function PainelPedidos() {
  const [senha, setSenha] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [liberado, setLiberado] = useState(false);
  const [itens, setItens] = useState<Pedido[]>([]);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "aguardando" | "pago">("todos");

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

  // Atualiza a lista a cada 20s para pegar webhook "pago"
  useEffect(() => {
    if (!liberado || !senha) return;
    const t = window.setInterval(() => void carregar(senha), 20000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liberado, senha]);

  async function carregar(s = senha) {
    setErro("");
    const res = await fetch("/api/painel/pedidos", {
      headers: { "x-cupons-senha": s },
    });
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
    setItens([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function baixar(path: string) {
    const sep = path.includes("?") ? "&" : "?";
    window.open(`${path}${sep}senha=${encodeURIComponent(senha)}`, "_blank");
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";

  const lista = itens.filter((p) => (filtro === "todos" ? true : p.status === filtro));
  const pagos = itens.filter((p) => p.status === "pago").length;
  const aguardando = itens.filter((p) => p.status === "aguardando").length;

  if (!liberado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">COMERCIAL / OPS GUIX</p>
        <h1 className="mt-2 text-3xl font-bold">Pedidos</h1>
        <p className="mt-2 text-sm text-muted">Mesma senha dos cupons. Aqui você confirma quem comprou e baixa JSON/ZIP.</p>
        <form onSubmit={entrar} className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6">
          <label className="block text-sm font-semibold">
            Senha
            <input
              className={campo}
              type="password"
              autoComplete="current-password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              required
            />
          </label>
          {erro ? <p className="text-sm text-rose-700">{erro}</p> : null}
          <button type="submit" className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">COMERCIAL / OPS GUIX</p>
          <h1 className="mt-2 text-3xl font-bold">Pedidos e pacotes</h1>
          <p className="mt-2 text-sm text-muted">
            Status <strong>Pago</strong> = webhook Asaas confirmou. Baixe o JSON e o ZIP para publicar no domínio.
          </p>
          <p className="mt-2 text-xs text-muted">
            {pagos} pago(s) · {aguardando} aguardando · atualiza sozinho a cada 20s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/painel/orcamentos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Orçamentos
          </a>
          <a href="/painel/cupons" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Cupons
          </a>
          <button type="button" onClick={() => void carregar()} className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Atualizar
          </button>
          <button type="button" onClick={sair} className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Sair
          </button>
        </div>
      </div>

      {erro ? <p className="mt-4 text-sm text-rose-700">{erro}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos"],
            ["aguardando", "Aguardando pagamento"],
            ["pago", "Pagos"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFiltro(id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${filtro === id ? "bg-accent text-white" : "border border-line bg-white"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <section className="mt-8 space-y-4">
        {lista.length === 0 ? <p className="text-sm text-muted">Nenhum pedido neste filtro.</p> : null}
        {lista.map((p) => {
          const pago = p.status === "pago";
          const temArquivos = Boolean(p.temPrototipo || p.temZip || p.pacoteZipKey || p.pacoteJsonKey);
          return (
            <article
              key={p.id}
              className={`rounded-2xl border bg-white p-5 ${pago ? "border-emerald-300" : "border-line"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        pago ? "bg-emerald-50 text-emerald-800" : "bg-[#FFF7ED] text-accent"
                      }`}
                    >
                      {pago ? "Pago — pode publicar" : "Aguardando pagamento"}
                    </span>
                    <span className="text-xs text-muted">{new Date(p.criadoEm).toLocaleString("pt-BR")}</span>
                    {p.pagoEm ? (
                      <span className="text-xs text-emerald-800">pago em {new Date(p.pagoEm).toLocaleString("pt-BR")}</span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-lg font-bold">{p.cliente.nome}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {p.planoNome} · {p.nichoNome} · {p.forma}
                    {p.configuracao === "equipe" ? " · equipe" : " · IA"}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatarReais(p.centavos)}</p>
                  {p.cupomCodigo ? (
                    <p className="mt-1 text-xs text-emerald-800">
                      Cupom {p.cupomCodigo}
                      {p.descontoCentavos ? ` (−${formatarReais(p.descontoCentavos)})` : ""}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-muted">
                    {p.cliente.email} · WhatsApp {p.cliente.telefone} · doc {p.cliente.documento}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {p.temPrototipo ? `Protótipo: ${p.previewId}` : "Sem protótipo — montar com os dados do pedido"}
                    {" · "}
                    Cobrança {p.id}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => baixar(`/api/painel/pedidos/${encodeURIComponent(p.id)}/completo.json`)}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
                  >
                    Baixar JSON
                  </button>
                  {temArquivos || p.temPrototipo ? (
                    <button
                      type="button"
                      onClick={() => baixar(`/api/painel/pedidos/${encodeURIComponent(p.id)}/pacote.zip`)}
                      className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-dark"
                    >
                      Baixar ZIP
                    </button>
                  ) : (
                    <span className="rounded-full border border-line px-4 py-2 text-center text-xs text-muted">Sem ZIP (sem protótipo)</span>
                  )}
                  {p.links?.visualizar ? (
                    <a href={p.links.visualizar} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-center text-xs font-semibold">
                      Ver preview
                    </a>
                  ) : null}
                  {p.asaas?.invoiceUrl ? (
                    <a href={p.asaas.invoiceUrl} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-center text-xs font-semibold">
                      Fatura Asaas
                    </a>
                  ) : null}
                  {p.whatsappUrl ? (
                    <a href={p.whatsappUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-center text-xs font-semibold text-[#128C7E]">
                      Avisar no WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando pedidos…</main>}>
      <PainelPedidos />
    </Suspense>
  );
}
