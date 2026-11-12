"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { arquivosDoNicho } from "@/lib/estudio/biblioteca-arquivos";
import { emblemasDoNicho, uriEmblema } from "@/lib/estudio/emblemas";
import { ROTULO_NICHO } from "@/lib/estudio/icones-marca";
import { LockupMarca } from "@/components/preview/LockupMarca";
import {
  CORES_LOGO,
  FONTES_LOGO,
  LAYOUTS_LOGO,
  LIMITE_IA_LOGO,
  specManual,
  type LayoutLogo,
  type SpecLogo,
} from "@/lib/estudio/logo-spec";

const xadrez =
  "repeating-conic-gradient(#d9d4cc 0% 25%, #f4f1ea 0% 50%) 0 0 / 16px 16px";

export function MarcaStudio({
  aberto,
  onFechar,
  nicho,
  nome,
  slogan,
  acento,
  tintaSite,
  fundoSite,
  propostas,
  selecionada,
  onSelecionar,
  onSomar,
  onGerarIa,
  gerando,
}: {
  aberto: boolean;
  onFechar: () => void;
  nicho: string;
  nome: string;
  slogan?: string;
  acento: string;
  tintaSite: string;
  fundoSite: string;
  propostas: SpecLogo[];
  selecionada: string;
  onSelecionar: (spec: SpecLogo) => void;
  onSomar: (spec: SpecLogo) => void;
  onGerarIa: () => void;
  gerando: boolean;
}) {
  const arquivos = arquivosDoNicho(nicho);
  const marcasOficio = emblemasDoNicho(nicho);
  const primeiro = marcasOficio[0]?.id || "tesoura-disco";

  const [avancado, setAvancado] = useState(false);
  const [busca, setBusca] = useState("");
  const [arquivo, setArquivo] = useState(arquivos[0] || "");
  const [emblema, setEmblema] = useState(primeiro);
  const [layout, setLayout] = useState<LayoutLogo>("lado");
  const [fonteId, setFonteId] = useState("georgia");
  const [corIcone, setCorIcone] = useState(acento || "#D4B483");
  const [corNome, setCorNome] = useState("");
  const [corAcento, setCorAcento] = useState(acento || "#D4B483");
  const corpoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEmblema(emblemasDoNicho(nicho)[0]?.id || "tesoura-disco");
    setArquivo(arquivosDoNicho(nicho)[0] || "");
    setBusca("");
  }, [nicho]);

  useEffect(() => {
    if (!aberto) return;
    const atual = propostas.find((p) => p.id === selecionada);
    if (atual) sincronizarDe(atual);
    // só ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const t = window.setTimeout(() => corpoRef.current?.scrollTo({ top: 0 }), 0);
    return () => window.clearTimeout(t);
  }, [aberto, avancado]);

  const specVivo = useMemo(
    () => specManual("", layout, fonteId, { corIcone, corNome: corNome || undefined, corAcento }, arquivo ? undefined : emblema, arquivo || undefined),
    [arquivo, emblema, layout, fonteId, corIcone, corNome, corAcento],
  );

  const listaMarcas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return marcasOficio;
    return marcasOficio.filter((i) => i.nome.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [busca, marcasOficio]);

  const iaCount = propostas.filter((p) => p.origem === "ia").length;
  const podeGerar = iaCount < LIMITE_IA_LOGO && !gerando;
  const oficio = ROTULO_NICHO[nicho] || nicho;

  function publicar(spec: SpecLogo) {
    onSomar(spec);
    onSelecionar(spec);
  }

  function sincronizarDe(spec: SpecLogo) {
    setArquivo(spec.arquivo || "");
    if (spec.emblema) setEmblema(spec.emblema);
    setLayout(spec.layout);
    setFonteId(spec.fonteId);
    if (spec.corIcone) setCorIcone(spec.corIcone);
    if (spec.corAcento) setCorAcento(spec.corAcento);
    setCorNome(spec.corNome || "");
  }

  function escolherModelo(spec: SpecLogo) {
    sincronizarDe(spec);
    publicar(spec);
  }

  function usar(spec: SpecLogo) {
    const pintada: SpecLogo = { ...spec, corIcone, corAcento, corNome: corNome || spec.corNome };
    sincronizarDe(pintada);
    publicar(pintada);
    onFechar();
  }

  function aplicar(parcial: {
    emblema?: string;
    arquivo?: string;
    layout?: LayoutLogo;
    fonteId?: string;
    corIcone?: string;
    corNome?: string;
    corAcento?: string;
  }) {
    const nextArquivo = parcial.arquivo !== undefined ? parcial.arquivo : arquivo;
    const nextEmblema = parcial.emblema ?? emblema;
    const nextLayout = parcial.layout ?? layout;
    const nextFonte = parcial.fonteId ?? fonteId;
    const nextCorIcone = parcial.corIcone ?? corIcone;
    const nextCorNome = parcial.corNome !== undefined ? parcial.corNome : corNome;
    const nextCorAcento = parcial.corAcento ?? corAcento;
    if (parcial.arquivo !== undefined) setArquivo(parcial.arquivo);
    if (parcial.emblema !== undefined) setEmblema(parcial.emblema);
    if (parcial.layout !== undefined) setLayout(parcial.layout);
    if (parcial.fonteId !== undefined) setFonteId(parcial.fonteId);
    if (parcial.corIcone !== undefined) setCorIcone(parcial.corIcone);
    if (parcial.corNome !== undefined) setCorNome(parcial.corNome);
    if (parcial.corAcento !== undefined) setCorAcento(parcial.corAcento);
    publicar(
      specManual(
        "",
        nextLayout,
        nextFonte,
        {
          corIcone: nextCorIcone,
          corNome: nextCorNome || undefined,
          corAcento: nextCorAcento,
        },
        nextArquivo ? undefined : nextEmblema,
        nextArquivo || undefined,
      ),
    );
  }

  function Faixa({
    titulo,
    valor,
    campo,
    herdar,
  }: {
    titulo: string;
    valor: string;
    campo: "corIcone" | "corNome" | "corAcento";
    herdar?: boolean;
  }) {
    return (
      <div className="mt-2">
        <p className="text-xs font-medium">{titulo}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {herdar ? (
            <button
              type="button"
              onClick={() => aplicar({ corNome: "" })}
              className={`rounded-full border px-2 py-1 text-[11px] ${!valor ? "border-ink bg-ink text-white" : "border-line"}`}
            >
              Segue o site
            </button>
          ) : null}
          {CORES_LOGO.map((c) => (
            <button
              key={`${campo}-${c.hex}`}
              type="button"
              title={c.nome}
              onClick={() => aplicar({ [campo]: c.hex })}
              className={`h-7 w-7 rounded-full border ${valor.toLowerCase() === c.hex.toLowerCase() ? "border-ink ring-2 ring-ink" : "border-black/15"}`}
              style={{ background: c.hex }}
            />
          ))}
          <label className="relative h-7 w-7 overflow-hidden rounded-full border border-line" title="Outra cor">
            <input
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={valor || "#D4B483"}
              onChange={(e) => aplicar({ [campo]: e.target.value })}
            />
            <span className="block h-full w-full" style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} />
          </label>
        </div>
      </div>
    );
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/40 p-3 sm:items-center" onClick={onFechar}>
      <div
        className="my-3 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Símbolo de {oficio}</h3>
              <p className="mt-1 text-sm text-muted">
                {avancado
                  ? "Combine o selo, a fonte e o layout. O preview acima muda a cada clique."
                  : arquivos.length
                    ? "Marcas deste ofício, cada uma diferente. O nome do cliente entra ao lado."
                    : "Logomarcas deste ofício. Escolha uma. O nome do cliente entra na hora."}
              </p>
            </div>
            <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={onFechar}>
              Fechar
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${!avancado ? "bg-ink text-white" : "border border-line"}`}
              onClick={() => setAvancado(false)}
            >
              Modelos
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${avancado ? "bg-ink text-white" : "border border-line"}`}
              onClick={() => setAvancado(true)}
            >
              Avançado
            </button>
          </div>
        </div>

        <div ref={corpoRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-line bg-white px-5 py-3 sm:px-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Como fica agora</p>
              <button
                type="button"
                className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white"
                onClick={() => usar(specVivo)}
              >
                Aplicar no site
              </button>
            </div>
            <div className="flex h-[88px] items-center overflow-visible rounded-xl px-4" style={{ background: fundoSite, color: tintaSite }}>
              <LockupMarca spec={specVivo} nome={nome} slogan={slogan} tinta={tintaSite} acento={corAcento || acento} className="h-14 w-full" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  { tinta: "#1A1614", fundo: "#F7F4F1", label: "Claro" },
                  { tinta: "#F4F0E6", fundo: "#0C0C0C", label: "Escuro" },
                  { tinta: tintaSite, fundo: xadrez, label: "Fundo" },
                ] as const
              ).map((m) => (
                <div key={m.label}>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">{m.label}</p>
                  <div className="flex h-12 items-center overflow-visible rounded-lg px-2" style={{ background: m.fundo, color: m.tinta }}>
                    <LockupMarca spec={specVivo} nome={nome} slogan={slogan} tinta={m.tinta} acento={corAcento || acento} className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6">
            {!avancado ? (
              <>
                {arquivos.length ? (
                  <p className="text-xs text-muted">{propostas.filter((p) => p.origem === "biblioteca").length} marcas distintas de {oficio}. Clique para ver com o seu nome.</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!podeGerar}
                      onClick={onGerarIa}
                      className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {gerando ? "Gerando…" : iaCount === 0 ? "Gerar 5 modelos" : iaCount >= LIMITE_IA_LOGO ? "Limite de 10" : "Gerar mais 5"}
                    </button>
                    <p className="text-xs text-muted">
                      Biblioteca permanente de {oficio}. A IA é extra ({iaCount}/{LIMITE_IA_LOGO}).
                    </p>
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[...propostas.filter((p) => p.origem === "biblioteca"), ...propostas.filter((p) => p.origem !== "biblioteca")].map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-3 ${selecionada === p.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                    >
                      <button type="button" className="w-full text-left" onClick={() => escolherModelo(p)}>
                        <div className="flex h-16 items-center overflow-visible rounded-lg px-2" style={{ background: fundoSite, color: tintaSite }}>
                          <LockupMarca spec={p} nome={nome} slogan={slogan} tinta={tintaSite} acento={acento} className="h-12 w-full" />
                        </div>
                        <span className="mt-1 block text-[11px] text-muted">
                          {p.origem === "ia" ? "IA · " : ""}
                          {LAYOUTS_LOGO.find((l) => l.id === p.layout)?.nome} · {FONTES_LOGO.find((f) => f.id === p.fonteId)?.nome}
                        </span>
                      </button>
                      <button type="button" className="mt-2 w-full rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={() => usar(p)}>
                        Usar no site
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Selo de {oficio}</p>
                <p className="mt-0.5 text-xs text-muted">Clique e o logo acima muda na hora.</p>
                {arquivos.length ? (
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {arquivos.map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => aplicar({ arquivo: src, layout: layout === "wordmark" ? "lado" : layout })}
                        className={`flex h-16 items-center justify-center rounded-xl border bg-white p-1 ${arquivo === src ? "border-ink ring-1 ring-ink" : "border-line"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-14 w-14 object-contain" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <input
                      className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
                      placeholder={`Buscar selo de ${oficio}…`}
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {listaMarcas.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          title={i.nome}
                          onClick={() => aplicar({ emblema: i.id, arquivo: "", layout: layout === "wordmark" ? "lado" : layout })}
                          className={`flex h-14 w-14 items-center justify-center rounded-xl border p-1 ${emblema === i.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={uriEmblema(i.id, corIcone, corAcento, nome)} alt={i.nome} className="h-12 w-12" />
                        </button>
                      ))}
                    </div>
                    {listaMarcas.length === 0 ? <p className="mt-2 text-sm text-muted">Nenhum selo deste ofício com esse nome.</p> : null}
                  </>
                )}

                <p className="mt-5 text-sm font-medium">Fonte</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FONTES_LOGO.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => aplicar({ fonteId: f.id })}
                      className={`rounded-full border px-3 py-1.5 text-sm ${fonteId === f.id ? "border-ink bg-ink text-white" : "border-line"}`}
                      style={{ fontFamily: f.css }}
                    >
                      {f.nome}
                    </button>
                  ))}
                </div>

                <p className="mt-5 text-sm font-medium">Layout</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LAYOUTS_LOGO.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => aplicar({ layout: l.id })}
                      className={`rounded-xl border px-3 py-2 text-left text-sm ${layout === l.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                    >
                      {l.nome}
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-line bg-canvas/60 p-3">
                  <p className="text-sm font-medium">Cores</p>
                  <Faixa titulo="Ícone" valor={corIcone} campo="corIcone" />
                  <Faixa titulo="Nome" valor={corNome} campo="corNome" herdar />
                  <Faixa titulo="Acento" valor={corAcento} campo="corAcento" />
                </div>

                <button type="button" className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white" onClick={() => usar(specVivo)}>
                  Usar esta combinação no site
                </button>
              </>
            )}

            {!avancado ? (
              <div className="mt-5 rounded-2xl border border-line bg-canvas/60 p-3">
                <p className="text-sm font-medium">Cores do logo escolhido</p>
                <Faixa titulo="Ícone" valor={corIcone} campo="corIcone" />
                <Faixa titulo="Nome" valor={corNome} campo="corNome" herdar />
                <Faixa titulo="Acento" valor={corAcento} campo="corAcento" />
              </div>
            ) : null}

            <p className="mt-4 text-xs text-muted">Se a identidade já existe em arquivo, feche e envie o PNG ou SVG.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
