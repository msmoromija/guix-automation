"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AprovarPrototipo } from "@/components/conta/AprovarPrototipo";
import { KitImpressao } from "@/components/conta/KitImpressao";

type Dados = {
  id: string;
  nicho: string;
  nome: string;
  status: string;
  expiraEm: string;
  downloadUrl: string;
  demoUrl: string;
  contratarUrl: string;
  previewUrl: string;
  extratoUrl?: string;
  agendarUrl?: string;
  logoUrl?: string;
  aprovadoEm?: string;
  prazoIntegracao?: string;
  cidade?: string;
  whatsapp?: string;
  resumo: { empresa?: string; heroTitulo?: string; slogan?: string };
};

function Conta() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || "";
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState("");

  useEffect(() => {
    setOrigem(window.location.origin);
  }, []);

  useEffect(() => {
    if (!params.id || !token) {
      setErro("Acesso sem token. Use o link completo do protótipo.");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/prototipo/${params.id}?t=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Acesso negado");
        return;
      }
      setDados(json);
    })();
  }, [params.id, token]);

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Área do cliente</h1>
        <p className="mt-3 text-muted">{erro}</p>
      </main>
    );
  }

  if (!dados) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo sua área…</main>;
  }

  const editarUrl = `/visualizar/${dados.id}`;
  const agendaUrl = `/conta/${dados.id}/agenda?t=${encodeURIComponent(token)}`;
  const extratoUrl = dados.extratoUrl || `/conta/${dados.id}/extrato?t=${encodeURIComponent(token)}`;
  const agendarAbsoluto = `${origem}${dados.agendarUrl || `/visualizar/${dados.id}#agendar`}`;
  const jaAprovado = dados.status === "aprovado" || dados.status === "pago" || Boolean(dados.aprovadoEm);

  const cards = [
    {
      titulo: "Agenda e solicitações",
      texto: "Grade por profissional, ausências e caixa de pedidos — aceite ou recuse com horário e dados do cliente.",
      href: agendaUrl,
      cta: "Abrir agenda",
    },
    {
      titulo: "Extrato PDF / imagem",
      texto: "Baixe o cartão do protótipo com token, QR e prazo de integração GuiX.",
      href: extratoUrl,
      cta: "Abrir extrato",
    },
    {
      titulo: "Protótipo / preview",
      texto: "Veja o site gerado e teste o agendamento como o cliente final.",
      href: editarUrl,
      cta: "Abrir preview",
    },
    {
      titulo: "Download site.json",
      texto: "Arquivo de configuração 1.0.0 do seu site — como combinado.",
      href: dados.downloadUrl,
      cta: "Baixar JSON",
      external: true,
    },
    {
      titulo: "Imagens",
      texto: "Trocar fotos da biblioteca, Unsplash ou upload próprio (isolado).",
      href: `/painel/midia?clienteId=${encodeURIComponent(`t${dados.id}`)}`,
      cta: "Abrir mídia",
    },
    {
      titulo: "Contratar / publicar",
      texto: "PIX, boleto ou cartão. Pagamento libera domínio, e-mail e publicação.",
      href: dados.contratarUrl,
      cta: "Ir para contratação",
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">ÁREA DO CLIENTE</p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
        {dados.resumo.empresa || dados.nome}
      </h1>
      <p className="mt-2 text-muted">
        Status: <strong>{dados.status}</strong> · modelo {dados.nicho} · expira{" "}
        {new Date(dados.expiraEm).toLocaleDateString("pt-BR")}
        {dados.prazoIntegracao ? (
          <>
            {" "}
            · integração até {new Date(dados.prazoIntegracao).toLocaleString("pt-BR")}
          </>
        ) : null}
      </p>

      <div className="mt-8">
        <AprovarPrototipo
          token={dados.id}
          nome={dados.resumo.empresa || dados.nome}
          emailInicial={undefined}
          telefoneInicial={dados.whatsapp}
          jaAprovado={jaAprovado}
          prazoIntegracao={dados.prazoIntegracao}
          contratarUrl={dados.contratarUrl}
          extratoUrl={extratoUrl}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {origem ? (
          <KitImpressao nome={dados.resumo.empresa || dados.nome} agendarUrl={agendarAbsoluto} logoUrl={dados.logoUrl} />
        ) : null}
        {cards.map((c) => (
          <article key={c.titulo} className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-semibold">{c.titulo}</h2>
            <p className="mt-2 text-sm text-muted">{c.texto}</p>
            {c.external ? (
              <a href={c.href} className="mt-4 inline-flex text-sm font-semibold text-accent underline">
                {c.cta}
              </a>
            ) : (
              <Link href={c.href} className="mt-4 inline-flex text-sm font-semibold text-accent underline">
                {c.cta}
              </Link>
            )}
          </article>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted">
        Guarde este link e o token: a área usa acesso pessoal. Sem o token, ninguém acessa seu JSON nem o preview.
      </p>
    </main>
  );
}

export default function ContaPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Abrindo…</main>}>
      <Conta />
    </Suspense>
  );
}
