"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PedidoIa } from "@/components/estudio/PedidoIa";
import { AVISO_ESTRUTURA, AVISO_LIMITE, LIMITE_PEDIDOS_IA, soEstrutura } from "@/lib/estudio/pedido-fechado";
import { SeletorFoto } from "@/components/estudio/SeletorFoto";
import { SiteLivePreview, type SlotFoto } from "@/components/preview/SiteLivePreview";
import { aplicarSrcNoSlot } from "@/lib/estudio/aplicar";
import { aplicarPedido, contextoEditavel, patchRapido, type PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { aplicarCampoNoSite } from "@/lib/estudio/copia-viva";
import { linkWhatsapp } from "@/lib/contato";
import { visualPadrao, type VisualConfig } from "@/lib/estudio/visual";

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
  const [avisoIa, setAvisoIa] = useState("");
  const [ajustando, setAjustando] = useState(false);
  const [fechado, setFechado] = useState(false);
  const [usos, setUsos] = useState(0);
  const [passosDesfazer, setPassosDesfazer] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const suporte = linkWhatsapp("Olá, preciso de uma alteração no site ou de uma tela nova.");

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
      if (ja.edicaoFechada || jb.edicaoFechada) setFechado(true);
      setUsos(Number(ja.pedidosIa || jb.pedidosIa || 0));
      setPassosDesfazer(Number(ja.desfazer || jb.desfazer || 0));
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

  function abrirDoPedido(abrir: string) {
    if (abrir === "logo") logoRef.current?.click();
    else if (abrir === "hero" || abrir === "sobre" || abrir === "galeria") setSlotFoto({ tipo: abrir });
  }

  async function guardarPatch(patch: PatchPedido) {
    const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch }),
    });
    const data = await res.json();
    if (data.site) setSite(data.site);
    if (data.visual) setVisual(data.visual);
    if (data.edicaoFechada) setFechado(true);
    if (typeof data.pedidosIa === "number") setUsos(data.pedidosIa);
    if (typeof data.desfazer === "number") setPassosDesfazer(data.desfazer);
    const texto = [data.resumo, data.aviso].filter(Boolean).join(" ");
    if (texto) setAvisoIa(texto);
    return data as { aviso?: string; abrir?: string };
  }

  async function aplicarNaHora(patch: PatchPedido) {
    if (!site) return;
    const local = aplicarPedido(structuredClone(site), visual || visualPadrao(nicho), patch);
    setSite(local.site);
    setVisual(local.visual);
    setAvisoIa([local.resumo, local.aviso].filter(Boolean).join(" "));
    abrirDoPedido(local.abrir);
    await guardarPatch(patch);
  }

  async function pedirTexto() {
    if (fechado || !site) return;
    if (usos >= LIMITE_PEDIDOS_IA) {
      setAvisoIa(AVISO_LIMITE);
      return;
    }
    const texto = pedido.trim();
    if (texto.length < 3) {
      setAvisoIa("Escreva o que quer mudar.");
      return;
    }
    if (soEstrutura(texto)) {
      setAvisoIa(AVISO_ESTRUTURA);
      return;
    }
    const rapido = patchRapido(texto);
    if (rapido) {
      setPedido("");
      try {
        await aplicarNaHora(rapido);
      } catch {
        setAvisoIa("O quadro mudou, mas a gravação falhou. Tente de novo.");
      }
      return;
    }
    setAjustando(true);
    setAvisoIa("");
    const ctrl = new AbortController();
    const prazo = window.setTimeout(() => ctrl.abort(), 20000);
    try {
      const empresa = site.empresa as { nome?: string } | undefined;
      const res = await fetch("/api/prototipo/textos", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "executar",
          pedido: texto,
          nicho,
          nome: empresa?.nome || meta?.nome || "Negócio",
          contexto: contextoEditavel(site, visual),
        }),
      });
      const data = (await res.json()) as { patch?: PatchPedido; aviso?: string; erro?: string; resumo?: string };
      if (!data.patch) {
        setAvisoIa(data.aviso || data.erro || "Não consegui aplicar agora.");
        return;
      }
      setPedido("");
      await aplicarNaHora(data.patch);
    } catch {
      setAvisoIa("Demorou demais. Nada mudou. Tente uma frase mais curta.");
    } finally {
      window.clearTimeout(prazo);
      setAjustando(false);
    }
  }

  async function desfazer() {
    if (passosDesfazer < 1) return;
    setAjustando(true);
    try {
      const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desfazer: true }),
      });
      const data = await res.json();
      if (data.site) setSite(data.site);
      if (data.visual) setVisual(data.visual);
      if (typeof data.desfazer === "number") setPassosDesfazer(data.desfazer);
      setAvisoIa(data.aviso || "Alteração desfeita.");
    } catch {
      setAvisoIa("Não deu para desfazer agora.");
    } finally {
      setAjustando(false);
    }
  }

  async function fecharAlteracao() {
    setFechado(true);
    try {
      await fetch(`/api/prototipo/${token}?t=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechar: true }),
      });
    } catch {
      setAvisoIa("Não deu para registrar o encerramento. Tente de novo.");
      setFechado(false);
    }
  }

  async function enviarLogo(file: File) {
    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("arquivo"));
      reader.readAsDataURL(file);
    });
    setSite((atual) => {
      if (!atual) return atual;
      const empresa = { ...((atual.empresa as Record<string, unknown>) || {}) };
      const logo = { ...((empresa.logo as Record<string, unknown>) || {}) };
      logo.src = src;
      empresa.logo = logo;
      return { ...atual, empresa };
    });
    const res = await fetch(`/api/prototipo/${token}?t=${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ somenteLogo: true, logoSrc: src }),
    });
    const data = await res.json();
    if (!res.ok) setAvisoIa(data.erro || "Não deu para guardar a logo.");
    else if (data.site) setSite(data.site);
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
    <div className="min-h-screen bg-black pb-52">
      <input
        ref={logoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void enviarLogo(file);
        }}
      />
      <SiteLivePreview
        site={site as Parameters<typeof SiteLivePreview>[0]["site"]}
        visual={visual}
        onTrocarFoto={fechado ? undefined : setSlotFoto}
        onTrocarLogo={fechado ? undefined : () => logoRef.current?.click()}
        onTexto={fechado ? undefined : (campo, valor) => void gravarTexto(campo, valor)}
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
        <PedidoIa
          texto={pedido}
          onTexto={setPedido}
          onEnviar={() => void pedirTexto()}
          aviso={avisoIa}
          ocupado={ajustando}
          fechado={fechado}
          onConfirmarFechar={() => void fecharAlteracao()}
          onDesfazer={() => void desfazer()}
          passosDesfazer={passosDesfazer}
          usos={usos}
          onAnexarFoto={() => setSlotFoto({ tipo: "hero" })}
          onAnexarLogo={() => logoRef.current?.click()}
          linkSuporte={suporte}
        />
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-white/80">
            Site de teste · some em{" "}
            <strong className="text-white">
              {dias} {dias === 1 ? "dia" : "dias"}
            </strong>
            {meta?.nome ? ` · ${meta.nome}` : ""}
            <span className="ml-2 text-white/55">
              {fechado ? "Edição encerrada. Novo ajuste é com o suporte." : "Clique num texto, numa foto ou na logo. Ou peça na faixa."}
            </span>
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
