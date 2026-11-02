import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Seo } from "@/components/Seo";
import { lerLead, mensagemLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(lerLead()), []);
  const o = site.obrigado;
  const txt = lead?.tipo === "agendamento" ? o.agendamento : o.contato;

  return (
    <section className="mx-auto flex min-h-[60svh] max-w-xl flex-col justify-center px-5 py-16">
      <Seo titulo={txt.titulo} />
      <div className="h-px w-16 bg-site-accent" />
      <h1 className="mt-6 text-4xl text-site-primary md:text-5xl">{txt.titulo}</h1>
      <p className="mt-4 leading-relaxed text-site-muted">{txt.texto}</p>
      <div className="mt-10 flex flex-col gap-3">
        {lead && (
          <a href={whatsappUrl(site.empresa.whatsapp, mensagemLead(lead, site))} target="_blank" rel="noopener noreferrer" data-action="whatsapp" className="btn-primary">
            {o.botao_whatsapp}
          </a>
        )}
        <Link to="/" className="btn-secondary">{o.botao_inicio}</Link>
      </div>
    </section>
  );
}
