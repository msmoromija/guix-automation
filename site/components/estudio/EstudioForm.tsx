"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { gerarMarcaSvg } from "@/lib/estudio/marca";
import {
  PALETAS,
  PRESETS,
  TIPOGRAFIAS,
  paletaPorId,
  visualPadrao,
  type VisualConfig,
} from "@/lib/estudio/visual";
import { nichos } from "@/lib/nichos";

const chip =
  "rounded-lg border px-3 py-2 text-left text-sm leading-snug transition disabled:opacity-50";
const chipOn = "border-ink bg-ink text-white";
const chipOff = "border-line bg-white text-ink hover:border-ink/40";

async function arquivoParaDataUrl(file: File) {
  const bmp = await createImageBitmap(file);
  const max = 640;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
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
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [visual, setVisual] = useState<VisualConfig>(() => visualPadrao(nichoInicial));
  const [logoSrc, setLogoSrc] = useState("");
  const [logoModo, setLogoModo] = useState<"nenhum" | "enviar" | "gerar" | "texto">("gerar");
  const [servicos, setServicos] = useState([
    { nome: "", preco: "", duracao: "" },
    { nome: "", preco: "", duracao: "" },
    { nome: "", preco: "", duracao: "" },
  ]);
  const [pros, setPros] = useState([
    { nome: "", cargo: "" },
    { nome: "", cargo: "" },
  ]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const nichoAtual = useMemo(() => nichos.find((n) => n.slug === nicho) || nichos[0], [nicho]);
  const paleta = paletaPorId(visual.paletaId);

  function aplicarPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setVisual((v) => ({ ...v, ...p.visual, presetId: id }));
  }

  function gerarLogo() {
    const data = gerarMarcaSvg({
      nome: nome || nichoAtual.negocio,
      slogan,
      fundo: paleta.color_primary,
      tinta: paleta.color_text,
      acento: paleta.color_accent,
    });
    setLogoSrc(data);
    setLogoModo("gerar");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      let logo = logoSrc;
      if (logoModo === "gerar" && !logo) {
        logo = gerarMarcaSvg({
          nome: nome || nichoAtual.negocio,
          slogan,
          fundo: paleta.color_primary,
          tinta: paleta.color_text,
          acento: paleta.color_accent,
        });
      }
      const res = await fetch("/api/prototipo/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          nicho,
          cidade,
          whatsapp,
          email,
          slogan,
          instagram,
          visual,
          logoSrc: logoModo === "nenhum" || logoModo === "texto" ? undefined : logo,
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
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">ESTÚDIO DO PROTÓTIPO</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.035em]">
        Monte a cara do site em minutos
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Escolha a aparência primeiro — o logo claro ou escuro precisa combinar com o fundo. Depois
        o slogan, a marca e um visual pronto. Nada é publicado: só um arquivo com token, 72 horas.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:max-w-md">
        <button type="button" className={`${chip} ${modo === "simples" ? chipOn : chipOff}`} onClick={() => setModo("simples")}>
          Simplificado
        </button>
        <button type="button" className={`${chip} ${modo === "avancado" ? chipOn : chipOff}`} onClick={() => setModo("avancado")}>
          Avançado
        </button>
      </div>

      <form onSubmit={enviar} className="mt-8 space-y-8">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">1. Modelo e identidade</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Nicho
              <select
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                value={nicho}
                onChange={(e) => {
                  const slug = e.target.value;
                  setNicho(slug);
                  setVisual(visualPadrao(slug));
                }}
              >
                {nichos.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.nome} — {n.negocio}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Nome do negócio
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Paulinho Barbearia"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              Slogan
              <input
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Paulinho Barbearia — Estilo, tradição e confiança em cada corte"
              />
            </label>
            <label className="block text-sm">
              Cidade
              <input
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Aracaju"
              />
            </label>
            <label className="block text-sm">
              WhatsApp
              <input
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="79999990000"
              />
            </label>
            {modo === "avancado" ? (
              <>
                <label className="block text-sm">
                  E-mail
                  <input
                    type="email"
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Instagram (usuário)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="paulinho.barbearia"
                  />
                </label>
              </>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">2. Aparência (antes do logo)</h2>
          <p className="mt-1 text-xs text-muted">Claro, escuro ou automático — o contraste do banner depende disso.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
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

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Visual pronto</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${chip} ${visual.presetId === p.id ? chipOn : chipOff}`}
                onClick={() => aplicarPreset(p.id)}
              >
                <span className="block font-medium">{p.nome}</span>
                <span className="mt-0.5 block text-xs opacity-80">{p.desc}</span>
              </button>
            ))}
          </div>

          {modo === "avancado" ? (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Paleta</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {PALETAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${chip} flex items-center gap-2 ${visual.paletaId === p.id ? chipOn : chipOff}`}
                    onClick={() => setVisual((v) => ({ ...v, paletaId: p.id }))}
                  >
                    <span className="flex h-6 w-10 overflow-hidden rounded">
                      <i className="h-full flex-1" style={{ background: p.color_background }} />
                      <i className="h-full flex-1" style={{ background: p.color_accent }} />
                      <i className="h-full flex-1" style={{ background: p.color_text }} />
                    </span>
                    {p.nome}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Tipografia</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {TIPOGRAFIAS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${chip} ${visual.tipografiaId === t.id ? chipOn : chipOff}`}
                    onClick={() => setVisual((v) => ({ ...v, tipografiaId: t.id }))}
                  >
                    {t.nome}
                    <span className="mt-0.5 block text-xs opacity-80">
                      {t.font_heading} + {t.font_body}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                <CampoEscolha
                  label="Banner"
                  valor={visual.banner}
                  opcoes={[
                    ["automatico", "Automático"],
                    ["solido", "Cor sólida"],
                    ["degrade", "Degradê"],
                  ]}
                  onChange={(banner) => setVisual((v) => ({ ...v, banner: banner as VisualConfig["banner"] }))}
                />
                <CampoEscolha
                  label="Botões"
                  valor={visual.botao}
                  opcoes={[
                    ["arredondado", "Arredondados"],
                    ["pílula", "Pílula"],
                    ["quadrado", "Quadrados"],
                    ["sem-contorno", "Sem contorno"],
                  ]}
                  onChange={(botao) => setVisual((v) => ({ ...v, botao: botao as VisualConfig["botao"] }))}
                />
                <CampoEscolha
                  label="Animação"
                  valor={visual.animacao}
                  opcoes={[
                    ["suave", "Suave"],
                    ["media", "Média"],
                    ["intensa", "Intensa"],
                  ]}
                  onChange={(animacao) => setVisual((v) => ({ ...v, animacao: animacao as VisualConfig["animacao"] }))}
                />
              </div>
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">3. Logomarca</h2>
          <p className="mt-1 text-xs text-muted">
            Envie a sua, gere uma marca com as iniciais (gratuito, na hora) ou use só o nome em texto. Sem
            Fabric/Konva no primeiro passo: a marca gerada já usa as cores do tema.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["gerar", "Gerar marca"],
                ["enviar", "Enviar arquivo"],
                ["texto", "Só o nome"],
                ["nenhum", "Sem logo"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${chip} ${logoModo === id ? chipOn : chipOff}`}
                onClick={() => {
                  setLogoModo(id);
                  if (id === "gerar") gerarLogo();
                  if (id === "texto" || id === "nenhum") setLogoSrc("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {logoModo === "enviar" ? (
            <label className="mt-4 block text-sm">
              Arquivo (PNG, JPG, SVG, WebP)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="mt-1.5 w-full text-sm"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (!f) return;
                  void arquivoParaDataUrl(f)
                    .then(setLogoSrc)
                    .catch(() => setErro("Não deu para ler o arquivo."));
                }}
              />
            </label>
          ) : null}
          {logoSrc ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-line" style={{ background: paleta.color_background }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Prévia da marca" className="mx-auto h-24 w-auto object-contain p-3" />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">O nome aparece no cabeçalho como texto.</p>
          )}
        </section>

        {modo === "avancado" ? (
          <>
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-sm font-semibold">4. Componentes</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Toggle
                  label="WhatsApp flutuante"
                  on={visual.whatsappFlutuante}
                  onChange={(whatsappFlutuante) => setVisual((v) => ({ ...v, whatsappFlutuante }))}
                />
                <Toggle
                  label="Instagram"
                  on={visual.instagram}
                  onChange={(instagramOn) => setVisual((v) => ({ ...v, instagram: instagramOn }))}
                />
                <Toggle
                  label="Agendamento online"
                  on={visual.agendamento}
                  onChange={(agendamento) => setVisual((v) => ({ ...v, agendamento }))}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-sm font-semibold">5. Serviços e preços</h2>
              <p className="mt-1 text-xs text-muted">Tabela simples. Deixe em branco para usar o modelo do nicho.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th className="pb-2 font-medium">Serviço</th>
                      <th className="pb-2 font-medium">Preço</th>
                      <th className="pb-2 font-medium">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicos.map((s, i) => (
                      <tr key={i}>
                        <td className="pr-2 pb-2">
                          <input
                            className="w-full rounded-lg border border-line px-2 py-2"
                            value={s.nome}
                            placeholder="Corte"
                            onChange={(e) =>
                              setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))
                            }
                          />
                        </td>
                        <td className="pr-2 pb-2">
                          <input
                            className="w-full rounded-lg border border-line px-2 py-2"
                            value={s.preco}
                            placeholder="R$ 45"
                            onChange={(e) =>
                              setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, preco: e.target.value } : r)))
                            }
                          />
                        </td>
                        <td className="pb-2">
                          <input
                            className="w-full rounded-lg border border-line px-2 py-2"
                            value={s.duracao}
                            placeholder="40 min"
                            onChange={(e) =>
                              setServicos((rows) =>
                                rows.map((r, j) => (j === i ? { ...r, duracao: e.target.value } : r)),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-sm font-semibold">6. Profissionais</h2>
              <p className="mt-1 text-xs text-muted">Foto entra depois, no painel. Aqui basta nome e função.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {pros.map((p, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-line px-2 py-2 text-sm"
                      placeholder="Nome"
                      value={p.nome}
                      onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))}
                    />
                    <input
                      className="rounded-lg border border-line px-2 py-2 text-sm"
                      placeholder="Função"
                      value={p.cargo}
                      onChange={(e) =>
                        setPros((rows) => rows.map((r, j) => (j === i ? { ...r, cargo: e.target.value } : r)))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <button
          type="submit"
          disabled={loading || !nome}
          className="w-full rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50 sm:w-auto sm:min-w-64"
        >
          {loading ? "Gerando protótipo…" : "Gerar meu protótipo"}
        </button>
      </form>
    </main>
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
      <div className="mt-2 grid grid-cols-2 gap-2">
        {opcoes.map(([id, nome]) => (
          <button
            key={id}
            type="button"
            className={`${chip} ${valor === id ? chipOn : chipOff}`}
            onClick={() => onChange(id)}
          >
            {nome}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`${chip} ${on ? chipOn : chipOff}`} onClick={() => onChange(!on)}>
      {label}: {on ? "ligado" : "desligado"}
    </button>
  );
}
