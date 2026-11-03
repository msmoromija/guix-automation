"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SeletorFoto } from "@/components/estudio/SeletorFoto";
import { GradeExpediente } from "@/components/estudio/GradeExpediente";
import {
  agendaProParaExpediente,
  agendaProParaVisual,
  expedientePadrao,
  expedienteParaSchema,
  normalizarDiaExpediente,
  normalizarPassoMinutos,
  resumoDoExpediente,
  schemaParaExpediente,
  type AusenciaPro,
  type DiaExpediente,
} from "@/lib/estudio/expediente";
import type { VisualConfig } from "@/lib/estudio/visual";
import type { SlotFoto } from "@/components/preview/SiteLivePreview";

const campo =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15";

type Aba = "equipe" | "avisos" | "servicos" | "faq" | "contato" | "horario";

type ProLinha = {
  nome: string;
  cargo: string;
  descricao: string;
  fotoSrc: string;
  whatsapp: string;
  expediente: DiaExpediente[];
  ausencias: AusenciaPro[];
};

type ServicoLinha = { nome: string; preco: string; duracao: string; descricao: string };
type FaqItem = { pergunta: string; resposta: string };
type AvisoLinha = { titulo: string; descricao: string; dataLabel: string; horario: string };

function proVazio(casa: DiaExpediente[]): ProLinha {
  return {
    nome: "",
    cargo: "",
    descricao: "",
    fotoSrc: "",
    whatsapp: "",
    expediente: casa.map((d) => normalizarDiaExpediente(d)),
    ausencias: [],
  };
}

export function EditorAdmin({ id, token, demo }: { id: string; token: string; demo?: boolean }) {
  const [aba, setAba] = useState<Aba>("equipe");
  const [carregando, setCarregando] = useState(!demo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [empresa, setEmpresa] = useState(demo ? "Barbearia Modelo" : "");
  const [expediente, setExpediente] = useState<DiaExpediente[]>(() => expedientePadrao());
  const [passoMin, setPassoMin] = useState(30);
  const [pros, setPros] = useState<ProLinha[]>(() =>
    demo
      ? [
          {
            nome: "Carlos",
            cargo: "Barbeiro",
            descricao: "",
            fotoSrc: "",
            whatsapp: "",
            expediente: expedientePadrao(),
            ausencias: [],
          },
        ]
      : [],
  );
  const [avisos, setAvisos] = useState<AvisoLinha[]>(
    demo ? [{ titulo: "Natal", descricao: "Não atenderemos no Natal.", dataLabel: "25/12", horario: "09:00" }] : [],
  );
  const [servicos, setServicos] = useState<ServicoLinha[]>(
    demo
      ? [
          { nome: "Corte masculino", preco: "R$ 50", duracao: "30 min", descricao: "Tesoura ou máquina." },
          { nome: "Barba", preco: "R$ 35", duracao: "30 min", descricao: "Toalha quente e navalha." },
        ]
      : [],
  );
  const [faqTitulo, setFaqTitulo] = useState("Dúvidas");
  const [faqs, setFaqs] = useState<FaqItem[]>(
    demo ? [{ pergunta: "Precisa agendar?", resposta: "Sim — escolha o horário no site." }] : [],
  );
  const [whatsapp, setWhatsapp] = useState(demo ? "79 99999-0000" : "");
  const [email, setEmail] = useState(demo ? "contato@modelo.com.br" : "");
  const [logradouro, setLogradouro] = useState(demo ? "Rua das Flores" : "");
  const [numero, setNumero] = useState(demo ? "120" : "");
  const [bairro, setBairro] = useState(demo ? "Centro" : "");
  const [cidade, setCidade] = useState(demo ? "Aracaju" : "");
  const [estado, setEstado] = useState(demo ? "SE" : "");
  const [cep, setCep] = useState(demo ? "49000-000" : "");
  const [instagram, setInstagram] = useState(demo ? "@barbearia" : "");
  const [facebook, setFacebook] = useState("");
  const [comoEncontrar, setComoEncontrar] = useState(demo ? "Em frente à praça, portão azul." : "");
  const [mapaEmbed, setMapaEmbed] = useState("");
  const [horarioResumo, setHorarioResumo] = useState("");
  const [fotoProIndice, setFotoProIndice] = useState<number | null>(null);
  const [slotFoto, setSlotFoto] = useState<SlotFoto | null>(null);
  const [nicho, setNicho] = useState("barbearia");

  const qs = useMemo(() => `t=${encodeURIComponent(token)}`, [token]);

  const carregar = useCallback(async () => {
    if (demo) {
      setCarregando(false);
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch(`/api/prototipo/${id}/conteudo?${qs}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Não foi possível abrir o controle.");
        return;
      }
      const site = (json.site || {}) as Record<string, unknown>;
      const visual = (json.visual || {}) as VisualConfig;
      setNicho(String(json.nicho || "barbearia"));
      const emp = (site.empresa || {}) as {
        nome?: string;
        whatsapp?: string;
        email?: string;
        horario_resumo?: string;
        expediente?: Array<{ dia: string; label?: string; intervalos?: string[] }>;
        endereco?: {
          logradouro?: string;
          numero?: string;
          bairro?: string;
          cidade?: string;
          estado?: string;
          cep?: string;
          mapa_embed_url?: string;
        };
        redes?: Array<{ id?: string; url?: string }>;
      };
      const casa = schemaParaExpediente(emp.expediente);
      setEmpresa(emp.nome || "");
      setExpediente(casa);
      setPassoMin(normalizarPassoMinutos(visual.duracaoSlotMinutos));
      setWhatsapp(String(emp.whatsapp || ""));
      setEmail(String(emp.email || ""));
      setHorarioResumo(String(emp.horario_resumo || ""));
      setLogradouro(String(emp.endereco?.logradouro || ""));
      setNumero(String(emp.endereco?.numero || ""));
      setBairro(String(emp.endereco?.bairro || ""));
      setCidade(String(emp.endereco?.cidade || ""));
      setEstado(String(emp.endereco?.estado || ""));
      setCep(String(emp.endereco?.cep || ""));
      setMapaEmbed(String(emp.endereco?.mapa_embed_url || ""));
      const redes = Array.isArray(emp.redes) ? emp.redes : [];
      setInstagram(String(redes.find((r) => r.id === "instagram")?.url || "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "@"));
      setFacebook(String(redes.find((r) => r.id === "facebook")?.url || ""));

      const blocoPro = (site.profissionais || {}) as {
        itens?: Array<{ nome?: string; cargo?: string; descricao?: string; whatsapp?: string; foto?: { src?: string } }>;
      };
      const agendas = visual.agendaEquipe || [];
      const nomes = (blocoPro.itens || [])
        .map((p) => String(p.nome || "").trim())
        .filter((n) => n && n.toLowerCase() !== "sem preferência");
      setPros(
        nomes.length
          ? nomes.map((nome, i) => {
              const item = blocoPro.itens![i];
              const agenda = agendas.find((a) => a.nome.trim().toLowerCase() === nome.toLowerCase());
              return {
                nome,
                cargo: String(item?.cargo || ""),
                descricao: String(item?.descricao || ""),
                fotoSrc: String(item?.foto?.src || ""),
                whatsapp: String(item?.whatsapp || ""),
                expediente: agenda
                  ? agendaProParaExpediente({
                      nome: agenda.nome,
                      dias: (agenda.dias || []).map((d) =>
                        typeof d === "string"
                          ? { dia: d as DiaExpediente["dia"], inicio: agenda.inicio || "09:00", fim: agenda.fim || "18:00" }
                          : {
                              dia: d.dia as DiaExpediente["dia"],
                              inicio: d.inicio,
                              fim: d.fim,
                              pausa: d.pausa,
                              pausaInicio: d.pausaInicio,
                              pausaFim: d.pausaFim,
                            },
                      ),
                      ausencias: agenda.ausencias,
                    })
                  : casa.map((d) => normalizarDiaExpediente(d)),
                ausencias: (agenda?.ausencias || []).map((u) => ({ ...u })),
              };
            })
          : [],
      );

      const ev = (site.eventos || {}) as { itens?: Array<{ titulo?: string; descricao?: string; data_label?: string; horario?: string }> };
      setAvisos(
        (ev.itens || [])
          .filter((e) => e.titulo)
          .map((e) => ({
            titulo: String(e.titulo || ""),
            descricao: String(e.descricao || ""),
            dataLabel: String(e.data_label || ""),
            horario: String(e.horario || "09:00"),
          })),
      );

      const srv = (site.servicos || {}) as {
        itens?: Array<{ nome?: string; preco_label?: string; duracao_label?: string; descricao?: string }>;
      };
      setServicos(
        (srv.itens || [])
          .filter((s) => s.nome)
          .map((s) => ({
            nome: String(s.nome || ""),
            preco: String(s.preco_label || ""),
            duracao: String(s.duracao_label || "30 min"),
            descricao: String(s.descricao || ""),
          })),
      );

      const faq = (site.faq || {}) as { titulo?: string; itens?: Array<{ pergunta?: string; resposta?: string }> };
      setFaqTitulo(String(faq.titulo || "Dúvidas"));
      setFaqs(
        (faq.itens || [])
          .filter((f) => f.pergunta)
          .map((f) => ({ pergunta: String(f.pergunta || ""), resposta: String(f.resposta || "") })),
      );

      const contato = (site.contato || {}) as { texto?: string; subtitulo?: string };
      setComoEncontrar(String(contato.texto || contato.subtitulo || ""));
    } catch {
      setErro("Falha de rede ao carregar o controle.");
    } finally {
      setCarregando(false);
    }
  }, [demo, id, qs]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    setHorarioResumo(resumoDoExpediente(expediente));
  }, [expediente]);

  async function salvar() {
    if (demo) {
      setOk("Demonstração — alterações não são gravadas. No site real, o administrador salva aqui.");
      return;
    }
    setOk("");
    setErro("");
    setSalvando(true);
    try {
      const agendaEquipe = pros
        .filter((p) => p.nome.trim())
        .map((p) => agendaProParaVisual(p.nome, p.expediente, p.ausencias));
      const res = await fetch(`/api/prototipo/${id}?${qs}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          somenteAdmin: true,
          duracaoSlotMinutos: passoMin,
          expediente: expedienteParaSchema(expediente, passoMin),
          horarioResumo,
          agendaEquipe,
          profissionais: pros
            .filter((p) => p.nome.trim())
            .map((p) => ({
              nome: p.nome.trim(),
              cargo: p.cargo.trim(),
              descricao: p.descricao.trim(),
              fotoSrc: p.fotoSrc,
              whatsapp: p.whatsapp,
            })),
          avisos: avisos.filter((a) => a.titulo.trim()),
          servicos: servicos.filter((s) => s.nome.trim()),
          faq: { titulo: faqTitulo, itens: faqs.filter((f) => f.pergunta.trim() && f.resposta.trim()) },
          whatsapp,
          email,
          endereco: { logradouro, numero, bairro, cidade, estado, cep, mapa_embed_url: mapaEmbed },
          redes: { instagram, facebook },
          comoEncontrar,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || json.aviso || "Não salvou.");
        return;
      }
      setOk("Controle atualizado. O site público já reflete estas mudanças.");
      if (json.site || json.visual) await carregar();
    } catch {
      setErro("Falha de rede ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const abas: { id: Aba; label: string }[] = [
    { id: "equipe", label: "Profissionais" },
    { id: "horario", label: "Horário e vagas" },
    { id: "avisos", label: "Avisos" },
    { id: "servicos", label: "Serviços" },
    { id: "faq", label: "FAQ" },
    { id: "contato", label: "Contato e local" },
  ];

  if (carregando) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo controle…</main>;
  }

  if (erro && !empresa && !demo) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Administrador do site</h1>
        <p className="mt-3 text-muted">{erro}</p>
        <Link href={`/conta/${id}?${qs}`} className="mt-6 inline-flex text-sm font-semibold text-accent underline">
          Voltar à área do cliente
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">
            {demo ? "DEMONSTRAÇÃO · ADMIN" : "ADMINISTRADOR DO SITE"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Controle do estabelecimento</h1>
          <p className="mt-2 text-sm text-muted">
            {empresa || "Seu negócio"} · sem IA · equipe, agenda, avisos, serviços, FAQ e como o cliente encontra.
          </p>
        </div>
        {demo ? (
          <Link href="/exemplos/barbearia" className="text-sm font-medium text-muted underline">
            Voltar ao exemplo
          </Link>
        ) : (
          <Link href={`/conta/${id}?${qs}`} className="text-sm font-medium text-muted underline">
            Voltar
          </Link>
        )}
      </div>

      {demo ? (
        <p className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          Isto é o painel pós-venda. No site publicado, o dono cadastra profissionais, define vagas (ex.: 30 em 30 min) e
          avisos ocasionais. O cliente final marca horário no bloco Agendar do site.
        </p>
      ) : null}

      {erro ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</p> : null}
      {ok ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{ok}</p> : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`rounded-full px-3.5 py-2 text-sm font-medium ${aba === a.id ? "bg-ink text-white" : "border border-line bg-white"}`}
            onClick={() => setAba(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "equipe" ? (
        <section className="gx-form-card mt-5 space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Profissionais</h2>
              <p className="mt-1 text-sm text-muted">Quem atende. Ajuste a grade na aba Horário ou em Agenda.</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
              onClick={() => setPros((lista) => [...lista, proVazio(expediente)])}
            >
              Incluir profissional
            </button>
          </div>
          {pros.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-muted">Ninguém cadastrado. O agendamento usa “Sem preferência”.</p>
          ) : (
            pros.map((p, i) => (
              <article key={`adm-pro-${i}`} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{p.nome.trim() || `Profissional ${i + 1}`}</p>
                  <button type="button" className="text-xs text-muted underline" onClick={() => setPros((rows) => rows.filter((_, j) => j !== i))}>
                    Remover
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr]">
                  <div className="space-y-2">
                    <div className="aspect-square overflow-hidden rounded-xl border border-line bg-canvas">
                      {p.fotoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.fotoSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted">Foto</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-full border border-line px-2 py-1.5 text-xs font-medium"
                      onClick={() => {
                        setFotoProIndice(i);
                        setSlotFoto({ tipo: "sobre" });
                      }}
                    >
                      Trocar foto
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-muted">
                      Nome
                      <input className={campo} value={p.nome} onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))} />
                    </label>
                    <label className="text-xs font-semibold text-muted">
                      Especialidade
                      <input className={campo} value={p.cargo} onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, cargo: e.target.value } : r)))} />
                    </label>
                    <label className="text-xs font-semibold text-muted sm:col-span-2">
                      WhatsApp (opcional)
                      <input className={campo} value={p.whatsapp} onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, whatsapp: e.target.value } : r)))} />
                    </label>
                  </div>
                </div>
              </article>
            ))
          )}
          {!demo ? (
            <p className="text-xs text-muted">
              Grade e ausências detalhadas também em{" "}
              <Link href={`/conta/${id}/agenda?${qs}`} className="font-semibold text-accent underline">
                Agenda e solicitações
              </Link>
              .
            </p>
          ) : null}
        </section>
      ) : null}

      {aba === "horario" ? (
        <section className="gx-form-card mt-5 space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">Duração de cada vaga</h2>
            <p className="mt-1 text-sm text-muted">
              Do horário de entrada até a saída (e até a pausa), o site abre uma vaga a cada intervalo. Serviços mais longos ocupam várias vagas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[15, 20, 30, 45, 60, 90].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${passoMin === n ? "bg-ink text-white" : "border border-line bg-white"}`}
                  onClick={() => setPassoMin(n)}
                >
                  {n} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold">Horário da casa</h2>
            <p className="mt-1 text-sm text-muted">Base do agendamento público.</p>
            <div className="mt-3">
              <GradeExpediente atalhos value={expediente} onChange={setExpediente} />
            </div>
            <p className="mt-2 text-xs text-muted">{horarioResumo}</p>
          </div>
          {pros.length ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Horário por profissional</h2>
              {pros.map((p, i) => (
                <div key={`grade-${i}`} className="rounded-2xl border border-line p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{p.nome || `Profissional ${i + 1}`}</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-accent underline"
                      onClick={() =>
                        setPros((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, expediente: expediente.map((d) => normalizarDiaExpediente(d)) } : r)),
                        )
                      }
                    >
                      Copiar horário da casa
                    </button>
                  </div>
                  <GradeExpediente
                    atalhos
                    compacto
                    value={p.expediente}
                    onChange={(prox) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, expediente: prox } : r)))}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {aba === "avisos" ? (
        <section className="gx-form-card mt-5 space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Avisos e recessos</h2>
              <p className="mt-1 text-sm text-muted">Ocasionais — Natal, folga, reforma. Aparecem na agenda do site.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium"
              disabled={avisos.length >= 4}
              onClick={() =>
                setAvisos((lista) => [...lista, { titulo: "", descricao: "", dataLabel: "", horario: "09:00" }])
              }
            >
              Incluir aviso
            </button>
          </div>
          {avisos.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-muted">Nenhum aviso no momento.</p>
          ) : (
            avisos.map((a, i) => (
              <div key={`av-${i}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
                <input className={campo} value={a.titulo} placeholder="Natal / Recesso" onChange={(e) => setAvisos((lista) => lista.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))} />
                <input className={campo} value={a.dataLabel} placeholder="25/12" onChange={(e) => setAvisos((lista) => lista.map((x, j) => (j === i ? { ...x, dataLabel: e.target.value } : x)))} />
                <textarea className={`${campo} sm:col-span-2`} rows={2} value={a.descricao} placeholder="Não atenderemos neste dia." onChange={(e) => setAvisos((lista) => lista.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))} />
                <button type="button" className="text-xs text-muted" onClick={() => setAvisos((lista) => lista.filter((_, j) => j !== i))}>
                  Remover
                </button>
              </div>
            ))
          )}
        </section>
      ) : null}

      {aba === "servicos" ? (
        <section className="gx-form-card mt-5 space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Serviços no site</h2>
              <p className="mt-1 text-sm text-muted">Nome, preço e duração — a duração define quantas vagas o agendamento reserva.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium"
              onClick={() => setServicos((lista) => [...lista, { nome: "", preco: "", duracao: `${passoMin} min`, descricao: "" }])}
            >
              Incluir serviço
            </button>
          </div>
          {servicos.map((s, i) => (
            <div key={`srv-${i}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
              <input className={campo} value={s.nome} placeholder="Nome" onChange={(e) => setServicos((lista) => lista.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} />
              <input className={campo} value={s.preco} placeholder="R$ 50" onChange={(e) => setServicos((lista) => lista.map((x, j) => (j === i ? { ...x, preco: e.target.value } : x)))} />
              <input className={campo} value={s.duracao} placeholder="30 min" onChange={(e) => setServicos((lista) => lista.map((x, j) => (j === i ? { ...x, duracao: e.target.value } : x)))} />
              <textarea className={`${campo} sm:col-span-2`} rows={2} value={s.descricao} placeholder="Descrição" onChange={(e) => setServicos((lista) => lista.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))} />
              <button type="button" className="text-xs text-muted" onClick={() => setServicos((lista) => lista.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {aba === "faq" ? (
        <section className="gx-form-card mt-5 space-y-4 p-5 sm:p-6">
          <label className="block text-xs font-semibold text-muted">
            Título da seção
            <input className={campo} value={faqTitulo} onChange={(e) => setFaqTitulo(e.target.value)} />
          </label>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium"
            onClick={() => setFaqs((lista) => [...lista, { pergunta: "", resposta: "" }])}
          >
            Incluir pergunta
          </button>
          {faqs.map((f, i) => (
            <div key={`faq-${i}`} className="grid gap-2 rounded-xl border border-line p-3">
              <input className={campo} value={f.pergunta} placeholder="Pergunta" onChange={(e) => setFaqs((lista) => lista.map((x, j) => (j === i ? { ...x, pergunta: e.target.value } : x)))} />
              <textarea className={campo} rows={2} value={f.resposta} placeholder="Resposta" onChange={(e) => setFaqs((lista) => lista.map((x, j) => (j === i ? { ...x, resposta: e.target.value } : x)))} />
              <button type="button" className="text-xs text-muted" onClick={() => setFaqs((lista) => lista.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {aba === "contato" ? (
        <section className="gx-form-card mt-5 space-y-4 p-5 sm:p-6">
          <h2 className="text-base font-semibold">Como o cliente encontra</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted">
              WhatsApp
              <input className={campo} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              E-mail
              <input className={campo} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted sm:col-span-2">
              Rua
              <input className={campo} value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              Número
              <input className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              Bairro
              <input className={campo} value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              Cidade
              <input className={campo} value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              UF
              <input className={campo} value={estado} maxLength={2} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
            </label>
            <label className="text-xs font-semibold text-muted">
              CEP
              <input className={campo} value={cep} onChange={(e) => setCep(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              Instagram
              <input className={campo} value={instagram} placeholder="@negocio" onChange={(e) => setInstagram(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted">
              Facebook
              <input className={campo} value={facebook} placeholder="URL ou usuário" onChange={(e) => setFacebook(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-muted sm:col-span-2">
              Como chegar / ponto de referência
              <textarea className={campo} rows={2} value={comoEncontrar} onChange={(e) => setComoEncontrar(e.target.value)} placeholder="Em frente à praça, portão azul…" />
            </label>
            <label className="text-xs font-semibold text-muted sm:col-span-2">
              Mapa (URL embed Google Maps, opcional)
              <input className={campo} value={mapaEmbed} onChange={(e) => setMapaEmbed(e.target.value)} placeholder="https://www.google.com/maps/embed?…" />
            </label>
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={salvando}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => void salvar()}
        >
          {salvando ? "Salvando…" : demo ? "Simular salvar" : "Salvar controle"}
        </button>
        {!demo ? (
          <Link href={`/visualizar/${id}`} className="text-sm font-medium text-accent underline">
            Ver site / agendar
          </Link>
        ) : (
          <Link href="/exemplos/barbearia" className="text-sm font-medium text-accent underline">
            Ver site demonstração (Agendar no iframe)
          </Link>
        )}
      </div>

      <SeletorFoto
        aberto={Boolean(slotFoto)}
        nicho={nicho}
        slot={slotFoto}
        onEscolher={(src) => {
          if (fotoProIndice != null) {
            setPros((rows) => rows.map((r, j) => (j === fotoProIndice ? { ...r, fotoSrc: src } : r)));
          }
          setFotoProIndice(null);
          setSlotFoto(null);
        }}
        onFechar={() => {
          setFotoProIndice(null);
          setSlotFoto(null);
        }}
      />
    </main>
  );
}
