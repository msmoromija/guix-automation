"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SiteLivePreview, type AlvoEdicao, type SlotFoto } from "@/components/preview/SiteLivePreview";
import type { VisualConfig } from "@/lib/estudio/visual";

const ZOOM_PASSOS = [75, 90, 100, 125];

function Corpo({
  site,
  visual,
  onEditar,
  onTrocarFoto,
  onTrocarLogo,
  onTexto,
  estreito,
  foco,
  revelado,
}: {
  site: Parameters<typeof SiteLivePreview>[0]["site"] | null;
  visual: VisualConfig;
  onEditar?: (alvo: AlvoEdicao) => void;
  onTrocarFoto?: (slot: SlotFoto) => void;
  onTrocarLogo?: () => void;
  onTexto?: (campo: string, valor: string) => void;
  estreito?: boolean;
  foco?: AlvoEdicao[];
  revelado?: AlvoEdicao[];
}) {
  if (!site) {
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center bg-zinc-200 text-sm text-muted">
        Carregando o modelo do ofício…
      </div>
    );
  }
  return (
    <SiteLivePreview
      site={site}
      visual={visual}
      modo="pagina"
      studio
      estreito={estreito}
      onEditar={onEditar}
      onTrocarFoto={onTrocarFoto}
      onTrocarLogo={onTrocarLogo}
      onTexto={onTexto}
      foco={foco}
      revelado={revelado}
    />
  );
}

function Barra({
  dica,
  vista,
  zoom,
  onVista,
  onZoom,
  onAmpliar,
  onEditar,
  fechar,
}: {
  dica?: string;
  vista: "desktop" | "celular";
  zoom: number;
  onVista: (v: "desktop" | "celular") => void;
  onZoom: (n: number) => void;
  onAmpliar?: () => void;
  onEditar?: (alvo: AlvoEdicao) => void;
  fechar?: () => void;
}) {
  const idx = ZOOM_PASSOS.indexOf(zoom);
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent">SEU SITE</p>
        <p className="truncate text-xs text-muted">{dica || "Clique em Editar no bloco para ir ao campo."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {onEditar ? (
          <button
            type="button"
            className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium"
            onClick={() => onEditar("aparencia")}
          >
            Cores
          </button>
        ) : null}
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${vista === "desktop" ? "bg-ink text-white" : "border border-line"}`}
          onClick={() => onVista("desktop")}
        >
          Tela
        </button>
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${vista === "celular" ? "bg-ink text-white" : "border border-line"}`}
          onClick={() => onVista("celular")}
        >
          Celular
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-2 py-1 text-[11px]"
          disabled={idx <= 0}
          onClick={() => onZoom(ZOOM_PASSOS[Math.max(0, idx - 1)])}
        >
          −
        </button>
        <span className="w-9 text-center text-[11px] tabular-nums">{zoom}%</span>
        <button
          type="button"
          className="rounded-full border border-line px-2 py-1 text-[11px]"
          disabled={idx >= ZOOM_PASSOS.length - 1}
          onClick={() => onZoom(ZOOM_PASSOS[Math.min(ZOOM_PASSOS.length - 1, idx + 1)])}
        >
          +
        </button>
        {onAmpliar ? (
          <button type="button" className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium" onClick={onAmpliar}>
            Ampliar
          </button>
        ) : null}
        {fechar ? (
          <button type="button" className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white" onClick={fechar}>
            Fechar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EstudioPreview({
  site,
  visual,
  aberto,
  onToggle,
  dica,
  variante = "painel",
  onEditar,
  onTrocarFoto,
  onTrocarLogo,
  onTexto,
  pedido,
  foco,
  revelado,
}: {
  site: Parameters<typeof SiteLivePreview>[0]["site"] | null;
  visual: VisualConfig;
  aberto?: boolean;
  onToggle?: () => void;
  dica?: string;
  variante?: "painel" | "folha";
  onEditar?: (alvo: AlvoEdicao) => void;
  onTrocarFoto?: (slot: SlotFoto) => void;
  onTrocarLogo?: () => void;
  onTexto?: (campo: string, valor: string) => void;
  pedido?: React.ReactNode;
  foco?: AlvoEdicao[];
  revelado?: AlvoEdicao[];
}) {
  const [vista, setVista] = useState<"desktop" | "celular">("desktop");
  const [zoom, setZoom] = useState(100);
  const [ampla, setAmpla] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = foco?.[0];
    if (!alvo) return;
    const t = window.setTimeout(() => {
      paneRef.current?.querySelector(`[data-preview-alvo="${alvo}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
    return () => window.clearTimeout(t);
  }, [foco?.[0]]);

  const moldura = useMemo(() => {
    const escala = zoom / 100;
    if (vista === "celular") {
      return {
        width: 390,
        margin: "16px auto",
        transform: escala === 1 ? undefined : `scale(${escala})`,
        transformOrigin: "top center",
        boxShadow: "0 18px 50px -24px rgb(15 23 42 / 0.45)",
        borderRadius: 24,
        overflow: "hidden" as const,
        background: "#fff",
      };
    }
    if (escala === 1) return undefined;
    return {
      width: `${100 / escala}%`,
      transform: `scale(${escala})`,
      transformOrigin: "top left",
    };
  }, [vista, zoom]);

  const emp = site?.empresa as { whatsapp?: string; whatsapp_mensagem?: string } | undefined;
  const waHref = emp?.whatsapp
    ? `https://wa.me/${emp.whatsapp}?text=${encodeURIComponent(emp.whatsapp_mensagem || "Olá")}`
    : "";

  function painel(opts: { ampliar?: boolean; fechar?: () => void }) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-zinc-200">
        <Barra
          dica={dica}
          vista={vista}
          zoom={zoom}
          onVista={setVista}
          onZoom={setZoom}
          onAmpliar={opts.ampliar ? () => setAmpla(true) : undefined}
          onEditar={onEditar}
          fechar={opts.fechar}
        />
        <div ref={paneRef} className="relative min-h-0 flex-1 overflow-auto bg-zinc-300">
          <div style={moldura}>
            <Corpo site={site} visual={visual} onEditar={onEditar} onTrocarFoto={onTrocarFoto} onTrocarLogo={onTrocarLogo} onTexto={onTexto} estreito={vista === "celular"} foco={foco} revelado={revelado} />
          </div>
          {pedido}
          {visual.whatsappFlutuante && waHref ? (
            <a
              href={waHref}
              onClick={(e) => {
                e.preventDefault();
                onEditar?.("contato");
              }}
              className="absolute bottom-4 right-4 z-30 px-4 py-3 text-sm font-semibold shadow-lg"
              style={{ background: "#25D366", color: "#052e16", borderRadius: 999 }}
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (variante === "folha") {
    if (!aberto) return null;
    return <div className="fixed inset-0 z-[70] flex flex-col bg-white lg:hidden">{painel({ fechar: onToggle })}</div>;
  }

  return (
    <>
      {painel({ ampliar: true })}
      {ampla ? <div className="fixed inset-0 z-[75] bg-white">{painel({ fechar: () => setAmpla(false) })}</div> : null}
    </>
  );
}
