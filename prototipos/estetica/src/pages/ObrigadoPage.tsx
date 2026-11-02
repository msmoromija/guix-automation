import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/content";
import { Seo } from "@/components/Seo";
import { lerLead, mensagemLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const { obrigado, empresa } = site;
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(lerLead()), []);
  const bloco = lead?.tipo === "agendamento" ? obrigado.agendamento : obrigado.contato;
  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center sm:py-28">
      <Seo titulo={bloco.titulo} />
      <h1 className="text-4xl text-brand sm:text-5xl">{bloco.titulo}</h1>
      <p className="mt-5 leading-relaxed text-ink-muted">{bloco.texto}</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {lead && (
          <a href={whatsappUrl(empresa.whatsapp, mensagemLead(site, lead))} target="_blank" rel="noreferrer" data-action="whatsapp" className="btn-primary">
            {obrigado.botao_whatsapp}
          </a>
        )}
        <Link to="/" className="btn-secondary">{obrigado.botao_inicio}</Link>
      </div>
    </div>
  );
}
