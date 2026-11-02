import type { Metadata } from "next";
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

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">CONTRATAÇÃO</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Quero meu site</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Conte o básico e escolha como pagar. O PIX e o boleto abrem aqui. O cartão abre na página
        segura do Asaas, em até 12 vezes.
        {sp.nicho ? (
          <>
            {" "}
            Modelo pré-selecionado: <strong>{sp.nicho}</strong>.
          </>
        ) : null}
      </p>
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
