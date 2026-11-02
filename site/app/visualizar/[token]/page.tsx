"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PedidoIa } from "@/components/estudio/PedidoIa";
import { avisoFora, limparHorario, type AlvoPedido } from "@/lib/estudio/pedido-fechado";
import { SeletorFoto } from "@/components/estudio/SeletorFoto";
import { SiteLivePreview, type SlotFoto } from "@/components/preview/SiteLivePreview";
import { aplicarSrcNoSlot } from "@/lib/estudio/aplicar";
import { aplicarCampoNoSite } from "@/lib/estudio/copia-viva";
import type { VisualConfig } from "@/lib/estudio/visual";

export default function VisualizarRascunhoPage() {
  const params = useParams<{ token: string }>();
  const token = String(params.token || "").toLowerCase();
  const [site, setSite] = useState<Record<string, unknown> | null>(null);
  const [visual, setVisual] = useState<VisualConfig | undefined>();
  const [nicho, setNicho] = useState("barbearia");
  const [slotFoto, setSlotFoto] = useState<SlotFoto | null>(null);
  const [meta, setMeta] = useState<{
    nome?: string;
    nicho?: string;
    horasRestantes?: number;
    contratarUrl?: string;
  } | null>(null);
  const [erro, setErro] = useState("");
  const [avisoFoto, setAvisoFoto] = useState("");
  const [pedido, setPedido] = useState("");
  const [alvoPedido, setAlvoPedido] = useState<AlvoPedido | "">("");
  const [avisoIa, setAvisoIa] = useState("");
  const [ajustando, setAjustando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const [a, b] = await Promise.all([
        fetch(`/api/prototipo/${token}?t=${token}`),
        fetch(`/api/prototipo/${token}/conteudo?t=${token}`),
      ]);
      const ja = await a.json().catch(() => ({}));
      const jb = await b.json().catch(() => ({}));
      if (!a.ok) {
        setErro(ja.erro || "Este site de teste já expirou");
        return;
      }
      if (!b.ok || !jb.site) {
        setErro(jb.erro || "Não deu para abrir o conteúdo deste teste.");
        return;
      }
      setMeta(ja);
      if (ja.nicho) setNicho(String(ja.nicho));
      setSite(jb.site);
      if (jb.visual) setVisual(jb.visual);
    })();
  }, [token]);

  async function gravarTexto(campo: string, valor: string) {
    setAvisoIa("");
    setSite((atual) => (atual ? aplicarCampoNoSite({ ...atual }, campo, valor) : atual));
    try {
      const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campo, valor }),
      });
      const data = await res.json();
      if (!res.ok) setAvisoIa(data.erro || "Não deu para guardar esse texto.");
      else if (data.site) setSite(data.site);
    } catch {
      setAvisoIa("Falha de conexão ao guardar o texto.");
    }
  }

  async function pedirTexto() {
    const texto = pedido.trim();
    if (!alvoPedido) {
      setAvisoIa("Escolha horário, capa, sobre ou serviços.");
      return;
    }
    if (texto.length < 3) {
      setAvisoIa("Escreva uma frase curta para esse bloco.");
      return;
    }
    const fora = avisoFora(texto);
    if (fora) {
      setAvisoIa(fora);
      return;
    }
    if (alvoPedido === "horario") {
      const h = limparHorario(texto);
      if (!h) {
        setAvisoIa("Escreva os dias e as horas. Ex.: Segunda a sexta, 8h às 17h.");
        return;
      }
      setAvisoIa("");
      setSite((atual) => (atual ? aplicarCampoNoSite({ ...atual }, "horario", h) : atual));
      setPedido("");
      void gravarTexto("horario", h);
      return;
    }
    setAjustando(true);
    setAvisoIa("");
    const ctrl = new AbortController();
    const prazo = window.setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
        method: "PATCH",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alvo: alvoPedido, pedido: texto }),
      });
      const data = await res.json();
      if (data.site) setSite(data.site);
      setAvisoIa(data.aviso || "");
      if (data.site && !data.aviso) setPedido("");
    } catch {
      setAvisoIa("Demorou demais. Esse bloco não mudou. Edite o texto direto no quadro.");
    } finally {
      window.clearTimeout(prazo);
      setAjustando(false);
    }
  }

  async function gravarFoto(src: string, slot: SlotFoto) {
    setAvisoFoto("");
    setSite((atual) => (atual ? aplicarSrcNoSlot({ ...atual }, slot, src) : atual));
    try {
      const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotoSrc: src, slot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAvisoFoto(data.erro || "Não deu para salvar a foto neste rascunho.");
        return;
      }
      if (data.site) setSite(data.site);
    } catch {
      setAvisoFoto("Falha de conexão ao salvar a foto.");
    }
  }

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Este site de teste não está mais disponível</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <p className="mt-2 text-sm text-muted">O rascunho some em 3 dias. Contrate para publicar de verdade.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/prototipar" className="text-accent underline">
            Montar outro
          </Link>
          <Link href="/contratar" className="text-accent underline">
            Contratar
          </Link>
        </div>
      </main>
    );
  }

  if (!site) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo o seu site de teste…</main>;
  }

  const horas = meta?.horasRestantes ?? 72;
  const dias = Math.max(1, Math.round(horas / 24));

  return (
    <div className="min-h-screen bg-black pb-40">
      <SiteLivePreview
        site={site as Parameters<typeof SiteLivePreview>[0]["site"]}
        visual={visual}
        onTrocarFoto={setSlotFoto}
        onTexto={(campo, valor) => void gravarTexto(campo, valor)}
      />
      <SeletorFoto
        aberto={Boolean(slotFoto)}
        nicho={nicho}
        slot={slotFoto}
        onEscolher={(src) => {
          if (slotFoto) void gravarFoto(src, slotFoto);
        }}
        onFechar={() => setSlotFoto(null)}
      />

      <div className="fixed inset-x-0 bottom-0 z-50">
        <PedidoIa alvo={alvoPedido} onAlvo={setAlvoPedido} texto={pedido} onTexto={setPedido} onEnviar={() => void pedirTexto()} aviso={avisoIa} ocupado={ajustando} />
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-white/80">
            Site de teste · some em{" "}
            <strong className="text-white">
              {dias} {dias === 1 ? "dia" : "dias"}
            </strong>
            {meta?.nome ? ` · ${meta.nome}` : ""}
            <span className="ml-2 text-white/55">Clique num texto ou numa foto para alterar.</span>
            {avisoFoto ? <span className="ml-2 text-amber-300">{avisoFoto}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-white/25 px-4 py-2 text-sm text-white"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 1600);
              }}
            >
              {copiado ? "Link copiado" : "Copiar link"}
            </button>
            <Link
              href={meta?.contratarUrl || `/contratar?nicho=${meta?.nicho || ""}&preview=${token}&t=${token}`}
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Quero publicar este site
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
