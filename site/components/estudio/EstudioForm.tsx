"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { propostasEstudio } from "@/lib/estudio/marca";
import {
  PALETAS,
  PRESETS,
  TIPOGRAFIAS,
  paletaPorId,
  visualPadrao,
  type VisualConfig,
} from "@/lib/estudio/visual";
import { nichos } from "@/lib/nichos";

const campo = "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink";
const chip = "rounded-xl border px-3 py-2.5 text-left text-sm leading-snug transition";
const chipOn = "border-ink bg-ink text-white";
const chipOff = "border-line bg-white text-ink hover:border-ink/30";

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

  const [modo, setModo] = useState<"simples" | "avancado">("simples");
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
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const nichoAtual = useMemo(() => nichos.find((n) => n.slug === nicho) || nichos[0], [nicho]);
  const paleta = paletaPorId(visual.paletaId);
  const nomeMarca = nome.trim() || nichoAtual.negocio;
  const logoSrc = logoModo === "enviar" ? logoUpload : logoModo === "texto" ? "" : propostas.find((p) => p.id === propostaId)?.src || "";

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

  async function gerarComIa() {
    setErro("");
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
        setErro(data.erro || "A IA não conseguiu gerar agora. Use um dos lockups do estúdio.");
        return;
      }
      const p = data.proposta as Proposta;
      setPropostas((lista) => [p, ...lista.filter((x) => x.id !== p.id)]);
      setPropostaId(p.id);
    } catch {
      setErro("Falha ao falar com a IA da marca.");
    } finally {
      setGerandoIa(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">ESTÚDIO DO PROTÓTIPO</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-[-0.035em]">A cara do negócio, não uma planilha</h1>
          <p className="mt-3 text-muted">
            Aparência primeiro, depois a marca com nome por extenso — e IA para o emblema. O rascunho some em 72 horas.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-72">
          <button type="button" className={`${chip} ${modo === "simples" ? chipOn : chipOff}`} onClick={() => setModo("simples")}>
            Essencial
          </button>
          <button type="button" className={`${chip} ${modo === "avancado" ? chipOn : chipOff}`} onClick={() => setModo("avancado")}>
            Estúdio completo
          </button>
        </div>
      </div>

      <form onSubmit={enviar} className="mt-10 space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold">Negócio</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Nicho
              <select
                className={campo}
                value={nicho}
                onChange={(e) => {
                  setNicho(e.target.value);
                  setVisual(visualPadrao(e.target.value));
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
              Slogan
              <input
                className={campo}
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Estilo, tradição e confiança em cada corte"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold">Aparência</h2>
          <p className="mt-1 text-sm text-muted">Defina claro ou escuro antes da marca — o logo precisa contrastar com o banner.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["claro", "escuro", "automatico"] as const).map((a) => (
              <button
                key={a}
                type="button"
                className={`${chip} ${visual.aparencia === a ? chipOn : chipOff}`}
                onClick={() => setVisual((v) => ({ ...v, aparencia: a }))}
              >
                {a === "automatico" ? "Automático" : a === "claro" ? "Claro" : "Escuro"}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${chip} ${visual.presetId === p.id ? chipOn : chipOff}`}
                onClick={() => setVisual((v) => ({ ...v, ...p.visual, presetId: p.id }))}
              >
                <span className="block font-medium">{p.nome}</span>
                <span className="mt-0.5 block text-xs opacity-75">{p.desc}</span>
              </button>
            ))}
          </div>
          {modo === "avancado" ? (
            <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Paleta</p>
                <div className="mt-2 grid gap-2">
                  {PALETAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`${chip} flex items-center gap-3 ${visual.paletaId === p.id ? chipOn : chipOff}`}
                      onClick={() => setVisual((v) => ({ ...v, paletaId: p.id }))}
                    >
                      <span className="flex h-7 w-14 overflow-hidden rounded-md">
                        <i className="flex-1" style={{ background: p.color_background }} />
                        <i className="flex-1" style={{ background: p.color_accent }} />
                        <i className="flex-1" style={{ background: p.color_text }} />
                      </span>
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tipografia</p>
                  <div className="mt-2 grid gap-2">
                    {TIPOGRAFIAS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`${chip} ${visual.tipografiaId === t.id ? chipOn : chipOff}`}
                        onClick={() => setVisual((v) => ({ ...v, tipografiaId: t.id }))}
                      >
                        {t.nome}
                        <span className="mt-0.5 block text-xs opacity-75">
                          {t.font_heading} + {t.font_body}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <CampoEscolha
                  label="Cabeçalho"
                  valor={visual.cabecalho}
                  opcoes={[
                    ["logo-esquerda", "Logo à esquerda"],
                    ["centralizado", "Centralizado"],
                    ["logo-slogan", "Logo + slogan"],
                  ]}
                  onChange={(cabecalho) => setVisual((v) => ({ ...v, cabecalho: cabecalho as VisualConfig["cabecalho"] }))}
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex min-h-[280px] flex-col justify-between p-6" style={{ background: paleta.color_background, color: paleta.color_text }}>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: paleta.color_accent }}>
                  Marca · {gerandoIa ? "IA desenhando o emblema" : "estúdio"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Logomarca</h2>
                <p className="mt-2 max-w-md text-sm opacity-80">
                  O nome entra tipografado — a IA desenha o símbolo. Assim o texto não sai torto, que é o erro clássico de gerador de logo.
                </p>
              </div>
              <div className="mt-8 flex min-h-[140px] items-center justify-center rounded-xl px-4" style={{ background: paleta.color_surface }}>
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="Prévia da marca" className="max-h-36 w-full object-contain" />
                ) : (
                  <p className="text-sm opacity-60">O nome aparece só em texto no cabeçalho</p>
                )}
              </div>
            </div>
            <div className="border-t border-line p-6 lg:border-t-0 lg:border-l">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["gerar", "Estúdio + IA"],
                    ["enviar", "Enviar arquivo"],
                    ["texto", "Só o nome"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} type="button" className={`${chip} text-center text-xs ${logoModo === id ? chipOn : chipOff}`} onClick={() => setLogoModo(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={gerandoIa || nomeMarca.length < 2}
                onClick={() => void gerarComIa()}
                className="mt-4 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {gerandoIa ? "Gerando emblema com IA…" : "Gerar emblema com IA"}
              </button>
              {logoModo === "enviar" ? (
                <label className="mt-4 block text-sm">
                  PNG, JPG, SVG ou WebP
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
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {propostas.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setLogoModo("gerar");
                        setPropostaId(p.id);
                      }}
                      className={`overflow-hidden rounded-xl border text-left ${propostaId === p.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                    >
                      <div className="flex h-16 items-center justify-center px-2" style={{ background: paleta.color_background }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src} alt="" className="h-12 w-full object-contain" />
                      </div>
                      <span className="block px-2 py-1.5 text-[11px] font-medium">{p.titulo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold">Presença e contato</h2>
          <p className="mt-1 text-sm text-muted">Ligue o que entra no site e cole o endereço real — perfil ou URL completa.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <CartaoCanal
              titulo="WhatsApp flutuante"
              dica="Botão fixo no canto da página"
              on={visual.whatsappFlutuante}
              onChange={(whatsappFlutuante) => setVisual((v) => ({ ...v, whatsappFlutuante }))}
            >
              <input className={campo} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="79 99999-0000" />
            </CartaoCanal>
            <CartaoCanal
              titulo="Agendamento"
              dica="Botão de hora marcada no cabeçalho"
              on={visual.agendamento}
              onChange={(agendamento) => setVisual((v) => ({ ...v, agendamento }))}
            >
              <p className="mt-2 text-sm text-muted">Usa o mesmo WhatsApp até o painel de agenda estar ativo.</p>
            </CartaoCanal>
            <CartaoCanal
              titulo="Instagram"
              on={visual.instagram}
              onChange={(instagram) => setVisual((v) => ({ ...v, instagram }))}
            >
              <input
                className={campo}
                value={redes.instagram}
                onChange={(e) => setRedes((r) => ({ ...r, instagram: e.target.value }))}
                placeholder="@paulinho.barbearia ou URL"
              />
            </CartaoCanal>
            <CartaoCanal titulo="Facebook" on={visual.facebook} onChange={(facebook) => setVisual((v) => ({ ...v, facebook }))}>
              <input
                className={campo}
                value={redes.facebook}
                onChange={(e) => setRedes((r) => ({ ...r, facebook: e.target.value }))}
                placeholder="facebook.com/paulinho"
              />
            </CartaoCanal>
            <CartaoCanal titulo="LinkedIn" on={visual.linkedin} onChange={(linkedin) => setVisual((v) => ({ ...v, linkedin }))}>
              <input
                className={campo}
                value={redes.linkedin}
                onChange={(e) => setRedes((r) => ({ ...r, linkedin: e.target.value }))}
                placeholder="linkedin.com/company/..."
              />
            </CartaoCanal>
            <CartaoCanal titulo="E-mail" on={Boolean(email)} onChange={() => undefined} semSwitch>
              <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@negocio.com" />
            </CartaoCanal>
          </div>
          {modo === "avancado" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <CartaoCanal titulo="TikTok" on={visual.tiktok} onChange={(tiktok) => setVisual((v) => ({ ...v, tiktok }))}>
                <input className={campo} value={redes.tiktok} onChange={(e) => setRedes((r) => ({ ...r, tiktok: e.target.value }))} placeholder="@usuario" />
              </CartaoCanal>
              <CartaoCanal titulo="YouTube" on={visual.youtube} onChange={(youtube) => setVisual((v) => ({ ...v, youtube }))}>
                <input className={campo} value={redes.youtube} onChange={(e) => setRedes((r) => ({ ...r, youtube: e.target.value }))} placeholder="youtube.com/@" />
              </CartaoCanal>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl bg-canvas p-5">
            <p className="text-sm font-semibold">Endereço</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-6">
              <label className="block text-sm sm:col-span-4">
                Rua
                <input className={campo} value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Rua da Palmeira" />
              </label>
              <label className="block text-sm sm:col-span-2">
                Número
                <input className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="120" />
              </label>
              <label className="block text-sm sm:col-span-2">
                Bairro
                <input className={campo} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" />
              </label>
              <label className="block text-sm sm:col-span-2">
                Cidade
                <input className={campo} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Aracaju" />
              </label>
              <label className="block text-sm">
                UF
                <input className={campo} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} placeholder="SE" />
              </label>
              <label className="block text-sm">
                CEP
                <input className={campo} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="49000-000" />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Serviços e preços</h2>
              <p className="mt-1 text-sm text-muted">Um cartão por serviço. Vazio usa o modelo do nicho.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-sm"
              onClick={() => setServicos((s) => [...s, { nome: "", preco: "", duracao: "", descricao: "" }])}
            >
              Adicionar serviço
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {servicos.map((s, i) => (
              <article key={i} className="flex flex-col rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Serviço {i + 1}</p>
                  {servicos.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-ink"
                      onClick={() => setServicos((rows) => rows.filter((_, j) => j !== i))}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
                <label className="mt-3 block text-sm">
                  Nome
                  <input
                    className={campo}
                    value={s.nome}
                    placeholder="Corte clássico"
                    onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))}
                  />
                </label>
                <label className="mt-3 block text-sm">
                  O que inclui
                  <textarea
                    rows={2}
                    className={`${campo} resize-none`}
                    value={s.descricao}
                    placeholder="Máquina + tesoura, finalização com toalha quente."
                    onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, descricao: e.target.value } : r)))}
                  />
                </label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    Preço
                    <input
                      className={campo}
                      value={s.preco}
                      placeholder="R$ 45"
                      onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, preco: e.target.value } : r)))}
                    />
                  </label>
                  <label className="block text-sm">
                    Duração
                    <input
                      className={campo}
                      value={s.duracao}
                      placeholder="40 min"
                      onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, duracao: e.target.value } : r)))}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Equipe</h2>
              <p className="mt-1 text-sm text-muted">Foto opcional. Sem foto, o site usa a inicial.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-sm"
              onClick={() => setPros((p) => [...p, { nome: "", cargo: "", descricao: "", fotoSrc: "" }])}
            >
              Adicionar profissional
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {pros.map((p, i) => (
              <article key={i} className="flex gap-4 rounded-2xl border border-line p-4">
                <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-canvas text-center text-[11px] text-muted">
                  {p.fotoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.fotoSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      Foto
                      <span className="mt-1 opacity-70">opcional</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (!f) return;
                      void arquivoParaDataUrl(f, 360).then((src) =>
                        setPros((rows) => rows.map((r, j) => (j === i ? { ...r, fotoSrc: src } : r))),
                      );
                    }}
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-end">
                    {pros.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs text-muted"
                        onClick={() => setPros((rows) => rows.filter((_, j) => j !== i))}
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>
                  <input
                    className={campo}
                    placeholder="Nome"
                    value={p.nome}
                    onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))}
                  />
                  <input
                    className={campo}
                    placeholder="Função — barbeiro, sócia, recepção"
                    value={p.cargo}
                    onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, cargo: e.target.value } : r)))}
                  />
                  <textarea
                    rows={2}
                    className={`${campo} resize-none`}
                    placeholder="Uma linha sobre o trabalho da pessoa."
                    value={p.descricao}
                    onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, descricao: e.target.value } : r)))}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !nome}
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? "Gerando protótipo…" : "Gerar meu protótipo"}
          </button>
          <p className="text-xs text-muted">Nada fica no ar. Só o arquivo com token, 72 horas.</p>
        </div>
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

function CampoEscolha({
  label,
  valor,
  opcoes,
  onChange,
}: {
  label: string;
  valor: string;
  opcoes: Array<[string, string]>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {opcoes.map(([id, nome]) => (
          <button key={id} type="button" className={`${chip} ${valor === id ? chipOn : chipOff}`} onClick={() => onChange(id)}>
            {nome}
          </button>
        ))}
      </div>
    </div>
  );
}
