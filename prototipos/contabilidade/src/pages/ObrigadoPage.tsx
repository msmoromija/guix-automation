import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/content";
import { Seo } from "@/components/Seo";
import { leadMessage, readLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const { obrigado, empresa } = site;
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(readLead()), []);
  const bloco = lead?.tipo === "agendamento" ? obrigado.agendamento : obrigado.contato;

  return (
    <section className="py-16 md:py-24">
      <Seo title={bloco.titulo} />
      <div className="mx-auto max-w-xl px-4 text-center">
        <span className="eyebrow-rule mx-auto" />
        <h1 className="text-3xl font-semibold md:text-4xl">{bloco.titulo}</h1>
        <p className="mt-4 text-muted-foreground">{bloco.texto}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {lead && (
            <a href={whatsappUrl(empresa.whatsapp, leadMessage(site, lead))} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="obrigado.botao_whatsapp" className="btn-primary">
              {obrigado.botao_whatsapp}
            </a>
          )}
          <Link to="/" data-field="obrigado.botao_inicio" className="btn-secondary">{obrigado.botao_inicio}</Link>
        </div>
      </div>
    </section>
  );
}
