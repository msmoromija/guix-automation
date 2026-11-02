"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EstudioPreview } from "@/components/estudio/EstudioPreview";
import { propostasEstudio } from "@/lib/estudio/marca";
import { montarRascunho } from "@/lib/estudio/rascunho";
import {
  PALETAS,
  PRESETS,
  paletaPorId,
  visualPadrao,
  type VisualConfig,
} from "@/lib/estudio/visual";
import { tomDoEstilo } from "@/lib/media/catalogo";
import { nichos } from "@/lib/nichos";

const campo = "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink";
const chip = "rounded-xl border px-3 py-2.5 text-left text-sm leading-snug transition";
const chipOn = "border-ink bg-ink text-white";
const chipOff = "border-line bg-white text-ink hover:border-ink/30";

const ETAPAS = [
  { id: 1, titulo: "Negócio e aparência" },
  { id: 2, titulo: "Marca" },
  { id: 3, titulo: "Contato e serviços" },
  { id: 4, titulo: "Gerar o site" },
];

type Proposta = { id: string; titulo: string; nota: string; src: string };

async function arquivoParaDataUrl(file: File, max = 640) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.86);
}

export function EstudioForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const nichoInicial = sp.get("nicho") || "barbearia";

  const [etapa, setEtapa] = useState(1);
  const [previewAberta, setPreviewAberta] = useState(false);
  const [avancado, setAvancado] = useState(false);
  const [nicho, setNicho] = useState(nichoInicial);
  const [nome, setNome] = useState("");
  const [slogan, setSlogan] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("SE");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [redes, setRedes] = useState({ instagram: "", facebook: "", linkedin: "", tiktok: "", youtube: "" });
  const [visual, setVisual] = useState<VisualConfig>(() => visualPadrao(nichoInicial));
  const [logoModo, setLogoModo] = useState<"gerar" | "enviar" | "texto">("gerar");
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [propostaId, setPropostaId] = useState("");
  const [logoUpload, setLogoUpload] = useState("");
  const [gerandoIa, setGerandoIa] = useState(false);
  const [servicos, setServicos] = useState([{ nome: "", preco: "", duracao: "", descricao: "" }]);
  const [pros, setPros] = useState([{ nome: "", cargo: "", descricao: "", fotoSrc: "" }]);
  const [tom, setTom] = useState(() => tomDoEstilo(visualPadrao(nichoInicial).estilo));
  const [destaque, setDestaque] = useState("");
  const [iaEscreve, setIaEscreve] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);

  const nichoAtual = useMemo(() => nichos.find((n) => n.slug === nicho) || nichos[0], [nicho]);
  const paleta = paletaPorId(visual.paletaId);
  const nomeMarca = nome.trim() || nichoAtual.negocio;
  const logoSrc = logoModo === "enviar" ? logoUpload : logoModo === "texto" ? "" : propostas.find((p) => p.id === propostaId)?.src || "";

  const siteRascunho = useMemo(
    () =>
      montarRascunho({
        nome: nome.trim() || nomeMarca,
        slogan,
        nichoNome: nichoAtual.nome,
        cidade,
        logoSrc,
        visual: { ...visual, linkedinUrl: redes.linkedin || visual.linkedinUrl },
        servicos,
        profissionais: pros,
        whatsapp,
      }),
    [nome, nomeMarca, slogan, nichoAtual.nome, cidade, logoSrc, visual, redes.linkedin, servicos, pros, whatsapp],
  );

  useEffect(() => {
    const lista = propostasEstudio({
      nome: nomeMarca,
      slogan,
      fundo: paleta.color_background,
      tinta: paleta.color_text,
      acento: paleta.color_accent,
      nicho,
    });
    setPropostas((atuais) => {
      const ia = atuais.filter((p) => p.id.startsWith("ia-"));
      return [...lista, ...ia];
    });
    setPropostaId((id) => (id.startsWith("ia-") ? id : lista[1]?.id || lista[0].id));
  }, [nomeMarca, slogan, paleta.color_background, paleta.color_text, paleta.color_accent, nicho]);

  function ir(n: number) {
    setEtapa(n);
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function gerarComIa() {
    setErro("");
    setAviso("");
    setGerandoIa(true);
    setLogoModo("gerar");
    try {
      const res = await fetch("/api/prototipo/marca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeMarca, slogan, nicho, paletaId: visual.paletaId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "A IA não conseguiu gerar agora. Escolha um dos modelos à direita.");
        return;
      }
      const p = data.proposta as Proposta;
      setPropostas((lista) => [p, ...lista.filter((x) => x.id !== p.id)]);
      setPropostaId(p.id);
      if (data.aviso) setAviso(data.aviso);
    } catch {
      setErro("Falha ao falar com a IA da marca.");
    } finally {
      setGerandoIa(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (etapa < 4) {
      if (etapa === 1 && nome.trim().length < 2) {
        setErro("Escreva o nome do negócio para seguir.");
        return;
      }
      ir(etapa + 1);
      return;
    }
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/prototipo/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          nicho,
          cidade,
          estado,
          logradouro,
          numero,
          bairro,
          cep,
          whatsapp,
          email,
          slogan,
          redes,
          visual,
          tom,
          destaque,
          iaEscreve,
          logoSrc: logoModo === "texto" ? undefined : logoSrc,
          servicos: servicos.filter((s) => s.nome.trim()),
          profissionais: pros.filter((p) => p.nome.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível gerar o protótipo.");
        return;
      }
      router.push(`/visualizar/${data.token}`);
    } catch {
      setErro("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  const preview = (
    <EstudioPreview
      site={siteRascunho}
      visual={{ ...visual, linkedinUrl: redes.linkedin || visual.linkedinUrl }}
      aberto={previewAberta}
      onToggle={() => setPreviewAberta((v) => !v)}
    />
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">MONTAR MEU SITE</p>
      <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
        Veja o site nascer enquanto você preenche
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">
        Quatro passos. À direita, a prévia acompanha. No fim você ganha um <strong>link do site de teste</strong>,
        válido por 3 dias — sem publicar de verdade e sem pagar ainda.
      </p>

      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ETAPAS.map((et) => (
          <li key={et.id}>
            <button
              type="button"
              onClick={() => ir(et.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-xs sm:text-sm ${
                etapa === et.id ? chipOn : etapa > et.id ? "border-ink/20 bg-white" : chipOff
              }`}
            >
              <span className="block text-[10px] opacity-70">Passo {et.id}</span>
              {et.titulo}
            </button>
          </li>
        ))}
      </ol>

      <form onSubmit={enviar} className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          {etapa === 1 ? (
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold">Como se chama e que cara tem</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  Tipo de negócio
                  <select
                    className={campo}
                    value={nicho}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setNicho(slug);
                      const v = visualPadrao(slug);
                      setVisual(v);
                      setTom(tomDoEstilo(v.estilo));
                    }}
                  >
                    {nichos.map((n) => (
                      <option key={n.slug} value={n.slug}>
                        {n.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Nome
                  <input required className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Paulinho Barbearia" />
                </label>
                <label className="block text-sm sm:col-span-2">
                  Frase debaixo do nome
                  <input
                    className={campo}
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Estilo, tradição e confiança em cada corte"
                  />
                </label>
              </div>

              <p className="mt-6 text-sm font-semibold">Claro ou escuro</p>
              <p className="text-xs text-muted">Escolha antes da marca: o logo precisa aparecer no banner.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["claro", "escuro", "automatico"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`${chip} ${visual.aparencia === a ? chipOn : chipOff}`}
                    onClick={() => setVisual((v) => ({ ...v, aparencia: a }))}
                  >
                    {a === "automatico" ? "Do celular" : a === "claro" ? "Claro" : "Escuro"}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm font-semibold">Visual pronto</p>
              <p className="text-xs text-muted">Um toque muda cores e letras. Olhe a prévia.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PRESETS.map((p) => {
                  const pal = paletaPorId(p.visual.paletaId || visual.paletaId);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`overflow-hidden rounded-xl border text-left ${visual.presetId === p.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                      onClick={() => {
                        setVisual((v) => ({ ...v, ...p.visual, presetId: p.id }));
                        setTom(tomDoEstilo(p.visual.estilo));
                      }}
                    >
                      <span className="flex h-10">
                        <i className="flex-1" style={{ background: pal.color_background }} />
                        <i className="flex-1" style={{ background: pal.color_surface }} />
                        <i className="w-10" style={{ background: pal.color_accent }} />
                      </span>
                      <span className="block px-3 py-2">
                        <span className="block text-sm font-medium">{p.nome}</span>
                        <span className="text-xs text-muted">{p.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-sm font-semibold">Como a IA vai escrever</p>
              <p className="text-xs text-muted">Isso entra no pedido à IA — textos, serviços e o tipo de foto.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ["tradicional, acolhedor, de ofício", "Acolhedor"],
                    ["direto, jovem, com energia", "Urbano"],
                    ["sofisticado, sóbrio, premium", "Luxo"],
                    ["profissional, claro, comercial", "Direto"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${chip} ${tom === id ? chipOn : chipOff}`}
                    onClick={() => setTom(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-sm">
                O que destacar (a IA usa isso)
                <input
                  className={campo}
                  value={destaque}
                  onChange={(e) => setDestaque(e.target.value)}
                  placeholder="Ex.: corte na tesoura, atendimento com hora marcada"
                />
              </label>
              <button
                type="button"
                className={`mt-3 ${chip} ${iaEscreve ? chipOn : chipOff}`}
                onClick={() => setIaEscreve((v) => !v)}
              >
                {iaEscreve ? "A IA escreve os textos do site" : "Não usar IA nos textos"}
              </button>

              <button type="button" className="mt-4 text-sm text-muted underline" onClick={() => setAvancado((v) => !v)}>
                {avancado ? "Esconder paleta e letras" : "Ajustar paleta e letras"}
              </button>
              {avancado ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {PALETAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`${chip} flex items-center gap-2 ${visual.paletaId === p.id ? chipOn : chipOff}`}
                      onClick={() => setVisual((v) => ({ ...v, paletaId: p.id }))}
                    >
                      <span className="flex h-6 w-10 overflow-hidden rounded">
                        <i className="flex-1" style={{ background: p.color_background }} />
                        <i className="flex-1" style={{ background: p.color_accent }} />
                      </span>
                      {p.nome}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {etapa === 2 ? (
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold">Como a marca entra no site</h2>
              <p className="mt-1 text-sm text-muted">Três caminhos. A prévia mostra o resultado no cabeçalho.</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => setLogoModo("gerar")}
                  className={`rounded-2xl border p-4 text-left ${logoModo === "gerar" ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <p className="text-sm font-semibold">Montar no estúdio</p>
                  <p className="mt-1 text-xs text-muted">
                    Modelos com o nome escrito certo. Opcional: a IA desenha só o símbolo, sem estragar o texto.
                  </p>
                  <div className="mt-3 overflow-hidden rounded-lg" style={{ background: paleta.color_background }}>
                    {propostas[1]?.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={propostas[1].src} alt="" className="h-16 w-full object-contain" />
                    ) : null}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoModo("enviar")}
                  className={`rounded-2xl border p-4 text-left ${logoModo === "enviar" ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <p className="text-sm font-semibold">Já tenho um arquivo</p>
                  <p className="mt-1 text-xs text-muted">PNG, JPG, SVG ou WebP. Aparece no lugar do nome desenhado.</p>
                  <div className="mt-3 flex h-16 items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">
                    {logoUpload ? "Arquivo carregado" : "Solte o arquivo depois de escolher esta opção"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoModo("texto")}
                  className={`rounded-2xl border p-4 text-left ${logoModo === "texto" ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <p className="text-sm font-semibold">Só o nome escrito</p>
                  <p className="mt-1 text-xs text-muted">Sem imagem. O cabeçalho usa o nome em letra, como um jornal.</p>
                  <div className="mt-3 flex h-16 items-center justify-center rounded-lg" style={{ background: paleta.color_background, color: paleta.color_text }}>
                    <span className="text-sm font-semibold tracking-wide">{nomeMarca}</span>
                  </div>
                </button>
              </div>

              {logoModo === "enviar" ? (
                <label className="mt-4 block text-sm">
                  Enviar arquivo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="mt-1.5 w-full text-sm"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (!f) return;
                      void arquivoParaDataUrl(f)
                        .then(setLogoUpload)
                        .catch(() => setErro("Não deu para ler o arquivo."));
                    }}
                  />
                </label>
              ) : null}

              {logoModo === "gerar" ? (
                <>
                  <button
                    type="button"
                    disabled={gerandoIa || nomeMarca.length < 2}
                    onClick={() => void gerarComIa()}
                    className="mt-4 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                  >
                    {gerandoIa ? "A IA está desenhando o símbolo…" : "Pedir um símbolo à IA"}
                  </button>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {propostas.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPropostaId(p.id)}
                        className={`overflow-hidden rounded-xl border text-left ${propostaId === p.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                      >
                        <div className="flex h-16 items-center px-2" style={{ background: paleta.color_background }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.src} alt="" className="h-12 w-full object-contain" />
                        </div>
                        <span className="block px-2 py-1.5 text-[11px] font-medium">{p.titulo}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {etapa === 3 ? (
            <>
              <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                <h2 className="text-base font-semibold">Como o cliente te acha</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CartaoCanal titulo="WhatsApp" dica="Botão no canto da página" on={visual.whatsappFlutuante} onChange={(whatsappFlutuante) => setVisual((v) => ({ ...v, whatsappFlutuante }))}>
                    <input className={campo} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="79 99999-0000" />
                  </CartaoCanal>
                  <CartaoCanal titulo="Agendar" dica="Botão no topo do site" on={visual.agendamento} onChange={(agendamento) => setVisual((v) => ({ ...v, agendamento }))}>
                    <p className="mt-2 text-xs text-muted">Usa o mesmo WhatsApp neste teste.</p>
                  </CartaoCanal>
                  <CartaoCanal titulo="Instagram" on={visual.instagram} onChange={(instagram) => setVisual((v) => ({ ...v, instagram }))}>
                    <input className={campo} value={redes.instagram} onChange={(e) => setRedes((r) => ({ ...r, instagram: e.target.value }))} placeholder="@paulinho.barbearia" />
                  </CartaoCanal>
                  <CartaoCanal titulo="Facebook" on={visual.facebook} onChange={(facebook) => setVisual((v) => ({ ...v, facebook }))}>
                    <input className={campo} value={redes.facebook} onChange={(e) => setRedes((r) => ({ ...r, facebook: e.target.value }))} placeholder="facebook.com/..." />
                  </CartaoCanal>
                  <CartaoCanal titulo="LinkedIn" on={visual.linkedin} onChange={(linkedin) => setVisual((v) => ({ ...v, linkedin }))}>
                    <input className={campo} value={redes.linkedin} onChange={(e) => setRedes((r) => ({ ...r, linkedin: e.target.value }))} placeholder="linkedin.com/company/..." />
                  </CartaoCanal>
                  <CartaoCanal titulo="E-mail" on={Boolean(email)} onChange={() => undefined} semSwitch>
                    <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@negocio.com" />
                  </CartaoCanal>
                </div>
                <div className="mt-5 rounded-2xl bg-canvas p-4">
                  <p className="text-sm font-semibold">Endereço</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-6">
                    <label className="block text-sm sm:col-span-4">
                      Rua
                      <input className={campo} value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Número
                      <input className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Bairro
                      <input className={campo} value={bairro} onChange={(e) => setBairro(e.target.value)} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Cidade
                      <input className={campo} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Aracaju" />
                    </label>
                    <label className="block text-sm">
                      UF
                      <input className={campo} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} />
                    </label>
                    <label className="block text-sm">
                      CEP
                      <input className={campo} value={cep} onChange={(e) => setCep(e.target.value)} />
                    </label>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Serviços</h2>
                    <p className="mt-1 text-sm text-muted">A prévia já mostra um exemplo. Preencha o seu para substituir.</p>
                  </div>
                  <button type="button" className="rounded-full border border-line px-4 py-2 text-sm" onClick={() => setServicos((s) => [...s, { nome: "", preco: "", duracao: "", descricao: "" }])}>
                    Adicionar
                  </button>
                </div>
                <div className={`mt-4 grid gap-4 ${servicos.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {servicos.map((s, i) => (
                    <article key={i} className="rounded-2xl border border-line p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Serviço {i + 1}</p>
                        {servicos.length > 1 ? (
                          <button type="button" className="text-xs text-muted" onClick={() => setServicos((rows) => rows.filter((_, j) => j !== i))}>
                            Remover
                          </button>
                        ) : null}
                      </div>
                      <input className={campo} value={s.nome} placeholder="Ex.: Corte clássico" onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))} />
                      <textarea rows={2} className={`${campo} resize-none`} value={s.descricao} placeholder="Ex.: Máquina + tesoura, toalha quente." onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, descricao: e.target.value } : r)))} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className={campo} value={s.preco} placeholder="Ex.: R$ 45" onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, preco: e.target.value } : r)))} />
                        <input className={campo} value={s.duracao} placeholder="Ex.: 40 min" onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, duracao: e.target.value } : r)))} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Equipe</h2>
                    <p className="mt-1 text-sm text-muted">Foto opcional. Sem foto, a prévia usa a inicial no círculo — como a Ana de exemplo.</p>
                  </div>
                  <button type="button" className="rounded-full border border-line px-4 py-2 text-sm" onClick={() => setPros((p) => [...p, { nome: "", cargo: "", descricao: "", fotoSrc: "" }])}>
                    Adicionar
                  </button>
                </div>
                <div className={`mt-4 grid gap-4 ${pros.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {pros.map((p, i) => (
                    <article key={i} className="flex gap-4 rounded-2xl border border-line p-4">
                      <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-canvas text-center text-[11px] text-muted">
                        {p.fotoSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.fotoSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-semibold text-ink/40">{(p.nome || "A").slice(0, 1)}</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(ev) => {
                            const f = ev.target.files?.[0];
                            if (!f) return;
                            void arquivoParaDataUrl(f, 360).then((src) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, fotoSrc: src } : r))));
                          }}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <input className={campo} placeholder="Ex.: Ana Souza" value={p.nome} onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))} />
                        <input className={campo} placeholder="Ex.: Barbeira" value={p.cargo} onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, cargo: e.target.value } : r)))} />
                        <textarea rows={2} className={`${campo} resize-none`} placeholder="Uma linha sobre o trabalho." value={p.descricao} onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, descricao: e.target.value } : r)))} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {etapa === 4 ? (
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold">O que acontece agora</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6">
                <li>
                  <strong>1.</strong> A IA escreve os textos no tom escolhido e escolhe fotos do ofício (barbearia ≠ salão).
                </li>
                <li>
                  <strong>2.</strong> Você clica abaixo e abre o site de teste neste navegador.
                </li>
                <li>
                  <strong>3.</strong> Guarda o link (ou o código curto). Dá para mandar no WhatsApp e mostrar a alguém.
                </li>
                <li>
                  <strong>4.</strong> O teste fica no ar por <strong>3 dias</strong>. Depois some sozinho — não é o site publicado.
                </li>
                <li>
                  <strong>5.</strong> Se gostar, contrata. Aí sim o site entra no seu domínio, de verdade.
                </li>
              </ol>
              <div className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
                {nome || "Seu negócio"} · {nichoAtual.nome}
                {cidade ? ` · ${cidade}` : ""} · {logoModo === "texto" ? "nome escrito" : logoModo === "enviar" ? "logo enviado" : "marca do estúdio"}
              </div>
            </section>
          ) : null}

          {aviso ? <p className="text-sm text-muted">{aviso}</p> : null}
        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

          <div className="flex flex-wrap items-center gap-3 pb-24 lg:pb-4">
            {etapa > 1 ? (
              <button type="button" className="rounded-full border border-line px-5 py-3 text-sm" onClick={() => ir(etapa - 1)}>
                Voltar
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading || (etapa === 1 && !nome.trim()) || (etapa === 4 && !nome.trim())}
              className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {loading ? "Montando o site de teste…" : etapa === 4 ? "Ver meu site de teste" : "Continuar"}
            </button>
            {etapa === 4 ? <p className="text-xs text-muted">Link por 3 dias. Sem cartão, sem publicar.</p> : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">{preview}</aside>
      </form>
    </main>
  );
}

function CartaoCanal({
  titulo,
  dica,
  on,
  onChange,
  semSwitch,
  children,
}: {
  titulo: string;
  dica?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  semSwitch?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${on || semSwitch ? "border-line bg-white" : "border-line bg-canvas/60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{titulo}</p>
          {dica ? <p className="mt-0.5 text-xs text-muted">{dica}</p> : null}
        </div>
        {semSwitch ? null : (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onChange(!on)}
            className={`relative h-6 w-11 shrink-0 rounded-full ${on ? "bg-ink" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`} />
          </button>
        )}
      </div>
      <div className={on || semSwitch ? "mt-1" : "pointer-events-none mt-1 opacity-40"}>{children}</div>
    </div>
  );
}
