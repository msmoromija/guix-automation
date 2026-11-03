import type { Metadata } from "next";
import Link from "next/link";
import { ContratarForm } from "./ContratarForm";
import type { PlanoId } from "@/lib/planos";

export const metadata: Metadata = {
  title: "Quero meu site",
  description: "Contrate a presença digital do seu negócio. PIX, boleto ou cartão em até 12 vezes.",
};

export default async function ContratarPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; nicho?: string; preview?: string; t?: string }>;
}) {
  const sp = await searchParams;
  const inicial: PlanoId = sp.plano === "avancado" ? "avancado" : "simples";
  const temPreview = Boolean(sp.preview && sp.t);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">CONTRATAÇÃO</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Quero meu site</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Aqui você compra a estrutura com <strong>domínio próprio</strong>, e-mail profissional e publicação. PIX e
        boleto abrem nesta página; o cartão segue na página segura do Asaas (até 12x). Se o comercial te enviou um
        cupom, digite o código no formulário antes de gerar o pagamento.
        {sp.nicho ? (
          <>
            {" "}
            Modelo: <strong>{sp.nicho}</strong>.
          </>
        ) : null}
      </p>

      {temPreview ? (
        <div className="mt-6 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
          <p className="font-semibold">Protótipo vinculado</p>
          <p className="mt-1 leading-6">
            Este pedido usa o token <strong className="font-mono tracking-wide">{sp.preview}</strong>. Depois do
            pagamento, a publicação parte desse site de teste.{" "}
            <Link href={`/visualizar/${sp.preview}`} className="font-semibold underline">
              Ver o rascunho
            </Link>
            {" · "}
            <Link href={`/conta/${sp.preview}?t=${encodeURIComponent(sp.t || "")}`} className="font-semibold underline">
              Área do cliente
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-6 max-w-2xl rounded-2xl border border-line bg-canvas px-5 py-4 text-sm text-slate-700">
          <p className="font-semibold text-ink">Ainda não montou o protótipo?</p>
          <p className="mt-1 leading-6">
            O caminho recomendado:{" "}
            <Link href="/prototipar" className="font-semibold text-accent underline">
              Prototipar
            </Link>{" "}
            → <strong>Salvar protótipo</strong> (gera o token e o link) → voltar aqui em{" "}
            <strong>Quero comprar e publicar</strong>. Assim o domínio e a publicação usam o site que você já viu.
          </p>
        </div>
      )}

      <div className="mt-10">
        <ContratarForm
          planoInicial={inicial}
          nichoInicial={sp.nicho}
          previewId={sp.preview}
          previewToken={sp.t}
        />
      </div>
    </main>
  );
}
