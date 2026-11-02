"use client";

import { useState } from "react";
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

export function PainelCobranca({ cobranca }: { cobranca: Cobranca }) {
  const [copiado, setCopiado] = useState<"pix" | "boleto" | null>(null);
  const pago = pagamentoConfirmado(cobranca.status);

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
        <p className="mt-5 text-sm leading-6">
          Recebemos a confirmação. O próximo passo é publicar a presença do seu negócio. Se quiser adiantar os dados,{" "}
          <a href={linkWhatsapp("Olá, acabei de pagar o GuiX.net e quero enviar os dados do negócio.")} className="font-semibold text-accent">
            fale no WhatsApp
          </a>
          .
        </p>
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

      {cobranca.aviso ? <p className="mt-4 text-sm leading-6 text-muted">{cobranca.aviso}</p> : null}
    </div>
  );
}
