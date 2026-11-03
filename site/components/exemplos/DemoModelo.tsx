"use client";

import { SiteLivePreview } from "@/components/preview/SiteLivePreview";
import { visualPadrao, type VisualConfig } from "@/lib/estudio/visual";

type Site = Parameters<typeof SiteLivePreview>[0]["site"];

export function DemoModelo({
  nicho,
  site,
}: {
  nicho: string;
  site: Site;
}) {
  const visual: VisualConfig = {
    ...visualPadrao(nicho),
    agendamento: true,
    // Demo pública: horário entra confirmado — sem depender do WhatsApp
    modoConfirmacaoAgenda: "automatico",
  };

  return (
    <div className="bg-white text-ink">
      <div className="sticky top-[3.25rem] z-30 border-b border-orange-200 bg-[#FFF7ED] px-4 py-2.5 text-center text-xs leading-5 text-slate-700 sm:top-[3.75rem]">
        <strong className="text-accent">Agenda no site:</strong> role até{" "}
        <a href="#agendar" className="font-semibold text-accent underline">
          Agendar
        </a>
        , informe <strong>nome, WhatsApp e e-mail</strong>, escolha o horário. Ocupe some ou fica vermelho. Cancele até{" "}
        <strong>3 horas</strong> antes. O dono gerencia depois da compra no{" "}
        <a href="/demo/controle" className="font-semibold text-accent underline">
          controle do administrador
        </a>
        .
      </div>
      <SiteLivePreview site={site} visual={visual} siteId={`demo-${nicho}`} />
    </div>
  );
}
