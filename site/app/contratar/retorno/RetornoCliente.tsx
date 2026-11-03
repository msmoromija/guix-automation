"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PainelCobranca } from "@/components/PainelCobranca";
import { pagamentoConfirmado, type Cobranca } from "@/lib/cobranca";
import { linkWhatsapp } from "@/lib/contato";

type PreviewLinks = { url?: string; downloadUrl?: string };

function hrefVoltarFormulario() {
  try {
    const raw = sessionStorage.getItem("guix.contratar.rascunho");
    const preview = sessionStorage.getItem("guix.preview");
    const q = new URLSearchParams();
    if (raw) {
      const r = JSON.parse(raw) as { plano?: string; nicho?: string };
      if (r.plano === "avancado" || r.plano === "simples") q.set("plano", r.plano);
      if (r.nicho) q.set("nicho", r.nicho);
    }
    if (preview) {
      const p = JSON.parse(preview) as { id?: string; token?: string };
      if (p.id && p.token) {
        q.set("preview", p.id);
        q.set("t", p.token);
      }
    }
    const s = q.toString();
    return s ? `/contratar?${s}` : "/contratar";
  } catch {
    return "/contratar";
  }
}

export function RetornoCliente() {
  const params = useSearchParams();
  const id = params.get("cobranca");
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [preview, setPreview] = useState<PreviewLinks | null>(null);
  const [erro, setErro] = useState("");
  const [voltarHref, setVoltarHref] = useState("/contratar");

  useEffect(() => {
    setVoltarHref(hrefVoltarFormulario());
  }, []);

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
      {cobranca && !pagamentoConfirmado(cobranca.status) ? (
        <p className="mt-6 text-sm leading-6 text-muted">
          Quer PIX, boleto ou cartão de outro jeito?{" "}
          <Link href={voltarHref} className="font-semibold text-accent underline">
            Voltar ao formulário
          </Link>
          {" "}— seus dados ficam preenchidos.
        </p>
      ) : null}
    </div>
  );
}
