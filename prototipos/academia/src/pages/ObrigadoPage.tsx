import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { site } from "@/content/site";
import { Header } from "@/components/Header";
import { Rodape } from "@/components/Rodape";
import { WhatsappFlutuante } from "@/components/WhatsappFlutuante";
import { Seo } from "@/components/Seo";
import { leadMessage, readLead, type Lead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ObrigadoPage() {
  const { obrigado, empresa } = site;
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => setLead(readLead()), []);

  const texto = lead?.tipo === "agendamento" ? obrigado.agendamento : obrigado.contato;
  return (
    <>
      <Seo titulo={texto.titulo} />
      <Header />
      <main className="mx-auto flex min-h-[60svh] max-w-2xl flex-col justify-center px-4 py-16">
        <div className="mb-6 h-1 w-10 bg-lime" />
        <h1 className="text-6xl font-bold">{texto.titulo}</h1>
        <p className="mt-4 text-lg text-ink-muted">{texto.texto}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {lead && (
            <a href={whatsappUrl(empresa.whatsapp, leadMessage(lead, site))} target="_blank" rel="noreferrer" data-action="whatsapp" className="btn-primary">
              <MessageCircle size={18} /> {obrigado.botao_whatsapp}
            </a>
          )}
          <Link to="/" className="btn-secondary">{obrigado.botao_inicio}</Link>
        </div>
      </main>
      <Rodape />
      <WhatsappFlutuante />
    </>
  );
}
