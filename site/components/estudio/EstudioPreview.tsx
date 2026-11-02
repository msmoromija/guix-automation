"use client";

import { SiteLivePreview } from "@/components/preview/SiteLivePreview";
import type { VisualConfig } from "@/lib/estudio/visual";

export function EstudioPreview({
  site,
  visual,
  aberto,
  onToggle,
}: {
  site: Parameters<typeof SiteLivePreview>[0]["site"];
  visual: VisualConfig;
  aberto?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_50px_-28px_rgb(15_23_42_/_0.45)]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-accent">SIMULADOR DO SITE</p>
          <p className="text-xs text-muted">Cara real: cores, letras, serviços e endereço.</p>
        </div>
        {onToggle ? (
          <button type="button" className="text-xs font-medium text-ink underline lg:hidden" onClick={onToggle}>
            {aberto ? "Recolher" : "Ver o site"}
          </button>
        ) : null}
      </div>
      <div className={aberto === false ? "hidden lg:block" : "block"}>
        <div className="relative h-[min(78vh,820px)] overflow-y-auto overflow-x-hidden bg-slate-200">
          <div className="origin-top-left scale-[0.62] pointer-events-none" style={{ width: "161.29%" }}>
            <SiteLivePreview site={site} visual={visual} modo="rascunho" />
          </div>
        </div>
      </div>
    </div>
  );
}
