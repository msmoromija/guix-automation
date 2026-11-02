import { Suspense } from "react";
import type { Metadata } from "next";
import { RetornoCliente } from "./RetornoCliente";

export const metadata: Metadata = {
  title: "Pagamento",
  description: "Acompanhe o PIX, o boleto ou o cartão da sua contratação GuiX.net.",
};

export default function RetornoPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">PAGAMENTO</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em]">Sua cobrança</h1>
      <Suspense fallback={<p className="mt-8 text-muted">Carregando pagamento…</p>}>
        <RetornoCliente />
      </Suspense>
    </main>
  );
}
