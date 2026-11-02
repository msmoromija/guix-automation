import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/content";
import { Seo } from "@/components/Seo";
import { leadMessage, readLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(readLead()), []);
  const o = site.obrigado;
  const bloco = lead?.tipo === "agendamento" ? o.agendamento : o.contato;
  return (
    <section className="mx-auto max-w-xl px-5 py-20 text-center">
      <Seo title={bloco.titulo} />
      <h1 className="text-4xl sm:text-5xl">{bloco.titulo}</h1>
      <p className="mt-4 text-text-muted">{bloco.texto}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {lead && (
          <a href={whatsappUrl(site.empresa.whatsapp, leadMessage(site, lead))} target="_blank" rel="noreferrer" data-action="whatsapp" className="btn-primary">{o.botao_whatsapp}</a>
        )}
        <Link to="/" className="btn-secondary">{o.botao_inicio}</Link>
      </div>
    </section>
  );
}
