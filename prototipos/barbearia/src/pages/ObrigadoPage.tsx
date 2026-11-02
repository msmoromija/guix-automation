import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { leadMessage, readLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(readLead()), []);
  const o = site.obrigado;
  const tipo = lead?.tipo === "agendamento" ? "agendamento" : "contato";
  const txt = o[tipo];

  return (
    <Layout>
      <Seo title={txt.titulo} />
      <section className="mx-auto max-w-xl px-4 py-16 text-center md:py-24">
        <h1 data-field={`obrigado.${tipo}.titulo`} className="text-4xl font-bold md:text-5xl">{txt.titulo}</h1>
        <p data-field={`obrigado.${tipo}.texto`} className="mt-4 text-text-muted">{txt.texto}</p>
        <div className="mt-8 flex flex-col gap-3">
          {lead && (
            <a href={whatsappUrl(site.empresa.whatsapp, leadMessage(site, lead))} target="_blank" rel="noopener noreferrer" data-action="whatsapp" data-field="obrigado.botao_whatsapp" className="btn-primary">
              {o.botao_whatsapp}
            </a>
          )}
          <Link to="/" data-field="obrigado.botao_inicio" className="btn-secondary">{o.botao_inicio}</Link>
        </div>
      </section>
    </Layout>
  );
}
