"use client";

import { Suspense } from "react";
import { EstudioForm } from "@/components/estudio/EstudioForm";

export default function PrototiparPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-muted">Carregando o estúdio…</main>}>
      <EstudioForm />
    </Suspense>
  );
}
