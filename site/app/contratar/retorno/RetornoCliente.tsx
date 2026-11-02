"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PainelCobranca } from "@/components/PainelCobranca";
import { pagamentoConfirmado, type Cobranca } from "@/lib/cobranca";
import { linkWhatsapp } from "@/lib/contato";

type PreviewLinks = { url?: string; downloadUrl?: string };

export function RetornoCliente() {
  const params = useSearchParams();
  const id = params.get("cobranca");
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [preview, setPreview] = useState<PreviewLinks | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    const guardado = sessionStorage.getItem("guix.cobranca");
    if (guardado) {
      try {
        const salvo = JSON.parse(guardado) as Cobranca;
        if (salvo.id === id) setCobranca(salvo);
      } catch {
        sessionStorage.removeItem("guix.cobranca");
      }
    }

    let ativo = true;
    let timer = 0;

    async function ler() {
      try {
        const resposta = await fetch(`/api/pagamentos/${id}`);
        const json = await resposta.json();
        if (!resposta.ok) throw new Error(json.erro || "Não foi possível consultar a cobrança.");
        if (!ativo) return;
        setCobranca(json.cobranca);
        if (json.preview) setPreview(json.preview);
        setErro("");
        if (!pagamentoConfirmado(json.cobranca.status)) {
          timer = window.setTimeout(ler, 8000);
        }
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível consultar a cobrança.");
      }
    }

    ler();
    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [id]);

  if (!id) {
    return <p className="text-muted">Nenhuma cobrança foi informada.</p>;
  }

  return (
    <div className="mt-8 max-w-xl">
      {cobranca ? (
        <PainelCobranca cobranca={cobranca} preview={preview} />
      ) : (
        <p className="text-muted">Consultando o pagamento…</p>
      )}
      {erro ? (
        <p className="mt-4 text-sm leading-6 text-muted" role="alert">
          {erro}{" "}
          <a className="font-semibold text-accent" href={linkWhatsapp()}>
            Falar no WhatsApp
          </a>
        </p>
      ) : null}
    </div>
  );
}
