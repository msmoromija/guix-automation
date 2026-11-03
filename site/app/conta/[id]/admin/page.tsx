"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { EditorAdmin } from "@/components/conta/EditorAdmin";

function AdminPageInner() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || params.id || "";

  if (!params.id || !token) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Administrador do site</h1>
        <p className="mt-3 text-muted">Acesso sem token. Use o link completo da área do cliente.</p>
      </main>
    );
  }

  return <EditorAdmin id={params.id} token={token} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Abrindo controle…</main>}>
      <AdminPageInner />
    </Suspense>
  );
}
