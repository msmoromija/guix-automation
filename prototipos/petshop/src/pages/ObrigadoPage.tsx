import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Seo } from "@/components/Seo";
import { leadMessage, readLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const o = site.obrigado;
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(readLead()), []);

  const tipo = lead?.tipo === "agendamento" ? "agendamento" : "contato";
  const texto = o[tipo];
  return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center md:py-24">
      <Seo titulo={texto.titulo} />
      <span className="eyebrow-line mx-auto" />
      <h1 data-field={`obrigado.${tipo}.titulo`} className="text-3xl font-bold text-brand md:text-5xl">{texto.titulo}</h1>
      <p data-field={`obrigado.${tipo}.texto`} className="mt-4 text-lg text-ink-muted">{texto.texto}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {lead && (
          <a href={whatsappUrl(site.empresa.whatsapp, leadMessage(site, lead))} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="obrigado.botao_whatsapp" className="btn-primary">
            {o.botao_whatsapp}
          </a>
        )}
        <Link to="/" data-field="obrigado.botao_inicio" className="btn-secondary">{o.botao_inicio}</Link>
      </div>
    </div>
  );
}
