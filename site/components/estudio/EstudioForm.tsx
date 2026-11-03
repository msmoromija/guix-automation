"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EstudioPreview } from "@/components/estudio/EstudioPreview";
import { SeletorFoto } from "@/components/estudio/SeletorFoto";
import type { AlvoEdicao, SlotFoto } from "@/components/preview/SiteLivePreview";
import { construirAoVivo } from "@/lib/estudio/construir-ao-vivo";
import { aplicarCampoNoSite, definirCampoCopia, mesclarCopia, type CopiaViva } from "@/lib/estudio/copia-viva";
import { PedidoIa } from "@/components/estudio/PedidoIa";
import {
  aplicarPedido,
  contextoEditavel,
  copiaDoSite,
  eventosDoSite,
  profissionaisDoSite,
  servicosDoSite,
  type PatchPedido,
  type ResultadoPedido,
} from "@/lib/estudio/aplicar-pedido";
import { AVISO_ESTRUTURA, AVISO_LIMITE, LIMITE_PEDIDOS_IA, soEstrutura } from "@/lib/estudio/pedido-fechado";
import { linkWhatsapp } from "@/lib/contato";
import { MarcaStudio } from "@/components/estudio/MarcaStudio";
import { LockupMarca } from "@/components/preview/LockupMarca";
import { LIMITE_IA_LOGO, propostasBiblioteca, uriMarcaViva, type SpecLogo } from "@/lib/estudio/logo-spec";
import { IconeRede } from "@/components/estudio/IconeRede";
import { GradeExpediente } from "@/components/estudio/GradeExpediente";
import { SecaoColapsavel } from "@/components/estudio/SecaoColapsavel";
import { CANAIS, extrasDeRedes, type CanalId } from "@/lib/estudio/canais";
import {
  agendaProParaVisual,
  expedientePadrao,
  expedienteParaSchema,
  expedienteProPadrao,
  normalizarDiaExpediente,
  resumoDoExpediente,
  type AusenciaPro,
  type DiaExpediente,
} from "@/lib/estudio/expediente";
import { dicasDoNicho, fotoModelo, formatarCep, servicosDoNicho, soDigitosCep } from "@/lib/estudio/sugeridos";
import {
  PRESETS,
  paletaPorId,
  visualPadrao,
  type VisualConfig,
} from "@/lib/estudio/visual";
import { tomDoEstilo } from "@/lib/media/catalogo";
import { nichos } from "@/lib/nichos";

const campo =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-accent/25";
const chip = "rounded-xl border px-3 py-2.5 text-left text-sm leading-snug transition";
const chipOn = "border-ink bg-ink text-white";
const chipOff = "border-line bg-white text-ink hover:border-ink/30";

const ETAPAS = [
  { id: 1, titulo: "Negócio", resumo: "Nome, frase e o tom da escrita." },
  { id: 2, titulo: "Aparência", resumo: "Cores, fonte, fotos e o formato dos botões." },
  { id: 3, titulo: "Marca", resumo: "Logo, tamanho e posição no topo." },
  { id: 4, titulo: "Contato", resumo: "WhatsApp, agenda da semana, recessos, redes, serviços e equipe." },
  { id: 5, titulo: "Gerar", resumo: "Gera o link de teste, válido por 3 dias." },
];

const LIMITE_FAQ_FORM = 10;

type ProForm = {
  nome: string;
  cargo: string;
  descricao: string;
  fotoSrc: string;
  whatsapp: string;
  expediente: DiaExpediente[];
  ausencias: AusenciaPro[];
};

function proVazio(): ProForm {
  return {
    nome: "",
    cargo: "",
    descricao: "",
    fotoSrc: "",
    whatsapp: "",
    expediente: expedienteProPadrao(),
    ausencias: [],
  };
}

type FaqLivre = { titulo: string; itens: { pergunta: string; resposta: string }[] };

function faqsDoSite(site: { faq?: { titulo?: string; itens?: { pergunta?: string; resposta?: string }[] } } | null): FaqLivre {
  const faq = site?.faq;
  return {
    titulo: String(faq?.titulo || "Dúvidas"),
    itens: (faq?.itens || [])
      .slice(0, LIMITE_FAQ_FORM)
      .map((item) => ({ pergunta: String(item.pergunta || ""), resposta: String(item.resposta || "") }))
      .filter((item) => item.pergunta && item.resposta),
  };
}

async function arquivoParaDataUrl(file: File, max = 640) {
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    const texto = await file.text();
    if (/script|foreignObject|javascript:/i.test(texto)) throw new Error("svg");
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(texto)}`;
  }
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
  const [nicho, setNicho] = useState(nichoInicial);
  const [nome, setNome] = useState("");
  const [slogan, setSlogan] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [redes, setRedes] = useState<Record<string, string>>({});
  const [canaisAtivos, setCanaisAtivos] = useState<CanalId[]>([]);
  const [visual, setVisual] = useState<VisualConfig>(() => visualPadrao(nichoInicial));
  const [logoModo, setLogoModo] = useState<"gerar" | "enviar" | "texto">("gerar");
  const [propostasLogo, setPropostasLogo] = useState<SpecLogo[]>(() => propostasBiblioteca(nichoInicial));
  const [specLogo, setSpecLogo] = useState<SpecLogo | null>(() => propostasBiblioteca(nichoInicial)[0] || null);
  const [studioAberto, setStudioAberto] = useState(false);
  const [logoUpload, setLogoUpload] = useState("");
  const [logoIa, setLogoIa] = useState("");
  const [usosIa, setUsosIa] = useState(0);
  const marcos = useRef<Array<{
    visual: VisualConfig;
    whatsapp: string;
    email: string;
    horario: string;
    enderecoLivre: string;
    eventos: Array<{ titulo: string; descricao: string; dataLabel: string; horario: string; imagemSrc?: string }>;
    slogan: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    servicos: Array<{ nome: string; preco: string; duracao: string; descricao: string; imagemSrc: string }>;
    pros: ProForm[];
    expediente: DiaExpediente[];
    copia: CopiaViva | null;
    menuLivre: { id: string; label: string; href: string }[] | null;
    botaoLivre: string;
    rodapeLivre: { texto?: string; links?: { id: string; label: string; href: string }[] } | null;
    difsLivre: { titulo: string; descricao: string }[] | null;
    logoIa: string;
    logoModo: "gerar" | "enviar" | "texto";
    logoUpload: string;
    fotoHero: string;
    fotoSobre: string;
    fotoGaleria: string[];
    avulsos: Record<string, string>;
    faqs: FaqLivre | null;
  }>>([]);
  const [passosDesfazer, setPassosDesfazer] = useState(0);
  const [gerandoIa, setGerandoIa] = useState(false);
  const [servicos, setServicos] = useState(() => servicosDoNicho(nichoInicial));
  const [pros, setPros] = useState<ProForm[]>([]);
  const [proAberto, setProAberto] = useState(0);
  const [fotoProIndice, setFotoProIndice] = useState<number | null>(null);
  const [fotoEventoIndice, setFotoEventoIndice] = useState<number | null>(null);
  /** Acordeão da etapa Contato (um bloco aberto por vez — menos scroll no mobile). */
  const [blocoAberto, setBlocoAberto] = useState("contato");
  const [srvAberto, setSrvAberto] = useState(0);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepOk, setCepOk] = useState("");
  const [tom, setTom] = useState(() => tomDoEstilo(visualPadrao(nichoInicial).estilo));
  const [destaque, setDestaque] = useState("");
  const [iaEscreve, setIaEscreve] = useState(true);
  const [copia, setCopia] = useState<CopiaViva | null>(null);
  const [pedidoIa, setPedidoIa] = useState("");
  const [menuLivre, setMenuLivre] = useState<{ id: string; label: string; href: string }[] | null>(null);
  const [botaoLivre, setBotaoLivre] = useState("");
  const [rodapeLivre, setRodapeLivre] = useState<{ texto?: string; links?: { id: string; label: string; href: string }[] } | null>(null);
  const [difsLivre, setDifsLivre] = useState<{ titulo: string; descricao: string }[] | null>(null);
  const [horario, setHorario] = useState(() => resumoDoExpediente(expedientePadrao()));
  const [expediente, setExpediente] = useState<DiaExpediente[]>(() => expedientePadrao());
  const [enderecoLivre, setEnderecoLivre] = useState("");
  const [eventos, setEventos] = useState<
    Array<{ titulo: string; descricao: string; dataLabel: string; horario: string; imagemSrc?: string }>
  >([]);
  const [avulsos, setAvulsos] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FaqLivre | null>(null);
  const [avisoIa, setAvisoIa] = useState("");
  const [escrevendo, setEscrevendo] = useState(false);
  const [ajustando, setAjustando] = useState(false);
  const manuais = useRef(new Set<string>());
  const porPedido = useRef(new Set<string>());
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);
  const [fotoHero, setFotoHero] = useState("");
  const [fotoSobre, setFotoSobre] = useState("");
  const [fotoGaleria, setFotoGaleria] = useState<string[]>([]);
  const [slotFoto, setSlotFoto] = useState<SlotFoto | null>(null);
  const fotosTocadas = useRef({ hero: false, sobre: false, galeria: false });
  const [modelo, setModelo] = useState<Record<string, unknown> | null>(null);
  const formColRef = useRef<HTMLDivElement>(null);

  const nichoAtual = useMemo(() => nichos.find((n) => n.slug === nicho) || nichos[0], [nicho]);
  const dicas = dicasDoNicho(nicho);
  const paleta = paletaPorId(visual.paletaId);
  const nomeMarca = nome.trim() || nichoAtual.negocio;
  const logoSrc = logoIa
    ? logoIa
    : logoModo === "enviar"
      ? logoUpload
      : logoModo === "texto" || !specLogo
        ? ""
        : specLogo.arquivo
          ? specLogo.arquivo
          : uriMarcaViva(specLogo, { nome: nomeMarca, slogan, acento: paleta.color_accent });

  const siteVivo = useMemo(() => {
    if (!modelo) return null;
    const site = construirAoVivo(modelo, {
      nicho,
      nome,
      slogan,
      cidade,
      estado,
      logradouro,
      numero,
      bairro,
      cep,
      whatsapp,
      email,
      redes,
      visual,
      logoSrc: logoIa || etapa >= 3 ? logoSrc : undefined,
      servicos,
      profissionais: pros,
      etapa,
      fotos: {
        hero: fotoHero || undefined,
        sobre: fotoSobre || undefined,
        galeria: fotoGaleria.length ? fotoGaleria : undefined,
      },
      copia,
      horario,
      expediente: expedienteParaSchema(expediente, visual.duracaoSlotMinutos || 30),
      enderecoCompleto: enderecoLivre,
      eventos,
      faqs: faqs || undefined,
      menu: menuLivre || undefined,
      botaoAgendar: botaoLivre || undefined,
      rodapeTexto: rodapeLivre?.texto,
      rodapeLinks: rodapeLivre?.links,
      diferenciais: difsLivre || undefined,
    });
    let vivo = site as Record<string, unknown>;
    for (const [campo, valor] of Object.entries(avulsos)) vivo = aplicarCampoNoSite(vivo, campo, valor);
    return vivo;
  }, [
    modelo,
    nicho,
    nome,
    slogan,
    cidade,
    estado,
    logradouro,
    numero,
    bairro,
    cep,
    whatsapp,
    email,
    redes,
    visual,
    logoSrc,
    logoIa,
    servicos,
    pros,
    etapa,
    fotoHero,
    fotoSobre,
    fotoGaleria,
    copia,
    horario,
    expediente,
    enderecoLivre,
    eventos,
    faqs,
    menuLivre,
    botaoLivre,
    rodapeLivre,
    difsLivre,
    avulsos,
  ]);

  const faqsForm = faqs ?? faqsDoSite(siteVivo as { faq?: { titulo?: string; itens?: { pergunta?: string; resposta?: string }[] } } | null);
  const marcosProntos = [
    nome.trim().length >= 2,
    Boolean(slogan.trim() || destaque.trim()),
    Boolean(logoIa || logoUpload || logoModo === "texto"),
    whatsapp.replace(/\D/g, "").length >= 10,
    cidade.trim().length >= 2,
    Boolean(horario.trim() || logradouro.trim() || enderecoLivre.trim()),
    servicos.some((s) => s.nome.trim()),
  ];
  const prontos = marcosProntos.filter(Boolean).length;

  const dicaSite =
    etapa <= 1
      ? "Clique em qualquer texto para escrever. Se a palavra sair errada, o corretor aparece."
      : etapa === 2
        ? "Cores, letra e fotos. Clique na imagem, ou peça a cor e a fonte na faixa."
        : etapa === 3
          ? "A marca entra no topo. Clique nela para trocar, ou peça a posição."
          : etapa === 4
            ? "Telefone, endereço, horário, dúvidas, serviços e equipe. Em branco, não entra como dado seu."
            : "Os textos já estão no quadro. Gere o link quando quiser guardar por 3 dias.";
  const focoPreview: AlvoEdicao[] =
    etapa <= 1 ? ["negocio"] : etapa === 2 ? ["aparencia", "negocio"] : etapa === 3 ? ["marca"] : etapa === 4 ? ["contato", "servicos", "equipe"] : [];
  const reveladoPreview: AlvoEdicao[] =
    etapa <= 1 ? [] : etapa === 2 || etapa === 3 ? ["negocio"] : etapa === 4 ? ["negocio", "marca"] : ["negocio", "marca", "contato", "servicos", "equipe"];

  useEffect(() => {
    let cancelado = false;
    void fetch(`/api/prototipo/modelo?nicho=${encodeURIComponent(nicho)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelado || !d.site) return;
        const site = d.site as Record<string, unknown>;
        setModelo(site);
        fotosTocadas.current = { hero: false, sobre: false, galeria: false };
        setFotoHero(String(((site.hero as Record<string, unknown> | undefined)?.imagem as Record<string, unknown> | undefined)?.src || ""));
        setFotoSobre(String(((site.sobre as Record<string, unknown> | undefined)?.imagem as Record<string, unknown> | undefined)?.src || ""));
        const gItens = ((site.galeria as Record<string, unknown> | undefined)?.itens as Array<Record<string, unknown>>) || [];
        setFotoGaleria(gItens.map((g) => String(((g.imagem as Record<string, unknown> | undefined)?.src || ""))).filter(Boolean));
        const itens = ((site.servicos as Record<string, unknown> | undefined)?.itens as Array<Record<string, unknown>>) || [];
        const doModelo = itens.length
          ? itens.map((i) => ({
              nome: String(i.nome || ""),
              preco: "Sob consulta",
              duracao: String(i.duracao_label || "30 min"),
              descricao: "",
              imagemSrc: String((i.imagem as Record<string, unknown> | undefined)?.src || ""),
            }))
          : servicosDoNicho(nicho);
        const extra = servicosDoNicho(nicho);
        const lista = [...doModelo];
        for (const s of extra) {
          if (lista.length >= 3) break;
          lista.push(s);
        }
        setServicos(lista);
      })
      .catch(() => {
        if (!cancelado) setModelo(null);
      });
    return () => {
      cancelado = true;
    };
  }, [nicho]);

  const assinaturaTexto = JSON.stringify({
    nicho,
    nome: nome.trim(),
    slogan: slogan.trim(),
    cidade: cidade.trim(),
    bairro: bairro.trim(),
    tom,
    destaque,
    estilo: visual.estilo,
    servicos: servicos.map((s) => s.nome),
    iaEscreve,
  });

  useEffect(() => {
    if (!iaEscreve || nome.trim().length < 2) return;
    porPedido.current.clear();
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setEscrevendo(true);
      void fetch("/api/prototipo/textos", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "escrever",
          nicho,
          nome,
          slogan,
          cidade,
          bairro,
          tom,
          destaque,
          horario,
          servicos,
          profissionais: pros,
        }),
      })
        .then(async (r) => r.json() as Promise<{ copia?: CopiaViva; aviso?: string; erro?: string }>)
        .then((data) => {
          if (!data.copia) {
            if (data.erro) setAvisoIa(data.erro);
            return;
          }
          const travados = new Set([...manuais.current, ...porPedido.current]);
          setCopia((atual) => mesclarCopia(atual, data.copia as CopiaViva, travados));
          setServicos((rows) =>
            rows.map((r, i) => {
              if (travados.has(`srv.${i}.descricao`)) return r;
              const desc = data.copia?.servicos?.itens?.[i]?.descricao;
              return desc ? { ...r, descricao: desc } : r;
            }),
          );
          if (data.aviso) setAvisoIa(data.aviso);
        })
        .catch((e: unknown) => {
          if ((e as { name?: string })?.name === "AbortError") return;
        })
        .finally(() => setEscrevendo(false));
    }, 1100);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
    // A assinatura já resume os campos que devem reescrever a copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaTexto]);

  useEffect(() => {
    const seed = propostasBiblioteca(nicho);
    setPropostasLogo(seed);
    setSpecLogo(seed[0] || null);
  }, [nicho]);

  function aplicarFoto(slot: SlotFoto, src: string) {
    if (slot.tipo === "hero") {
      fotosTocadas.current.hero = true;
      setFotoHero(src);
      return;
    }
    if (slot.tipo === "sobre") {
      fotosTocadas.current.sobre = true;
      setFotoSobre(src);
      return;
    }
    if (slot.tipo === "galeria") {
      fotosTocadas.current.galeria = true;
      const i = slot.indice ?? 0;
      setFotoGaleria((rows) => {
        const next = [...rows];
        while (next.length <= i) next.push("");
        next[i] = src;
        return next;
      });
      return;
    }
    const i = slot.indice ?? 0;
    setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, imagemSrc: src } : r)));
  }

  function aoEditarTexto(campo: string, valor: string) {
    manuais.current.add(campo);
    if (campo === "nome") {
      setNome(valor.slice(0, 80));
      return;
    }
    const itemMenu = campo.match(/^menu\.(\d+)\.label$/);
    if (itemMenu && siteVivo) {
      const i = Number(itemMenu[1]);
      const header = ((siteVivo as { header?: { menu?: { id: string; label: string; href: string }[] } }).header || {}) as {
        menu?: { id: string; label: string; href: string }[];
      };
      const atual = (header.menu || []).map((m) => ({ ...m, label: m.label === "A casa" ? "Sobre" : m.label }));
      if (atual[i]) {
        atual[i] = { ...atual[i], label: valor.slice(0, 48) };
        setMenuLivre(atual);
      }
      return;
    }
    if (campo === "header.botao") {
      setBotaoLivre(valor.slice(0, 40));
      return;
    }
    if ((campo === "rodape.texto" || /^rodape\.\d+\.label$/.test(campo)) && siteVivo) {
      const rodape = (((siteVivo as { rodape?: { texto?: string; links?: { id: string; label: string; href: string }[] } }).rodape) || {}) as {
        texto?: string;
        links?: { id: string; label: string; href: string }[];
      };
      const base = rodapeLivre || { texto: rodape.texto, links: rodape.links };
      if (campo === "rodape.texto") {
        setRodapeLivre({ ...base, texto: valor.slice(0, 160) });
        return;
      }
      const i = Number(campo.split(".")[1]) || 0;
      const links = (base.links || []).map((l) => ({ ...l }));
      if (links[i]) links[i] = { ...links[i], label: valor.slice(0, 48) };
      setRodapeLivre({ ...base, links });
      return;
    }
    const rede = campo.match(/^rede\.([a-z]+)\.label$/);
    if (rede) {
      const id = rede[1];
      const rotulo = valor.slice(0, 32);
      setAvulsos((atual) => ({ ...atual, [campo]: rotulo }));
      setVisual((v) => ({ ...v, rotulosRede: { ...(v.rotulosRede || {}), [id]: rotulo } }));
      return;
    }
    if (/^(hero\.botao2?|galeria\.titulo|gal\.\d+\.legenda|diferenciais\.titulo|eventos\.titulo|promo\.titulo|prm\.\d+\.(titulo|descricao|validade)|cta\.(servico|contato|flutuante))$/.test(campo)) {
      setAvulsos((atual) => ({ ...atual, [campo]: valor }));
      return;
    }
    if (campo === "slogan") {
      setSlogan(valor);
      return;
    }
    if (campo === "horario") {
      setHorario(valor);
      return;
    }
    if (campo === "telefone") {
      setWhatsapp(valor);
      return;
    }
    if (campo === "endereco") {
      setEnderecoLivre(valor);
      return;
    }
    if (campo === "faq.titulo" || campo === "faq.nova" || campo === "faq.limpar" || /^faq\.\d+\.(pergunta|resposta|remover)$/.test(campo)) {
      const base = faqs ? { titulo: faqs.titulo, itens: faqs.itens.map((item) => ({ ...item })) } : faqsDoSite(siteVivo as { faq?: { titulo?: string; itens?: { pergunta?: string; resposta?: string }[] } } | null);
      if (campo === "faq.titulo") {
        setFaqs({ ...base, titulo: valor.slice(0, 80) });
        return;
      }
      if (campo === "faq.limpar") {
        setFaqs({ ...base, itens: [] });
        return;
      }
      if (campo === "faq.nova") {
        if (base.itens.length >= LIMITE_FAQ_FORM) return;
        setFaqs({ ...base, itens: [...base.itens, { pergunta: valor.slice(0, 180) || "Nova pergunta", resposta: "Escreva a resposta." }] });
        return;
      }
      const parte = campo.match(/^faq\.(\d+)\.(pergunta|resposta|remover)$/);
      if (!parte) return;
      const i = Number(parte[1]);
      if (parte[2] === "remover") {
        setFaqs({ ...base, itens: base.itens.filter((_, j) => j !== i) });
        return;
      }
      if (!base.itens[i]) return;
      const chave = parte[2] as "pergunta" | "resposta";
      base.itens[i] = { ...base.itens[i], [chave]: valor };
      setFaqs(base);
      return;
    }
    const dif = campo.match(/^dif\.(\d+)\.(titulo|descricao)$/);
    if (dif && siteVivo) {
      const i = Number(dif[1]);
      const chave = dif[2] as "titulo" | "descricao";
      const atuais = (((siteVivo.diferenciais as { itens?: { titulo?: string; descricao?: string }[] }) || {}).itens || []).map((d) => ({
        titulo: String(d.titulo || ""),
        descricao: String(d.descricao || ""),
      }));
      if (atuais[i]) atuais[i] = { ...atuais[i], [chave]: valor };
      if (atuais.filter((d) => d.titulo).length >= 3) setDifsLivre(atuais);
      return;
    }
    if (campo === "evento.novo") {
      const titulo = valor.trim() || "Novo evento";
      setEventos((lista) =>
        lista.length >= 4
          ? lista
          : [...lista, { titulo, descricao: valor.trim() ? `Venha participar: ${titulo}.` : "", dataLabel: "", horario: "19:00", imagemSrc: "" }],
      );
      return;
    }
    const ev = campo.match(/^evt\.(\d+)\.(titulo|descricao|data|horario)$/);
    if (ev) {
      const i = Number(ev[1]);
      const chave = ev[2] === "data" ? "dataLabel" : ev[2] === "horario" ? "horario" : ev[2] === "descricao" ? "descricao" : "titulo";
      setEventos((lista) => {
        const next = [...lista];
        while (next.length <= i) next.push({ titulo: "Evento", descricao: "", dataLabel: "", horario: "19:00", imagemSrc: "" });
        next[i] = { ...next[i], [chave]: valor };
        return next;
      });
      return;
    }
    const srv = campo.match(/^srv\.(\d+)\.(nome|preco|duracao|descricao)$/);
    if (srv) {
      const i = Number(srv[1]);
      const chave = srv[2] === "preco" ? "preco" : srv[2] === "duracao" ? "duracao" : srv[2];
      setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, [chave]: valor } : r)));
      return;
    }
    const pessoa = campo.match(/^pro\.(\d+)\.(nome|cargo|descricao)$/);
    if (pessoa) {
      const i = Number(pessoa[1]);
      const chave = pessoa[2] as "nome" | "cargo" | "descricao";
      setPros((rows) => {
        const next = [...rows];
        while (next.length <= i) next.push(proVazio());
        next[i] = { ...next[i], [chave]: valor };
        return next;
      });
      return;
    }
    setCopia((atual) => definirCampoCopia(atual, campo, valor));
  }

  function capturarMarco() {
    return {
      visual,
      whatsapp,
      email,
      horario,
      enderecoLivre,
      eventos,
      slogan,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      servicos,
      pros,
      expediente,
      copia,
      menuLivre,
      botaoLivre,
      rodapeLivre,
      difsLivre,
      logoIa,
      logoModo,
      logoUpload,
      fotoHero,
      fotoSobre,
      fotoGaleria,
      avulsos,
      faqs,
    };
  }

  function restaurarMarco(m: (typeof marcos.current)[number]) {
    setVisual(m.visual);
    setWhatsapp(m.whatsapp);
    setEmail(m.email);
    setHorario(m.horario);
    setEnderecoLivre(m.enderecoLivre);
    setEventos(m.eventos);
    setSlogan(m.slogan);
    setLogradouro(m.logradouro);
    setNumero(m.numero);
    setBairro(m.bairro);
    setCidade(m.cidade);
    setEstado(m.estado);
    setCep(m.cep);
    setServicos(m.servicos);
    setPros(
      m.pros.map((p) => ({
        ...p,
        expediente: (p.expediente || expedienteProPadrao()).map((d) => normalizarDiaExpediente(d)),
      })),
    );
    setExpediente((m.expediente || expedientePadrao()).map((d) => normalizarDiaExpediente(d)));
    setCopia(m.copia);
    setMenuLivre(m.menuLivre);
    setBotaoLivre(m.botaoLivre);
    setRodapeLivre(m.rodapeLivre);
    setDifsLivre(m.difsLivre);
    setLogoIa(m.logoIa);
    setLogoModo(m.logoModo);
    setLogoUpload(m.logoUpload);
    setFotoHero(m.fotoHero);
    setFotoSobre(m.fotoSobre);
    setFotoGaleria(m.fotoGaleria);
    setAvulsos(m.avulsos);
    setFaqs(m.faqs);
    fotosTocadas.current = { hero: Boolean(m.fotoHero), sobre: Boolean(m.fotoSobre), galeria: m.fotoGaleria.length > 0 };
  }

  function guardarMarco() {
    marcos.current = [...marcos.current, capturarMarco()].slice(-3);
    setPassosDesfazer(marcos.current.length);
  }

  function desfazerMarco() {
    const ultimo = marcos.current[marcos.current.length - 1];
    if (!ultimo) return;
    marcos.current = marcos.current.slice(0, -1);
    setPassosDesfazer(marcos.current.length);
    restaurarMarco(ultimo);
    setAvisoIa("Alteração desfeita.");
  }

  function aplicarResultado(resultado: ResultadoPedido) {
    const empresa = (resultado.site.empresa || {}) as {
      telefone_label?: string;
      email?: string;
      slogan?: string;
      horario_resumo?: string;
      endereco?: { logradouro?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; cep?: string };
    };
    if (resultado.tocou.contato) {
      if (empresa.telefone_label) setWhatsapp(empresa.telefone_label);
      if (empresa.email && !empresa.email.endsWith("@guix.invalid")) setEmail(empresa.email);
      if (empresa.slogan) {
        setSlogan(empresa.slogan);
        manuais.current.add("slogan");
      }
      if (empresa.horario_resumo) setHorario(empresa.horario_resumo);
      const end = empresa.endereco;
      if (end?.logradouro) setLogradouro(end.logradouro);
      if (end?.numero) setNumero(end.numero);
      if (end?.bairro) setBairro(end.bairro);
      if (end?.cidade) setCidade(end.cidade);
      if (end?.estado && end.estado !== "NA") setEstado(end.estado);
      if (end?.cep) setCep(end.cep);
    }
    if (resultado.tocou.textos || resultado.tocou.servicos) {
      const nova = copiaDoSite(resultado.site);
      setCopia((atual) => ({ ...(atual || {}), ...nova }));
      ["hero.titulo", "hero.subtitulo", "sobre.titulo", "sobre.p.0", "sobre.p.1", "contato.titulo", "slogan"].forEach((c) => manuais.current.add(c));
      (nova.faq?.itens || []).forEach((_, i) => {
        manuais.current.add(`faq.${i}.pergunta`);
        manuais.current.add(`faq.${i}.resposta`);
      });
    }
    if (resultado.tocou.faq) {
      setFaqs(faqsDoSite(resultado.site as { faq?: { titulo?: string; itens?: { pergunta?: string; resposta?: string }[] } }));
    }
    if (resultado.tocou.eventos) {
      const lista = eventosDoSite(resultado.site).filter((e) => e.titulo && e.descricao);
      setEventos(lista);
    }
    if (resultado.tocou.avisos && resultado.avisos?.length) {
      setEventos((lista) => {
        const avisos = resultado.avisos!.map((a) => ({
          titulo: a.titulo,
          descricao: a.descricao,
          dataLabel: a.dataLabel,
          horario: "09:00",
        }));
        return [...avisos, ...lista].slice(0, 4);
      });
    }
    if (resultado.tocou.redes && resultado.redes) {
      setRedes((atual) => ({ ...atual, ...resultado.redes }));
      const ids = Object.keys(resultado.redes).filter((id): id is CanalId => CANAIS.some((c) => c.id === id));
      if (ids.length) setCanaisAtivos((lista) => Array.from(new Set([...lista, ...ids])));
    }
    if (resultado.tocou.profissionais) {
      const equipe = profissionaisDoSite(resultado.site);
      if (equipe.length) {
        setPros(
          equipe.map((p) => ({
            ...proVazio(),
            nome: p.nome,
            cargo: p.cargo,
            descricao: p.descricao,
            whatsapp: p.whatsapp,
            email: p.email,
          })),
        );
      }
    }
    if (resultado.tocou.servicos) {
      const linhas = servicosDoSite(resultado.site).filter((s) => s.nome);
      if (linhas.length) {
        setServicos(linhas.map((s) => ({ nome: s.nome, preco: s.preco || "", duracao: s.duracao || "", descricao: s.descricao || "", imagemSrc: s.imagemSrc || "" })));
        linhas.forEach((_, i) => manuais.current.add(`srv.${i}.descricao`));
      }
    }
    if (resultado.tocou.visual) setVisual(resultado.visual);
    if (resultado.tocou.menu) {
      const header = (resultado.site.header || {}) as { menu?: { id: string; label: string; href: string }[]; botao_agendar?: string };
      if (header.menu?.length) setMenuLivre(header.menu);
      if (header.botao_agendar) setBotaoLivre(header.botao_agendar);
    }
    if (resultado.tocou.rodape) {
      const rodape = (resultado.site.rodape || {}) as { texto?: string; links?: { id: string; label: string; href: string }[] };
      setRodapeLivre({ texto: rodape.texto, links: rodape.links });
    }
    if (resultado.tocou.diferenciais) {
      const bloco = (resultado.site.diferenciais || {}) as { itens?: { titulo?: string; descricao?: string }[] };
      const itens = (bloco.itens || []).map((d) => ({ titulo: String(d.titulo || ""), descricao: String(d.descricao || "") })).filter((d) => d.titulo);
      if (itens.length >= 3) setDifsLivre(itens);
    }
    const equipe = ((resultado.site.profissionais || {}) as { itens?: { nome?: string }[] }).itens || [];
    if (equipe.length && equipe.every((p) => p.nome === "Sem preferência")) {
      setPros([proVazio()]);
    }
    if (resultado.tocou.midia && siteVivo) {
      const logoAgora = String((((resultado.site.empresa || {}) as { logo?: { src?: string } }).logo || {}).src || "");
      const logoAntes = String((((siteVivo.empresa || {}) as { logo?: { src?: string } }).logo || {}).src || "");
      if (logoAgora && logoAgora !== logoAntes) {
        setLogoIa(logoAgora);
        setLogoModo("enviar");
        setLogoUpload(logoAgora);
      }
      const srcDe = (bloco?: { imagem?: { src?: string } }) => String(bloco?.imagem?.src || "");
      const heroAgora = srcDe(resultado.site.hero as { imagem?: { src?: string } });
      const heroAntes = srcDe(siteVivo.hero as { imagem?: { src?: string } });
      if (heroAgora && heroAgora !== heroAntes) {
        fotosTocadas.current.hero = true;
        setFotoHero(heroAgora);
      }
      const sobreAgora = srcDe(resultado.site.sobre as { imagem?: { src?: string } });
      const sobreAntes = srcDe(siteVivo.sobre as { imagem?: { src?: string } });
      if (sobreAgora && sobreAgora !== sobreAntes) {
        fotosTocadas.current.sobre = true;
        setFotoSobre(sobreAgora);
      }
    }
    if (resultado.abrir === "logo" && !resultado.tocou.midia) setStudioAberto(true);
    if (resultado.abrir === "hero" || resultado.abrir === "sobre" || resultado.abrir === "galeria") setSlotFoto({ tipo: resultado.abrir });
    setAvisoIa([resultado.resumo, resultado.aviso].filter(Boolean).join(" "));
  }

  async function pedirTexto() {
    const pedido = pedidoIa.trim();
    if (!siteVivo) {
      setAvisoIa("O quadro ainda está carregando.");
      return;
    }
    if (usosIa >= LIMITE_PEDIDOS_IA) {
      setAvisoIa(AVISO_LIMITE);
      return;
    }
    if (pedido.length < 3) {
      setAvisoIa("Escreva o que quer mudar.");
      return;
    }
    if (soEstrutura(pedido)) {
      setAvisoIa(AVISO_ESTRUTURA);
      return;
    }
    setAjustando(true);
    setAvisoIa("OpenAI conectada · aplicando no motor…");
    const ctrl = new AbortController();
    const prazo = window.setTimeout(() => ctrl.abort(), 90000);
    try {
      const res = await fetch("/api/prototipo/textos", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "executar",
          pedido,
          nicho,
          nome,
          cidade,
          bairro,
          contexto: contextoEditavel(siteVivo, visual),
        }),
      });
      const data = (await res.json()) as {
        patch?: PatchPedido;
        aviso?: string;
        erro?: string;
        resumo?: string;
        via?: "openai" | "atalho" | "nenhum";
      };
      if (!data.patch) {
        setAvisoIa(data.aviso || data.erro || "OpenAI não devolveu alteração. Tente de novo.");
        return;
      }
      guardarMarco();
      const resultado = aplicarPedido(structuredClone(siteVivo), visual, data.patch);
      aplicarResultado(resultado);
      setUsosIa((n) => n + 1);
      setPedidoIa("");
      const selo = data.via === "openai" ? "via OpenAI" : data.via === "atalho" ? "via atalho local" : "";
      setAvisoIa([selo, resultado.resumo || data.resumo, resultado.aviso || data.aviso].filter(Boolean).join(" · "));
    } catch {
      setAvisoIa("OpenAI demorou demais. Peça de novo em uma frase objetiva.");
    } finally {
      window.clearTimeout(prazo);
      setAjustando(false);
    }
  }

  useEffect(() => {
    const abrir = () => {
      const h = window.location.hash.replace("#", "");
      if (h !== "contato" && h !== "estudio-contato") return;
      setEtapa(4);
      setErro("");
      window.setTimeout(() => {
        const el = document.getElementById("estudio-contato");
        scrollFormAoTopo(el);
      }, 80);
    };
    abrir();
    window.addEventListener("hashchange", abrir);
    return () => window.removeEventListener("hashchange", abrir);
  }, []);

  useEffect(() => {
    // Nova etapa sempre começa no topo da coluna (evita “abrir de baixo”).
    window.setTimeout(() => scrollFormAoTopo(null), 0);
    if (etapa === 4) setBlocoAberto("contato");
  }, [etapa]);

  function scrollFormAoTopo(el?: HTMLElement | null) {
    const col = formColRef.current;
    if (!col) return;
    if (!el) {
      col.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // scrollIntoView em coluna overflow empurra o painel para baixo — scroll só no container.
    const top = col.scrollTop + (el.getBoundingClientRect().top - col.getBoundingClientRect().top) - 8;
    col.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function toggleBloco(id: string) {
    setBlocoAberto((atual) => {
      const prox = atual === id ? "" : id;
      if (prox) {
        window.setTimeout(() => {
          const el = document.getElementById(`bloco-${prox}`);
          if (el) scrollFormAoTopo(el);
        }, 40);
      }
      return prox;
    });
  }

  function ir(n: number, alvo?: AlvoEdicao) {
    const destino = Math.min(5, Math.max(1, n));
    setEtapa(destino);
    setErro("");
    if (destino !== 3) setAviso("");
    if (destino === 4) {
      const mapa: Record<string, string> = {
        contato: "contato",
        servicos: "servicos",
        equipe: "equipe",
      };
      setBlocoAberto(mapa[alvo || ""] || "contato");
    }
    window.setTimeout(() => {
      const id =
        alvo === "contato"
          ? "bloco-contato"
          : alvo === "servicos"
            ? "bloco-servicos"
            : alvo === "equipe"
              ? "bloco-equipe"
              : destino === 4
                ? "bloco-contato"
                : "";
      const el = id ? document.getElementById(id) : null;
      if (el) scrollFormAoTopo(el);
      else scrollFormAoTopo(null);
    }, 50);
  }

  function aoAncora(id: string) {
    if (id === "contato") ir(4, "contato");
    else if (id === "servicos" || id === "faq") ir(4, id === "faq" ? "contato" : "servicos");
    else if (id === "profissionais") ir(4, "equipe");
    else if (id === "inicio" || id === "sobre") ir(1, "negocio");
  }

  function irEditar(alvo: AlvoEdicao) {
    const etapaAlvo = alvo === "negocio" ? 1 : alvo === "aparencia" ? 2 : alvo === "marca" ? 3 : 4;
    setPreviewAberta(false);
    ir(etapaAlvo, alvo);
  }

  async function buscarCep(raw?: string) {
    const d = soDigitosCep(raw ?? cep);
    if (d.length !== 8) {
      setErro("O CEP precisa ter 8 números.");
      return;
    }
    setErro("");
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (!res.ok || data.erro) {
        setErro("CEP não encontrado. Confira os números.");
        setCepOk("");
        return;
      }
      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado((data.uf || "").toUpperCase().slice(0, 2));
      setCepOk(`${data.logradouro || "Rua"} · ${data.bairro || ""} · ${data.localidade}/${data.uf}`);
    } catch {
      setErro("Não deu para consultar o CEP agora.");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function gerarLoteMarca() {
    setErro("");
    setAviso("");
    setGerandoIa(true);
    setLogoModo("gerar");
    try {
      const res = await fetch("/api/prototipo/marca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeMarca, nicho, evitar: propostasLogo }),
      });
      const data = (await res.json()) as { propostas?: SpecLogo[]; erro?: string };
      if (!res.ok) {
        setErro(data.erro || "Não deu para montar as marcas agora. Use a biblioteca.");
        return;
      }
      const novas = (data.propostas || []).slice(0, 5);
      setPropostasLogo((atuais) => {
        const ia = atuais.filter((p) => p.origem === "ia");
        const resto = atuais.filter((p) => p.origem !== "ia");
        const juntas = [...ia, ...novas].slice(0, LIMITE_IA_LOGO);
        return [...juntas, ...resto];
      });
      if (novas[0]) setSpecLogo(novas[0]);
    } catch {
      setErro("Falha ao montar as marcas.");
    } finally {
      setGerandoIa(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (etapa < 5) {
      ir(etapa + 1);
      return;
    }
    if (nome.trim().length < 2) {
      setEtapa(1);
      setErro("Escreva o nome do negócio para gerar o link.");
      return;
    }
    const digitosWa = whatsapp.replace(/\D/g, "");
    const waOk = digitosWa.length === 10 || digitosWa.length === 11 || (digitosWa.startsWith("55") && digitosWa.length >= 12 && digitosWa.length <= 13);
    if (!waOk) {
      setEtapa(4);
      setErro("Informe o WhatsApp com DDD. Sem ele, os botões do site não chamam o seu número.");
      return;
    }
    if (cidade.trim().length < 2 || !/^[A-Za-z]{2}$/.test(estado.trim())) {
      setEtapa(4);
      setErro("Informe a cidade e a UF. O site usa isso para dizer onde você atende.");
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
          horario,
          expediente: expedienteParaSchema(expediente, visual.duracaoSlotMinutos || 30),
          enderecoLivre,
          faqs,
          eventos,
          menu: menuLivre || undefined,
          botaoAgendar: botaoLivre || undefined,
          rodapeTexto: rodapeLivre?.texto,
          rodapeLinks: rodapeLivre?.links,
          diferenciais: difsLivre || undefined,
          avulsos: Object.keys(avulsos).length ? avulsos : undefined,
          redes,
          visual,
          tom,
          destaque,
          iaEscreve,
          copia,
          pedidosIa: usosIa,
          logoSrc: logoModo === "texto" && !logoIa ? undefined : logoSrc,
          servicos: servicos.filter((s) => s.nome.trim()),
          profissionais: pros.filter((p) => p.nome.trim() && p.nome.trim() !== "Novo nome"),
          fotos: {
            ...(fotosTocadas.current.hero && fotoHero ? { hero: fotoHero } : {}),
            ...(fotosTocadas.current.sobre && fotoSobre ? { sobre: fotoSobre } : {}),
            ...(fotosTocadas.current.galeria && fotoGaleria.length ? { galeria: fotoGaleria } : {}),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível gerar o protótipo.");
        return;
      }
      const t = String(data.token || "");
      router.push(data.contaUrl || `/conta/${t}?t=${encodeURIComponent(t)}&novo=1`);
    } catch {
      setErro("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  const pedidoPainel = (
    <PedidoIa
      texto={pedidoIa}
      onTexto={setPedidoIa}
      onEnviar={() => void pedirTexto()}
      aviso={avisoIa}
      ocupado={ajustando}
      onDesfazer={desfazerMarco}
      passosDesfazer={passosDesfazer}
      usos={usosIa}
      onAnexarFoto={() => setSlotFoto({ tipo: "hero" })}
      onAnexarLogo={() => setStudioAberto(true)}
      linkSuporte={linkWhatsapp("Olá, quero uma tela nova ou uma função que o site de teste não faz.")}
    />
  );

  useEffect(() => {
    setHorario(resumoDoExpediente(expediente));
  }, [expediente]);

  useEffect(() => {
    setVisual((v) => ({
      ...v,
      duracaoSlotMinutos: v.duracaoSlotMinutos || 30,
      /** Na criação, cada profissional herda o horário da casa; grade fina fica no admin. */
      agendaEquipe: pros
        .filter((p) => p.nome.trim())
        .map((p) => agendaProParaVisual(p.nome, expediente, [])),
    }));
  }, [pros, expediente]);

  const visualPreview = {
    ...visual,
    linkedinUrl: redes.linkedin || visual.linkedinUrl,
    linkedin: Boolean(redes.linkedin) || visual.linkedin,
    redesExtra: extrasDeRedes(redes),
  };

  return (
    <main className="lg:h-[calc(100dvh-4.25rem)] lg:overflow-hidden">
      <div className="lg:grid lg:h-full lg:grid-cols-[minmax(300px,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(320px,28rem)_minmax(0,1fr)]">
        <div ref={formColRef} className="flex h-full flex-col overflow-y-auto px-5 py-6 lg:border-r lg:border-line">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">MONTAR MEU SITE</p>
      <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
        O site já está à direita. Você só personaliza.
      </h1>
      <p className="mt-2 text-sm text-muted">
        Começa no modelo do ofício. Cada passo troca uma parte. No fim, um <strong>link de teste por 3 dias</strong>.
      </p>

      <nav aria-label="Etapas" className="mt-6 rounded-2xl border border-line bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Passo {etapa} de {ETAPAS.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{ETAPAS.find((e) => e.id === etapa)?.titulo}</p>
          </div>
          <p className="text-[11px] text-muted">
            {prontos}/{marcosProntos.length} prontos
          </p>
        </div>
        <ol className="relative mt-4 flex items-center justify-between">
          <span className="pointer-events-none absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-line" aria-hidden />
          <span
            className="pointer-events-none absolute left-4 top-1/2 h-px -translate-y-1/2 bg-ink transition-all"
            style={{ width: `calc(${((etapa - 1) / (ETAPAS.length - 1)) * 100}% - 0.5rem)` }}
            aria-hidden
          />
          {ETAPAS.map((et) => {
            const ativa = etapa === et.id;
            const feita = etapa > et.id;
            return (
              <li key={et.id} className="relative z-[1]">
                <button
                  type="button"
                  onClick={() => ir(et.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                    ativa ? "bg-ink text-white ring-4 ring-ink/10" : feita ? "bg-ink text-white" : "border border-line bg-white text-muted"
                  }`}
                  aria-current={ativa ? "step" : undefined}
                  aria-label={`${et.id}. ${et.titulo}`}
                  title={et.titulo}
                >
                  {feita && !ativa ? "✓" : et.id}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-muted">{ETAPAS.find((e) => e.id === etapa)?.resumo}</p>
      </nav>

      <form onSubmit={enviar} className="mt-6">
        <div className="space-y-5">
          {etapa === 1 ? (
            <section id="estudio-negocio" className="gx-step gx-form-card p-5 sm:p-6">
              <h2 className="text-base font-semibold">Identidade do negócio</h2>
              <p className="mt-1 text-sm text-muted">
                O que você digitar aqui aparece na hora no site à direita: nome no topo, frase e tom dos textos.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="block text-sm font-medium">
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
                <label className="block text-sm font-medium">
                  Nome no site
                  <input required className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={dicas.nome} />
                  <span className="mt-1 block text-xs text-muted">Entra no cabeçalho e no rodapé assim que você digita.</span>
                </label>
                <label className="block text-sm font-medium">
                  Frase debaixo do nome
                  <input className={campo} value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder={dicas.slogan} />
                </label>
                <label className="block text-sm font-medium">
                  O que destacar nos textos
                  <input className={campo} value={destaque} onChange={(e) => setDestaque(e.target.value)} placeholder={`Ex.: ${dicas.destaque}`} />
                </label>
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold">Tom da escrita</p>
                <p className="mt-1 text-xs text-muted">A IA reescreve a capa e o sobre neste tom (leva cerca de 1 segundo após o nome).</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["tradicional, acolhedor, de ofício", "Acolhedor"],
                      ["direto, jovem, com energia", "Urbano"],
                      ["sofisticado, sóbrio, premium", "Luxo"],
                      ["profissional, claro, comercial", "Direto"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" className={`${chip} ${tom === id ? chipOn : chipOff}`} onClick={() => setTom(id)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">IA escreve os textos</span>
                  <span className="text-xs text-muted">Desligue se quiser digitar tudo à mão no quadro.</span>
                </span>
                <input type="checkbox" className="h-5 w-5" checked={iaEscreve} onChange={(e) => setIaEscreve(e.target.checked)} />
              </label>
              <div className="mt-4 rounded-xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
                <p className="font-semibold text-ink">No site à direita agora</p>
                <p className="mt-1">
                  {nome.trim() ? <span className="text-ink">{nome.trim()}</span> : "Nome ainda no modelo"}
                  {slogan.trim() ? <> · frase “{slogan.trim()}”</> : null}
                  {tom ? <> · tom {tom.split(",")[0]}</> : null}
                </p>
                {escrevendo ? <p className="mt-2 font-medium text-accent">Reescrevendo capa e sobre…</p> : null}
              </div>
            </section>
          ) : null}

          {etapa === 2 ? (
            <section id="estudio-aparencia" className="gx-step gx-form-card p-5 sm:p-6">
              <h2 className="text-base font-semibold">Escolha um visual</h2>
              <p className="mt-1 text-sm text-muted">
                Cada cartão já junta cores e letras. O site à direita muda na hora.
              </p>
              <div className="mt-4 grid gap-3">
                {PRESETS.map((p) => {
                  const pal = paletaPorId(p.visual.paletaId || visual.paletaId);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`overflow-hidden rounded-2xl border text-left transition ${visual.presetId === p.id ? "border-ink ring-2 ring-ink" : "border-line hover:border-ink/30"}`}
                      onClick={() => {
                        setVisual((v) => ({ ...v, ...p.visual, presetId: p.id }));
                        setTom(tomDoEstilo(p.visual.estilo));
                      }}
                    >
                      <MiniSite paleta={pal} nome={nomeMarca} />
                      <span className="block px-3 py-2">
                        <span className="block text-sm font-medium">{p.nome}</span>
                        <span className="text-xs text-muted">{p.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-sm font-semibold">Fotos do tema</h3>
                <p className="mt-1 text-sm text-muted">
                  Envie as suas ou pegue da biblioteca. Também funciona clicando na foto à direita.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Capa", src: fotoHero, slot: { tipo: "hero" } as SlotFoto },
                    { label: "Sobre", src: fotoSobre, slot: { tipo: "sobre" } as SlotFoto },
                    { label: "Galeria 1", src: fotoGaleria[0], slot: { tipo: "galeria", indice: 0 } as SlotFoto },
                    { label: "Galeria 2", src: fotoGaleria[1], slot: { tipo: "galeria", indice: 1 } as SlotFoto },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="overflow-hidden rounded-xl border border-line text-left"
                      onClick={() => setSlotFoto(item.slot)}
                    >
                      {item.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.src} alt="" className="aspect-[16/10] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center bg-canvas text-xs text-muted">Sem foto</div>
                      )}
                      <span className="block px-2 py-1.5 text-xs font-medium">{item.label} · trocar</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {etapa === 3 ? (
            <section id="estudio-marca" className="gx-step gx-form-card p-5 sm:p-6">
              <h2 className="text-base font-semibold">Como a marca aparece no topo</h2>
              <p className="mt-1 text-sm text-muted">Escolha o resultado. A prévia à direita já mostra o cabeçalho.</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => setLogoModo("gerar")}
                  className={`rounded-2xl border p-4 text-left ${logoModo === "gerar" ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <p className="text-sm font-semibold">Escolher uma marca do ofício</p>
                  <p className="mt-1 text-xs text-muted">
                    Biblioteca de logomarcas deste ramo. O nome do negócio entra ao lado. Sem fundo, vale no claro e no escuro.
                  </p>
                  <div className="mt-3 flex h-16 items-center overflow-hidden rounded-lg px-2" style={{ background: paleta.color_background, color: paleta.color_text }}>
                    {specLogo ? (
                      <LockupMarca
                        spec={specLogo}
                        nome={nomeMarca}
                        slogan={slogan}
                        tinta={paleta.color_text}
                        acento={paleta.color_accent}
                        className="h-14 w-full"
                      />
                    ) : null}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoModo("enviar")}
                  className={`rounded-2xl border p-4 text-left ${logoModo === "enviar" ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <p className="text-sm font-semibold">Já tenho a identidade</p>
                  <p className="mt-1 text-xs text-muted">Envie PNG ou SVG. Se a marca for exigente, este é o caminho certo.</p>
                  <div className="mt-3 flex h-16 items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">
                    {logoUpload ? "Arquivo carregado" : "Solte o arquivo depois de escolher esta opção"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoModo("texto")}
                  className={`rounded-2xl border p-4 text-left ${logoModo === "texto" ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <p className="text-sm font-semibold">Só o nome em letra</p>
                  <p className="mt-1 text-xs text-muted">Resultado: sem imagem. O topo usa o nome, como um jornal.</p>
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
                    disabled={gerandoIa}
                    onClick={() => {
                      setStudioAberto(true);
                    }}
                    className="mt-4 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                  >
                    {gerandoIa ? "Abrindo marcas…" : "Ver logomarcas do ofício"}
                  </button>
                  <div className="mt-3 grid gap-2">
                    {propostasLogo.filter((p) => p.origem === "biblioteca").slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSpecLogo(p)}
                        className={`overflow-hidden rounded-xl border p-2 text-left ${specLogo?.id === p.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                      >
                        <div className="flex h-12 items-center rounded-lg px-2" style={{ background: paleta.color_background, color: paleta.color_text }}>
                          <LockupMarca
                            spec={p}
                            nome={nomeMarca}
                            slogan={slogan}
                            tinta={paleta.color_text}
                            acento={paleta.color_accent}
                            className="h-10 w-full"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="mt-2 text-sm font-medium text-accent underline" onClick={() => setStudioAberto(true)}>
                    Ver a biblioteca de marcas
                  </button>
                </>
              ) : null}
            </section>
          ) : null}

          {etapa === 4 ? (
            <>
              <p className="rounded-xl bg-canvas px-3 py-2 text-xs text-muted sm:hidden">
                Toque em cada bloco para abrir. Só um fica aberto — assim você não se perde no celular.
              </p>
              <section id="estudio-contato" className="gx-step space-y-3">
                <SecaoColapsavel
                  id="bloco-contato"
                  titulo="Como o cliente te encontra"
                  resumo={[whatsapp.trim() && "WhatsApp ok", email.trim() && "E-mail ok", visual.agendamento && "Agenda ligada"]
                    .filter(Boolean)
                    .join(" · ") || "WhatsApp, e-mail e agendamento"}
                  aberto={blocoAberto === "contato"}
                  onToggle={() => toggleBloco("contato")}
                >
                  <p className="text-sm text-muted">Cada campo entra no bloco Contato do site, com o ícone padrão.</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-line p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E]">
                          <IconeRede id="whatsapp" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">WhatsApp do negócio</p>
                          <p className="text-xs text-muted">Botão flutuante e confirmação do agendamento.</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted">
                          Flutuante
                          <input type="checkbox" checked={visual.whatsappFlutuante} onChange={(e) => setVisual((v) => ({ ...v, whatsappFlutuante: e.target.checked }))} />
                        </label>
                      </div>
                      <input className={`${campo} mt-3`} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="79 99999-0000" inputMode="tel" autoComplete="tel" />
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                      <span>
                        <span className="block text-sm font-semibold">Agendar no site</span>
                        <span className="text-xs text-muted">Serviço → profissional → dia → hora.</span>
                      </span>
                      <input type="checkbox" className="h-5 w-5" checked={visual.agendamento} onChange={(e) => setVisual((v) => ({ ...v, agendamento: e.target.checked }))} />
                    </label>

                    <label className="block text-sm font-medium">
                      E-mail
                      <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@seunegocio.com.br" />
                    </label>
                  </div>
                </SecaoColapsavel>

                <SecaoColapsavel
                  id="bloco-horario"
                  titulo="Horário de trabalho"
                  resumo={horario || "Defina dias e expediente"}
                  aberto={blocoAberto === "horario"}
                  onToggle={() => toggleBloco("horario")}
                >
                  <p className="text-sm leading-relaxed text-muted">
                    Escolha os dias, o expediente e, se quiser, a pausa de almoço.
                  </p>
                  <div className="mt-4">
                    <GradeExpediente atalhos value={expediente} onChange={setExpediente} />
                  </div>
                  <div className="gx-horario-resumo mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Resumo no site</p>
                    <p className="mt-1 text-sm font-medium text-ink">{horario || "Horário a combinar"}</p>
                    <label className="mt-3 block text-xs font-medium text-muted">
                      Editar texto (opcional)
                      <input
                        className={campo}
                        value={horario}
                        onChange={(e) => setHorario(e.target.value.slice(0, 160))}
                        placeholder="Segunda a sexta, 9h às 18h (almoço 12h–13h)"
                      />
                    </label>
                  </div>
                </SecaoColapsavel>

                <SecaoColapsavel
                  id="bloco-redes"
                  titulo="Redes sociais"
                  resumo={canaisAtivos.length ? `${canaisAtivos.length} rede(s)` : "Opcional"}
                  aberto={blocoAberto === "redes"}
                  onToggle={() => toggleBloco("redes")}
                >
                  <p className="text-xs text-muted">Ícones oficiais no contato e no rodapé.</p>
                  <div className="mt-3 space-y-2">
                    {canaisAtivos.map((id) => {
                      const canal = CANAIS.find((c) => c.id === id);
                      if (!canal) return null;
                      return (
                        <div key={id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-ink">
                            <IconeRede id={id} />
                          </span>
                          <input
                            className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                            value={redes[id] || ""}
                            onChange={(e) => {
                              const valor = e.target.value;
                              setRedes((r) => ({ ...r, [id]: valor }));
                              if (id === "instagram" || id === "facebook" || id === "tiktok" || id === "youtube" || id === "linkedin") {
                                setVisual((v) => ({ ...v, [id]: true }));
                              }
                            }}
                            placeholder={canal.placeholder}
                          />
                          <button
                            type="button"
                            className="text-xs text-muted"
                            onClick={() => {
                              setCanaisAtivos((lista) => lista.filter((x) => x !== id));
                              setRedes((r) => {
                                const n = { ...r };
                                delete n[id];
                                return n;
                              });
                              if (id === "instagram" || id === "facebook" || id === "tiktok" || id === "youtube" || id === "linkedin") {
                                setVisual((v) => ({ ...v, [id]: false }));
                              }
                            }}
                          >
                            Remover
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                    Adicionar rede
                    <select
                      className={campo}
                      value=""
                      onChange={(e) => {
                        const id = e.target.value as CanalId;
                        if (!id) return;
                        setCanaisAtivos((lista) => (lista.includes(id) ? lista : [...lista, id]));
                        if (id === "instagram" || id === "facebook" || id === "tiktok" || id === "youtube" || id === "linkedin") {
                          setVisual((v) => ({ ...v, [id]: true }));
                        }
                      }}
                    >
                      <option value="">Instagram, TikTok, X, LinkedIn…</option>
                      {CANAIS.filter((c) => !canaisAtivos.includes(c.id)).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </SecaoColapsavel>

                <SecaoColapsavel
                  id="bloco-endereco"
                  titulo="Endereço pelo CEP"
                  resumo={[logradouro, cidade, estado].filter(Boolean).join(", ") || "Digite o CEP"}
                  aberto={blocoAberto === "endereco"}
                  onToggle={() => toggleBloco("endereco")}
                  destaque
                >
                  <p className="text-sm text-muted">Rua, bairro, cidade e UF entram sozinhos. Só falta o número.</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="block min-w-0 flex-1 text-sm font-medium">
                      CEP
                      <input
                        className={`${campo} text-lg tracking-[0.18em]`}
                        value={cep}
                        inputMode="numeric"
                        placeholder="49000-000"
                        onChange={(e) => {
                          const fmt = formatarCep(e.target.value);
                          setCep(fmt);
                          setCepOk("");
                          if (soDigitosCep(fmt).length === 8) void buscarCep(fmt);
                        }}
                      />
                    </label>
                    <label className="block w-full text-sm font-medium sm:w-20">
                      UF
                      <input
                        className={`${campo} uppercase tracking-[0.12em]`}
                        value={estado}
                        maxLength={2}
                        placeholder="UF"
                        onChange={(e) => setEstado(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void buscarCep()}
                      disabled={buscandoCep}
                      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {buscandoCep ? "Buscando…" : "Buscar endereço"}
                    </button>
                  </div>
                  {cepOk ? <p className="mt-3 text-sm font-medium text-ink">{cepOk}</p> : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-6">
                    <label className="block text-sm sm:col-span-4">
                      Rua
                      <input className={campo} value={logradouro} onChange={(e) => { setEnderecoLivre(""); setLogradouro(e.target.value); }} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Número
                      <input className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="120" />
                    </label>
                    <label className="block text-sm sm:col-span-3">
                      Bairro
                      <input className={campo} value={bairro} onChange={(e) => setBairro(e.target.value)} />
                    </label>
                    <label className="block text-sm sm:col-span-3">
                      Cidade
                      <input className={campo} value={cidade} onChange={(e) => setCidade(e.target.value)} />
                    </label>
                  </div>
                </SecaoColapsavel>

                <SecaoColapsavel
                  id="bloco-eventos"
                  titulo="Eventos da casa"
                  resumo={eventos.length ? `${eventos.length} evento(s)` : "Opcional"}
                  aberto={blocoAberto === "eventos"}
                  onToggle={() => toggleBloco("eventos")}
                >
                  <div className="gx-evt">
                    <p className="gx-evt__intro">Noites especiais, workshops, lançamentos. Pode colocar foto da biblioteca, da busca ou do seu arquivo.</p>
                    <button
                      type="button"
                      className="gx-evt__add"
                      onClick={() =>
                        setEventos((lista) =>
                          lista.length >= 4
                            ? lista
                            : [...lista, { titulo: "", descricao: "", dataLabel: "", horario: "19:00", imagemSrc: "" }],
                        )
                      }
                    >
                      Incluir evento
                    </button>

                    {eventos.length === 0 ? (
                      <p className="gx-evt__vazio">Nenhum evento. Opcional — aparece na agenda do site.</p>
                    ) : (
                      <ul className="gx-evt__lista">
                        {eventos.map((ev, i) => (
                          <li key={`ev-${i}`} className="gx-evt__card">
                            <div className="gx-evt__topo">
                              <span className="gx-evt__indice">{i + 1}</span>
                              <strong className="gx-evt__nome">{ev.titulo.trim() || `Evento ${i + 1}`}</strong>
                              <button
                                type="button"
                                className="gx-evt__remover"
                                onClick={() => setEventos((lista) => lista.filter((_, j) => j !== i))}
                              >
                                Remover
                              </button>
                            </div>

                            <div className="gx-evt__corpo">
                              <div className="gx-evt__foto-col">
                                <label className="gx-evt__foto">
                                  {ev.imagemSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={ev.imagemSrc} alt="" />
                                  ) : (
                                    <span>
                                      <em>+</em>
                                      Foto
                                    </span>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      void arquivoParaDataUrl(f, 900).then((src) =>
                                        setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, imagemSrc: src } : item))),
                                      );
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="gx-evt__busca"
                                  onClick={() => {
                                    setFotoEventoIndice(i);
                                    setFotoProIndice(null);
                                    setSlotFoto({ tipo: "galeria", indice: 0 });
                                  }}
                                >
                                  Biblioteca / busca
                                </button>
                              </div>

                              <div className="gx-evt__campos">
                                <label className="gx-evt__label gx-evt__label--full">
                                  Nome
                                  <input
                                    className="gx-equipe__input"
                                    value={ev.titulo}
                                    placeholder="Nome do evento"
                                    onChange={(e) =>
                                      setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, titulo: e.target.value } : item)))
                                    }
                                  />
                                </label>
                                <label className="gx-evt__label">
                                  Dia
                                  <input
                                    className="gx-equipe__input"
                                    value={ev.dataLabel}
                                    placeholder="Sábado, 12 de dezembro"
                                    onChange={(e) =>
                                      setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, dataLabel: e.target.value } : item)))
                                    }
                                  />
                                </label>
                                <label className="gx-evt__label">
                                  Horário
                                  <input
                                    className="gx-equipe__input"
                                    value={ev.horario}
                                    placeholder="19:00"
                                    onChange={(e) =>
                                      setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, horario: e.target.value } : item)))
                                    }
                                  />
                                </label>
                                <label className="gx-evt__label gx-evt__label--full">
                                  O que acontece
                                  <textarea
                                    className="gx-evt__area"
                                    rows={3}
                                    value={ev.descricao}
                                    placeholder="Conte o que acontece"
                                    onChange={(e) =>
                                      setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, descricao: e.target.value } : item)))
                                    }
                                  />
                                </label>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </SecaoColapsavel>
              </section>

              <SecaoColapsavel
                id="bloco-faq"
                titulo="Dúvidas frequentes"
                resumo={faqsForm.itens.length ? `${faqsForm.itens.length} pergunta(s)` : "Opcional · até 10"}
                aberto={blocoAberto === "faq"}
                onToggle={() => toggleBloco("faq")}
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="text-sm text-muted">Até 10 perguntas. Reescreva, inclua ou apague.</p>
                  <div className="flex gap-2">
                    {faqsForm.itens.length > 0 ? (
                      <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => setFaqs({ ...faqsForm, itens: [] })}>
                        Remover todas
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full border border-line px-3 py-1.5 text-xs"
                      onClick={() => {
                        if (faqsForm.itens.length >= LIMITE_FAQ_FORM) return;
                        setFaqs({ ...faqsForm, itens: [...faqsForm.itens, { pergunta: "Nova pergunta", resposta: "Escreva a resposta." }] });
                      }}
                    >
                      Incluir pergunta
                    </button>
                  </div>
                </div>
                <label className="mt-4 block text-sm font-medium">
                  Título da seção
                  <input className={campo} value={faqsForm.titulo} onChange={(e) => setFaqs({ ...faqsForm, titulo: e.target.value.slice(0, 80) })} />
                </label>
                <div className="mt-3 space-y-3">
                  {faqsForm.itens.map((item, i) => (
                    <div key={`faq-form-${i}`} className="grid gap-2 rounded-xl border border-line p-3">
                      <input
                        className={campo}
                        value={item.pergunta}
                        onChange={(e) =>
                          setFaqs({
                            ...faqsForm,
                            itens: faqsForm.itens.map((atual, j) => (j === i ? { ...atual, pergunta: e.target.value.slice(0, 180) } : atual)),
                          })
                        }
                        placeholder="Pergunta"
                      />
                      <textarea
                        className={campo}
                        rows={3}
                        value={item.resposta}
                        onChange={(e) =>
                          setFaqs({
                            ...faqsForm,
                            itens: faqsForm.itens.map((atual, j) => (j === i ? { ...atual, resposta: e.target.value.slice(0, 400) } : atual)),
                          })
                        }
                        placeholder="Resposta"
                      />
                      <button type="button" className="text-xs text-muted" onClick={() => setFaqs({ ...faqsForm, itens: faqsForm.itens.filter((_, j) => j !== i) })}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </SecaoColapsavel>

              <SecaoColapsavel
                id="bloco-servicos"
                titulo="Serviços no site"
                resumo={`${servicos.length} serviço(s)`}
                aberto={blocoAberto === "servicos"}
                onToggle={() => toggleBloco("servicos")}
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="text-sm text-muted">Edite, troque a foto e veja no preview. Toque no serviço para expandir.</p>
                  <button
                    type="button"
                    className="rounded-full bg-ink px-4 py-2 text-sm text-white"
                    onClick={() => {
                      setServicos((s) => [
                        ...s,
                        {
                          nome: "Novo serviço",
                          preco: "Sob consulta",
                          duracao: "30 min",
                          descricao: "",
                          imagemSrc: fotoModelo(nicho, s.length),
                        },
                      ]);
                      setSrvAberto(servicos.length);
                    }}
                  >
                    Criar serviço
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {servicos.map((s, i) => {
                    const aberto = srvAberto === i;
                    return (
                      <article key={`srv-${i}`} className={`gx-acordeao-item ${aberto ? "is-open" : ""}`}>
                        <button
                          type="button"
                          className="gx-acordeao-item__cabeca"
                          aria-expanded={aberto}
                          onClick={() => setSrvAberto((atual) => (atual === i ? -1 : i))}
                        >
                          <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink">
                            {s.nome.trim() || `Serviço ${i + 1}`}
                          </span>
                          <span className="shrink-0 text-xs text-muted">
                            {[s.preco, s.duracao].filter(Boolean).join(" · ")}
                          </span>
                          <span className="gx-acordeao__chev" aria-hidden>
                            {aberto ? "▴" : "▾"}
                          </span>
                        </button>
                        {aberto ? (
                          <div className="space-y-3 px-3 pb-3">
                            <button
                              type="button"
                              className="block w-full overflow-hidden rounded-xl bg-canvas text-left"
                              onClick={() => setSlotFoto({ tipo: "servico", indice: i })}
                            >
                              {s.imagemSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.imagemSrc} alt="" className="aspect-[16/10] w-full object-cover" />
                              ) : (
                                <div className="flex aspect-[16/10] items-center justify-center text-xs text-muted">Sem foto</div>
                              )}
                              <span className="block bg-canvas px-2 py-1.5 text-xs font-medium">Trocar foto</span>
                            </button>
                            <label className="block text-xs font-medium text-muted">
                              Nome
                              <input
                                className={campo}
                                value={s.nome}
                                onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))}
                              />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block text-xs font-medium text-muted">
                                Preço
                                <input
                                  className={`${campo} font-semibold text-accent`}
                                  value={s.preco}
                                  onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, preco: e.target.value } : r)))}
                                />
                              </label>
                              <label className="block text-xs font-medium text-muted">
                                Duração
                                <input
                                  className={campo}
                                  value={s.duracao}
                                  onChange={(e) => setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, duracao: e.target.value } : r)))}
                                />
                              </label>
                            </div>
                            <label className="block text-xs font-medium text-muted">
                              Texto
                              <textarea
                                rows={3}
                                className={`${campo} min-h-[4.5rem] resize-y`}
                                value={s.descricao}
                                onChange={(e) => {
                                  manuais.current.add(`srv.${i}.descricao`);
                                  setServicos((rows) => rows.map((r, j) => (j === i ? { ...r, descricao: e.target.value } : r)));
                                }}
                              />
                            </label>
                            {servicos.length > 1 ? (
                              <button
                                type="button"
                                className="rounded-full px-3 py-1.5 text-xs text-muted"
                                onClick={() => setServicos((rows) => rows.filter((_, j) => j !== i))}
                              >
                                Remover
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </SecaoColapsavel>

              <SecaoColapsavel
                id="bloco-equipe"
                titulo="Equipe"
                resumo={pros.length ? `${pros.length} profissional(is)` : "Opcional"}
                aberto={blocoAberto === "equipe"}
                onToggle={() => toggleBloco("equipe")}
              >
                <div className="gx-equipe">
                  <p className="gx-equipe__intro">
                    Só nome, especialidade e foto. A grade quebra em linhas (não estica a página). Horários e avisos ficam no admin.
                  </p>

                  <div className="gx-equipe__visual">
                    <p className="gx-equipe__visual-titulo">Como aparece no site</p>
                    <div className="gx-equipe__opcoes" role="group" aria-label="Formato da foto">
                      {(
                        [
                          ["circulo", "Círculo"],
                          ["quadrado", "Quadrado"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          className={`gx-equipe__chip ${(visual.equipeFotoForma || "circulo") === id ? "is-on" : ""}`}
                          onClick={() => setVisual((v) => ({ ...v, equipeFotoForma: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="gx-equipe__opcoes" role="group" aria-label="Tamanho da foto">
                      {(
                        [
                          ["pequeno", "Pequena"],
                          ["medio", "Média"],
                          ["grande", "Grande"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          className={`gx-equipe__chip ${(visual.equipeFotoTamanho || "medio") === id ? "is-on" : ""}`}
                          onClick={() => setVisual((v) => ({ ...v, equipeFotoTamanho: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="gx-equipe__add"
                    onClick={() => {
                      setPros((p) => {
                        const prox = [...p, proVazio()];
                        setProAberto(prox.length - 1);
                        return prox;
                      });
                    }}
                  >
                    Incluir profissional
                  </button>

                  {pros.length === 0 ? (
                    <div className="gx-equipe__vazio">
                      <p className="text-sm font-medium text-ink">Ninguém na equipe ainda</p>
                      <p className="mt-1 text-sm text-muted">
                        Opcional. Sem profissionais, o cliente agenda com “Sem preferência”.
                      </p>
                    </div>
                  ) : (
                    <ul className="gx-equipe__lista">
                      {pros.map((p, i) => (
                        <li key={`pro-${i}`} className="gx-equipe__card">
                          <div className="gx-equipe__topo">
                            <span className="gx-equipe__indice">{i + 1}</span>
                            <div className="gx-equipe__titulo">
                              <strong>{p.nome.trim() || `Profissional ${i + 1}`}</strong>
                              <span>{p.cargo.trim() || "Sem especialidade"}</span>
                            </div>
                            <button
                              type="button"
                              className="gx-equipe__remover"
                              onClick={() => {
                                setPros((rows) => {
                                  const prox = rows.filter((_, j) => j !== i);
                                  setProAberto(Math.max(0, Math.min(proAberto, prox.length - 1)));
                                  return prox;
                                });
                              }}
                            >
                              Remover
                            </button>
                          </div>

                          <div className="gx-equipe__corpo">
                            <div className="gx-equipe__foto-col">
                              <label className="gx-equipe__foto">
                                {p.fotoSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.fotoSrc} alt="" />
                                ) : (
                                  <span>
                                    <em>+</em>
                                    Foto
                                  </span>
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
                              <button
                                type="button"
                                className="gx-equipe__busca"
                                onClick={() => {
                                  setFotoProIndice(i);
                                  setSlotFoto({ tipo: "sobre" });
                                }}
                              >
                                Biblioteca / busca
                              </button>
                            </div>

                            <div className="gx-equipe__campos">
                              <label className="gx-equipe__label">
                                Nome
                                <input
                                  className="gx-equipe__input"
                                  value={p.nome}
                                  placeholder="Quem atende"
                                  onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))}
                                />
                              </label>
                              <label className="gx-equipe__label">
                                Especialidade
                                <input
                                  className="gx-equipe__input"
                                  value={p.cargo}
                                  placeholder={dicas.cargo}
                                  onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, cargo: e.target.value } : r)))}
                                />
                              </label>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </SecaoColapsavel>
            </>
          ) : null}

          {etapa === 5 ? (
            <section className="gx-step gx-form-card p-5 sm:p-6">
              <h2 className="text-base font-semibold">Você vai receber um link válido por 3 dias</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6">
                <li>
                  <strong>1.</strong> A IA escreve os textos no tom escolhido e escolhe fotos do ofício.
                </li>
                <li>
                  <strong>2.</strong> Abre o site de teste neste navegador — dá para mandar o link no WhatsApp.
                </li>
                <li>
                  <strong>3.</strong> Em 3 dias o teste some sozinho. Não é o site publicado.
                </li>
                <li>
                  <strong>4.</strong> Se gostar, contrata. Aí o site entra no seu domínio de verdade.
                </li>
              </ol>
              <div className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
                {nome || "Seu negócio"} · {nichoAtual.nome}
                {cidade ? ` · ${cidade}` : ""} · {whatsapp.trim() ? whatsapp.trim() : "WhatsApp ainda não informado"} · {logoModo === "texto" ? "nome escrito" : logoModo === "enviar" ? "logo enviado" : "marca do estúdio"}
              </div>
              {!whatsapp.trim() ? (
                <button type="button" className="mt-3 text-sm font-medium text-accent underline" onClick={() => ir(4)}>
                  Informar o WhatsApp antes de gerar
                </button>
              ) : null}
            </section>
          ) : null}

          {aviso ? <p className="text-sm text-muted">{aviso}</p> : null}
        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

          <div className="flex flex-wrap items-center gap-3 pb-28 lg:pb-8">
            {etapa > 1 ? (
              <button type="button" className="rounded-full border border-line px-5 py-3 text-sm" onClick={() => ir(etapa - 1)}>
                Voltar
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading || (etapa === 5 && nome.trim().length < 2)}
              className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {loading
                ? "Montando o site de teste…"
                : etapa === 5
                  ? "Ver meu site de teste — link por 3 dias"
                  : "Continuar"}
            </button>
            {etapa === 5 ? <p className="text-xs text-muted">Sem cartão. Sem publicar ainda.</p> : null}
          </div>
        </div>
      </form>
        </div>
        <div className="hidden h-full min-h-0 lg:block">
          <EstudioPreview site={siteVivo} visual={visualPreview} dica={dicaSite} variante="painel" onEditar={irEditar} onTrocarFoto={setSlotFoto} onTrocarLogo={() => setStudioAberto(true)} onTexto={aoEditarTexto} onAncora={aoAncora} pedido={pedidoPainel} foco={focoPreview} revelado={reveladoPreview} />
        </div>
      </div>

      <EstudioPreview
        site={siteVivo}
        visual={visualPreview}
        aberto={previewAberta}
        onToggle={() => setPreviewAberta(false)}
        dica={dicaSite}
        variante="folha"
        onEditar={irEditar}
        onTrocarFoto={setSlotFoto}
        onTrocarLogo={() => setStudioAberto(true)}
        onTexto={aoEditarTexto}
        onAncora={aoAncora}
        pedido={pedidoPainel}
        foco={focoPreview}
        revelado={reveladoPreview}
      />
      <SeletorFoto
        aberto={Boolean(slotFoto)}
        nicho={nicho}
        slot={slotFoto}
        onEscolher={(src) => {
          if (fotoEventoIndice != null) {
            setEventos((lista) => lista.map((item, j) => (j === fotoEventoIndice ? { ...item, imagemSrc: src } : item)));
            setFotoEventoIndice(null);
            setSlotFoto(null);
            return;
          }
          if (fotoProIndice != null) {
            setPros((rows) => rows.map((r, j) => (j === fotoProIndice ? { ...r, fotoSrc: src } : r)));
            setFotoProIndice(null);
            setSlotFoto(null);
            return;
          }
          if (slotFoto) aplicarFoto(slotFoto, src);
        }}
        onFechar={() => {
          setFotoEventoIndice(null);
          setFotoProIndice(null);
          setSlotFoto(null);
        }}
      />
      <button
        type="button"
        className="fixed bottom-5 right-4 z-40 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg lg:hidden"
        onClick={() => setPreviewAberta(true)}
      >
        Ver o site
      </button>

      <MarcaStudio
        aberto={studioAberto}
        onFechar={() => setStudioAberto(false)}
        nicho={nicho}
        nome={nomeMarca}
        slogan={slogan}
        acento={paleta.color_accent}
        tintaSite={paleta.color_text}
        fundoSite={paleta.color_background}
        propostas={propostasLogo}
        selecionada={specLogo?.id || ""}
        onSelecionar={(s) => {
          setLogoModo("gerar");
          setSpecLogo(s);
        }}
        onSomar={(s) => {
          setPropostasLogo((lista) => {
            const i = lista.findIndex((x) => x.id === s.id);
            if (i >= 0) {
              const n = [...lista];
              n[i] = s;
              return n;
            }
            return [s, ...lista];
          });
        }}
        onGerarIa={() => void gerarLoteMarca()}
        gerando={gerandoIa}
      />

      {loading ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-xs font-semibold tracking-[0.16em] text-accent">GERANDO</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em]">Aguarde enquanto criamos tudo para você</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Estamos escrevendo os textos, escolhendo fotos do ofício e montando o site de teste. Isso leva cerca de um
              minuto — a tela não travou.
            </p>
            <p className="mt-5 text-sm font-medium text-ink">Montando o site de teste…</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function MiniSite({
  paleta,
  nome,
}: {
  paleta: { color_background: string; color_surface: string; color_text: string; color_accent: string };
  nome: string;
}) {
  return (
    <span
      className="block h-24 overflow-hidden px-3 py-2"
      style={{ background: paleta.color_background, color: paleta.color_text }}
    >
      <span className="flex items-center justify-between text-[9px] tracking-wide opacity-80">
        <span className="truncate font-semibold">{nome.slice(0, 18) || "MARCA"}</span>
        <span className="rounded-full px-1.5 py-0.5" style={{ background: paleta.color_accent, color: paleta.color_background }}>
          Agendar
        </span>
      </span>
      <span className="mt-3 block text-[13px] font-bold leading-tight">{nome || "Seu negócio"}</span>
      <span className="mt-2 block h-1 w-10 rounded-full" style={{ background: paleta.color_accent }} />
      <span className="mt-2 flex gap-1">
        <i className="h-6 flex-1 rounded" style={{ background: paleta.color_surface }} />
        <i className="h-6 flex-1 rounded" style={{ background: paleta.color_surface }} />
        <i className="h-6 flex-1 rounded" style={{ background: paleta.color_surface }} />
      </span>
    </span>
  );
}

function CartaoCanal({
  titulo,
  dica,
  on,
  onChange,
  semSwitch,
  manterFilhos,
  children,
}: {
  titulo: string;
  dica?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  semSwitch?: boolean;
  /** Mantém o campo utilizável mesmo com o interruptor desligado (ex.: WhatsApp). */
  manterFilhos?: boolean;
  children: React.ReactNode;
}) {
  const ativo = on || semSwitch || manterFilhos;
  return (
    <div className={`rounded-2xl border p-4 ${ativo ? "border-line bg-white" : "border-line bg-canvas/60"}`}>
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
      <div className={ativo ? "mt-1" : "mt-1 opacity-70"}>{children}</div>
    </div>
  );
}
