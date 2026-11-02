"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
  resumo: { empresa?: string; heroTitulo?: string };
};

function Conta() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || "";
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");

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

  const cards = [
    {
      titulo: "Protótipo / preview",
      texto: "Veja o resumo do site gerado e o modelo visual.",
      href: `/p/${dados.id}?t=${token}`,
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
      href: `/painel/midia?clienteId=${encodeURIComponent(`p${dados.id}`)}`,
      cta: "Abrir mídia",
    },
    {
      titulo: "Contratar / publicar",
      texto: "Pagamento libera domínio, e-mail e publicação em até 24h.",
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
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
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
        Guarde este link: a área usa um token pessoal. Sem o token, ninguém acessa seu JSON nem o
        preview.
      </p>
    </main>
  );
}

export default function ContaPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-muted">Carregando…</main>}>
      <Conta />
    </Suspense>
  );
}
