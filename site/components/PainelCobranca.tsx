"use client";

import { useState } from "react";
import Link from "next/link";
import { checklistDadosPublicacao, mensagemWaDadosPendentes } from "@/lib/cliente/jornada";
import { linkWhatsapp } from "@/lib/contato";
import { pagamentoConfirmado, type Cobranca } from "@/lib/cobranca";
import { formatarReais } from "@/lib/dinheiro";

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

function imagemPix(valor: string) {
  return valor.startsWith("data:") ? valor : `data:image/png;base64,${valor}`;
}

export function PainelCobranca({
  cobranca,
  preview,
  contaHref,
}: {
  cobranca: Cobranca;
  preview?: { url?: string; downloadUrl?: string } | null;
  /** Link da área do cliente (pós-pago). */
  contaHref?: string;
}) {
  const [copiado, setCopiado] = useState<"pix" | "boleto" | null>(null);
  const pago = pagamentoConfirmado(cobranca.status);
  let previewHref = preview?.url || "";
  let conta = contaHref || "";
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("guix.preview");
      if (raw) {
        const p = JSON.parse(raw) as { id?: string; token?: string };
        if (p.id && p.token) {
          if (!previewHref) previewHref = `/p/${p.id}?t=${p.token}`;
          if (!conta) conta = `/conta/${p.id}?t=${encodeURIComponent(p.token)}`;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const waDados = mensagemWaDadosPendentes({
    nomeNegocio: cobranca.descricao || "meu negócio",
  });

  async function copiar(texto: string, tipo: "pix" | "boleto") {
    await navigator.clipboard.writeText(texto);
    setCopiado(tipo);
    window.setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_rgb(15_23_42_/_0.05)]">
      <p className={`text-sm font-semibold ${pago ? "text-emerald-700" : "text-accent"}`}>{cobranca.statusTexto}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">{formatarReais(Math.round(cobranca.valor * 100))}</h2>
      <p className="mt-1 text-sm text-muted">{cobranca.descricao}</p>
      <p className="mt-1 text-sm text-muted">Vencimento {formatarData(cobranca.vencimento)}</p>

      {pago ? (
        <div className="mt-5 space-y-4 text-sm leading-6">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950">
            Pagamento confirmado. Você está na fila de publicação. Domínio, e-mail, site, agenda e WhatsApp entram no ar
            em <strong>até 24 horas</strong> após a confirmação dos dados do negócio.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {conta ? (
              <Link
                href={conta}
                className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
              >
                Abrir área do cliente
              </Link>
            ) : null}
            {previewHref ? (
              <a
                href={previewHref}
                className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:border-accent"
              >
                Ver o site de teste
              </a>
            ) : null}
            <a
              href={waDados}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C7E]"
            >
              Enviar dados no WhatsApp
            </a>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Confirme para acelerar</p>
            <ul className="mt-2 space-y-1 text-muted">
              {checklistDadosPublicacao()
                .slice(0, 4)
                .map((i) => (
                  <li key={i.id}>· {i.titulo}</li>
                ))}
            </ul>
          </div>
        </div>
      ) : null}

      {cobranca.pix ? (
        <div className="mt-6">
          <img src={imagemPix(cobranca.pix.imagem)} alt="QR Code do PIX" className="h-52 w-52 rounded-xl border border-line bg-white p-2" />
          <button
            type="button"
            className="mt-4 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-accent"
            onClick={() => copiar(cobranca.pix!.copiaECola, "pix")}
          >
            {copiado === "pix" ? "Código copiado" : "Copiar código PIX"}
          </button>
        </div>
      ) : null}

      {cobranca.forma === "BOLETO" ? (
        <div className="mt-6 space-y-3">
          {cobranca.bankSlipUrl ? (
            <a href={cobranca.bankSlipUrl} className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark" target="_blank" rel="noreferrer">
              Abrir boleto
            </a>
          ) : null}
          {cobranca.linhaDigitavel ? (
            <div>
              <p className="break-all text-sm text-muted">{cobranca.linhaDigitavel}</p>
              <button
                type="button"
                className="mt-3 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-accent"
                onClick={() => copiar(cobranca.linhaDigitavel!, "boleto")}
              >
                {copiado === "boleto" ? "Linha copiada" : "Copiar linha digitável"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {cobranca.forma === "CREDIT_CARD" && cobranca.invoiceUrl && !pago ? (
        <div className="mt-6">
          <p className="text-sm leading-6 text-muted">
            {cobranca.parcelas > 1
              ? `O cartão será parcelado em ${cobranca.parcelas} vezes na página segura do Asaas. O GuiX.net não vê nem guarda o número.`
              : "O cartão é digitado na página segura do Asaas. O GuiX.net não vê nem guarda o número."}
          </p>
          <a href={cobranca.invoiceUrl} className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            Pagar com cartão
          </a>
        </div>
      ) : null}

      {!pago ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          Dúvida no pagamento?{" "}
          <a className="font-semibold text-accent" href={linkWhatsapp("Olá, estou na tela de pagamento do GuiX.net e preciso de ajuda.")}>
            Falar no WhatsApp
          </a>
        </p>
      ) : null}

      {cobranca.aviso ? <p className="mt-4 text-sm leading-6 text-muted">{cobranca.aviso}</p> : null}
    </div>
  );
}
