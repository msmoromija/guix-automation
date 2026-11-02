"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Compat: tokens antigos em /p/{id}?t= vão para /visualizar/{token}. */
export default function RedirectPreview() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  useEffect(() => {
    const t = (sp.get("t") || params.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    window.location.replace(t ? `/visualizar/${t}` : "/visualizar");
  }, [params.id, sp]);
  return <p className="p-8 text-sm text-muted">Abrindo seu rascunho…</p>;
}
