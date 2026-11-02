"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EstudioPreview } from "@/components/estudio/EstudioPreview";
import { SeletorFoto } from "@/components/estudio/SeletorFoto";
import type { AlvoEdicao, SlotFoto } from "@/components/preview/SiteLivePreview";
import { construirAoVivo } from "@/lib/estudio/construir-ao-vivo";
import { aplicarCampoNoSite, definirCampoCopia, mesclarCopia, type CopiaViva } from "@/lib/estudio/copia-viva";
import { PedidoIa } from "@/components/estudio/PedidoIa";
import { aplicarPedido, contextoEditavel, copiaDoSite, patchRapido, servicosDoSite, type PatchPedido, type ResultadoPedido } from "@/lib/estudio/aplicar-pedido";
import { AVISO_ESTRUTURA, AVISO_LIMITE, LIMITE_PEDIDOS_IA, soEstrutura } from "@/lib/estudio/pedido-fechado";
import { linkWhatsapp } from "@/lib/contato";
import { MarcaStudio } from "@/components/estudio/MarcaStudio";
import { LockupMarca } from "@/components/preview/LockupMarca";
import { LIMITE_IA_LOGO, propostasBiblioteca, uriMarcaViva, type SpecLogo } from "@/lib/estudio/logo-spec";
import { CANAIS, extrasDeRedes, type CanalId } from "@/lib/estudio/canais";
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
  { id: 4, titulo: "Contato e serviços", resumo: "Telefone, endereço, horário, dúvidas, serviços e equipe." },
  { id: 5, titulo: "Gerar", resumo: "Gera o link de teste, válido por 3 dias." },
];

const LIMITE_FAQ_FORM = 10;

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
  const [estado, setEstado] = useState("SE");
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
    eventos: Array<{ titulo: string; descricao: string; dataLabel: string; horario: string }>;
    slogan: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    servicos: Array<{ nome: string; preco: string; duracao: string; descricao: string; imagemSrc: string }>;
    pros: Array<{ nome: string; cargo: string; descricao: string; fotoSrc: string }>;
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
  const [pros, setPros] = useState<Array<{ nome: string; cargo: string; descricao: string; fotoSrc: string }>>([]);
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
  const [horario, setHorario] = useState("");
  const [enderecoLivre, setEnderecoLivre] = useState("");
  const [eventos, setEventos] = useState<Array<{ titulo: string; descricao: string; dataLabel: string; horario: string }>>([]);
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
      setEventos((lista) => (lista.length >= 4 ? lista : [...lista, { titulo: valor, descricao: "Conte o que acontece neste dia.", dataLabel: "", horario: "19:00" }]));
      return;
    }
    const ev = campo.match(/^evt\.(\d+)\.(titulo|descricao|data|horario)$/);
    if (ev) {
      const i = Number(ev[1]);
      const chave = ev[2] === "data" ? "dataLabel" : ev[2] === "horario" ? "horario" : ev[2] === "descricao" ? "descricao" : "titulo";
      setEventos((lista) => {
        const next = [...lista];
        while (next.length <= i) next.push({ titulo: "Evento", descricao: "", dataLabel: "", horario: "19:00" });
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
        while (next.length <= i) next.push({ nome: "", cargo: "", descricao: "", fotoSrc: "" });
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
    setPros(m.pros);
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
      setPros([{ nome: "", cargo: "", descricao: "", fotoSrc: "" }]);
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
    const rapido = patchRapido(pedido);
    if (rapido) {
      guardarMarco();
      aplicarResultado(aplicarPedido(structuredClone(siteVivo), visual, rapido));
      setUsosIa((n) => n + 1);
      setPedidoIa("");
      return;
    }
    setAjustando(true);
    setAvisoIa("");
    const ctrl = new AbortController();
    const prazo = window.setTimeout(() => ctrl.abort(), 20000);
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
      const data = (await res.json()) as { patch?: PatchPedido; aviso?: string; erro?: string };
      if (!data.patch) {
        setAvisoIa(data.aviso || data.erro || "Não consegui aplicar agora.");
        return;
      }
      guardarMarco();
      aplicarResultado(aplicarPedido(structuredClone(siteVivo), visual, data.patch));
      setUsosIa((n) => n + 1);
      setPedidoIa("");
    } catch {
      setAvisoIa("Demorou demais. Nada mudou. Tente uma frase mais curta.");
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
      window.setTimeout(() => document.getElementById("estudio-contato")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    abrir();
    window.addEventListener("hashchange", abrir);
    return () => window.removeEventListener("hashchange", abrir);
  }, []);

  function ir(n: number, alvo?: AlvoEdicao) {
    const destino = Math.min(5, Math.max(1, n));
    setEtapa(destino);
    setErro("");
    if (destino !== 3) setAviso("");
    window.setTimeout(() => {
      const id = alvo === "contato" ? "estudio-contato" : alvo ? `estudio-${alvo}` : destino === 4 ? "estudio-contato" : "";
      const el = id ? document.getElementById(id) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else formColRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
      router.push(`/visualizar/${data.token}`);
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

      <ol className="mt-5 grid grid-cols-5 gap-1">
        {ETAPAS.map((et) => (
          <li key={et.id}>
            <button
              type="button"
              onClick={() => ir(et.id)}
              className={`w-full rounded-lg border px-1.5 py-2 text-left text-[10px] leading-tight sm:px-2 sm:text-xs ${
                etapa === et.id ? chipOn : etapa > et.id ? "border-ink/20 bg-white" : chipOff
              }`}
            >
              <span className="block text-[9px] opacity-70">{et.id}</span>
              {et.titulo}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 space-y-1">
        {ETAPAS.map((et) => (
          <button key={`resumo-${et.id}`} type="button" onClick={() => ir(et.id)} className={`block w-full rounded-lg px-2 py-1 text-left text-xs ${etapa === et.id ? "bg-white font-medium text-ink" : "text-muted"}`}>
            <span className="mr-2 text-[10px] opacity-60">{et.id}</span>
            {et.resumo}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted">
          <span>Pronto para gerar</span>
          <span>{prontos} de {marcosProntos.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((prontos / marcosProntos.length) * 100)}%` }} />
        </div>
      </div>

      <form onSubmit={enviar} className="mt-6">
        <div className="space-y-5">
          {etapa === 1 ? (
            <section id="estudio-negocio" className="gx-step gx-card-in rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold">O negócio</h2>
              <p className="mt-1 text-sm text-muted">O site à direita já está pronto no modelo do ofício. Seu nome entra agora; o resto espera você.</p>
              <div className="mt-4 grid gap-4">
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
                  <input required className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={dicas.nome} />
                </label>
                <label className="block text-sm">
                  Frase debaixo do nome
                  <input
                    className={campo}
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder={dicas.slogan}
                  />
                </label>
              </div>
              <p className="mt-6 text-sm font-semibold">Como a IA vai escrever</p>
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
                O que destacar
                <input
                  className={campo}
                  value={destaque}
                  onChange={(e) => setDestaque(e.target.value)}
                  placeholder={`Ex.: ${dicas.destaque}`}
                />
              </label>
              <button
                type="button"
                className={`mt-3 ${chip} ${iaEscreve ? chipOn : chipOff}`}
                onClick={() => setIaEscreve((v) => !v)}
              >
                {iaEscreve ? "A IA escreve os textos do site" : "Não usar IA nos textos"}
              </button>
            </section>
          ) : null}

          {etapa === 2 ? (
            <section id="estudio-aparencia" className="gx-step gx-card-in rounded-2xl border border-line bg-white p-5 sm:p-6">
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
            <section id="estudio-marca" className="gx-step rounded-2xl border border-line bg-white p-5 sm:p-6">
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
              <section id="estudio-contato" className="gx-step rounded-2xl border border-line bg-white p-5 sm:p-6">
                <h2 className="text-base font-semibold">Como o cliente te acha</h2>
                <p className="mt-1 text-sm text-muted">Clique em qualquer texto do site para escrever. Se a palavra sair errada, o corretor oferece a troca.</p>
                <label className="mt-4 block text-sm font-medium">
                  Horário de funcionamento
                  <input className={campo} value={horario} onChange={(e) => setHorario(e.target.value.slice(0, 160))} placeholder="Segunda a sexta, 8h às 18h" />
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CartaoCanal
                    titulo="WhatsApp"
                    dica="Número do negócio · o interruptor liga o botão flutuante"
                    on={visual.whatsappFlutuante}
                    onChange={(whatsappFlutuante) => setVisual((v) => ({ ...v, whatsappFlutuante }))}
                    manterFilhos
                  >
                    <input className={campo} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="79 99999-0000" inputMode="tel" autoComplete="tel" />
                  </CartaoCanal>
                  <CartaoCanal titulo="Agendar" dica="Botão no topo do site" on={visual.agendamento} onChange={(agendamento) => setVisual((v) => ({ ...v, agendamento }))}>
                    <p className="mt-2 text-xs text-muted">Usa o mesmo WhatsApp neste teste.</p>
                  </CartaoCanal>
                  <CartaoCanal titulo="E-mail" on={Boolean(email)} onChange={() => undefined} semSwitch>
                    <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@negocio.com" />
                  </CartaoCanal>
                  {canaisAtivos.map((id) => {
                    const canal = CANAIS.find((c) => c.id === id);
                    if (!canal) return null;
                    return (
                      <CartaoCanal
                        key={id}
                        titulo={canal.label}
                        on
                        onChange={() => {
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
                        <input
                          className={campo}
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
                      </CartaoCanal>
                    );
                  })}
                </div>
                <label className="mt-4 block text-sm font-medium">
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
                <div className="gx-pulse-cep mt-5 rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-orange-50 to-white p-5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-accent">ENDEREÇO PELO CEP</p>
                  <p className="mt-1 text-sm text-muted">Digite o CEP: rua, bairro, cidade e UF entram sozinhos. Só falta o número.</p>
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
                    <button
                      type="button"
                      onClick={() => void buscarCep()}
                      disabled={buscandoCep}
                      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {buscandoCep ? "Buscando…" : "Buscar endereço"}
                    </button>
                  </div>
                  {cepOk ? <p className="gx-pulse-cep mt-3 text-sm font-medium text-ink">{cepOk}</p> : null}
                  <div className={`mt-4 grid gap-3 sm:grid-cols-6 ${cepOk || logradouro ? "gx-pulse-cep" : ""}`}>
                    <label className="block text-sm sm:col-span-4">
                      Rua
                      <input className={campo} value={logradouro} onChange={(e) => { setEnderecoLivre(""); setLogradouro(e.target.value); }} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Número
                      <input className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="120" />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Bairro
                      <input className={campo} value={bairro} onChange={(e) => setBairro(e.target.value)} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Cidade
                      <input className={campo} value={cidade} onChange={(e) => setCidade(e.target.value)} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      UF
                      <input className={campo} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} />
                    </label>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Eventos da casa</p>
                    <button
                      type="button"
                      className="rounded-full border border-line px-3 py-1.5 text-xs"
                      onClick={() => setEventos((lista) => (lista.length >= 4 ? lista : [...lista, { titulo: "Novo evento", descricao: "", dataLabel: "", horario: "19:00" }]))}
                    >
                      Incluir evento
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {eventos.map((ev, i) => (
                      <div key={`ev-${i}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
                        <input className={campo} value={ev.titulo} onChange={(e) => setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, titulo: e.target.value } : item)))} placeholder="Nome do evento" />
                        <input className={campo} value={ev.dataLabel} onChange={(e) => setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, dataLabel: e.target.value } : item)))} placeholder="Sábado, 12 de dezembro" />
                        <input className={campo} value={ev.horario} onChange={(e) => setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, horario: e.target.value } : item)))} placeholder="19:00" />
                        <button type="button" className="text-xs text-muted" onClick={() => setEventos((lista) => lista.filter((_, j) => j !== i))}>
                          Remover
                        </button>
                        <textarea className={`${campo} sm:col-span-2`} rows={2} value={ev.descricao} onChange={(e) => setEventos((lista) => lista.map((item, j) => (j === i ? { ...item, descricao: e.target.value } : item)))} placeholder="O que acontece" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="estudio-faq" className="gx-step rounded-2xl border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Dúvidas frequentes</h2>
                    <p className="mt-1 text-sm text-muted">Até 10 perguntas. Dá para reescrever, incluir ou apagar todas.</p>
                  </div>
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
              </section>

              <section id="estudio-servicos" className="gx-step rounded-2xl border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Serviços no site</h2>
                    <p className="mt-1 text-sm text-muted">
                      Os serviços do modelo já estão aqui. Edite, troque a foto (sua ou da biblioteca) e veja no site.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-ink px-4 py-2 text-sm text-white"
                    onClick={() =>
                      setServicos((s) => [
                        ...s,
                        {
                          nome: "Novo serviço",
                          preco: "Sob consulta",
                          duracao: "30 min",
                          descricao: "",
                          imagemSrc: fotoModelo(nicho, s.length),
                        },
                      ])
                    }
                  >
                    Criar serviço
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {servicos.map((s, i) => (
                    <article key={`srv-${i}`} className="gx-card-in space-y-3 rounded-2xl border border-line p-3">
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
                          rows={4}
                          className={`${campo} min-h-[5.5rem] resize-y`}
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
                    </article>
                  ))}
                </div>
              </section>

              <section id="estudio-equipe" className="gx-step rounded-2xl border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Quem atende</h2>
                    <p className="mt-1 text-sm text-muted">
                      Opcional. Em branco, o site agenda sem destinar profissional. Não inventamos nomes.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-line px-4 py-2 text-sm"
                    onClick={() => setPros((p) => [...p, { nome: "", cargo: "", descricao: "", fotoSrc: "" }])}
                  >
                    + Pessoa
                  </button>
                </div>
                {pros.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
                    Ninguém cadastrado. O cliente marca o horário, sem destinar profissional.
                  </p>
                ) : (
                <div className="mt-4 grid gap-4">
                  {pros.map((p, i) => (
                    <article key={`pro-${i}`} className="gx-card-in flex gap-4 rounded-2xl border border-line p-4">
                      <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-canvas text-2xl font-semibold text-ink/50">
                        {p.fotoSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.fotoSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (p.nome || "+").slice(0, 1)
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
                        <label className="block text-xs font-medium text-muted">
                          Nome
                          <input
                            className={campo}
                            value={p.nome}
                            placeholder="Quem atende"
                            onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, nome: e.target.value } : r)))}
                          />
                        </label>
                        <label className="mt-2 block text-xs font-medium text-muted">
                          Função
                          <input
                            className={campo}
                            value={p.cargo}
                            placeholder={dicas.cargo}
                            onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, cargo: e.target.value } : r)))}
                          />
                        </label>
                        <label className="mt-2 block text-xs font-medium text-muted">
                          Uma linha
                          <input
                            className={campo}
                            value={p.descricao}
                            placeholder="Opcional"
                            onChange={(e) => setPros((rows) => rows.map((r, j) => (j === i ? { ...r, descricao: e.target.value } : r)))}
                          />
                        </label>
                        <button type="button" className="mt-2 text-xs text-muted underline" onClick={() => setPros((rows) => rows.filter((_, j) => j !== i))}>
                          Remover
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                )}
              </section>
            </>
          ) : null}

          {etapa === 5 ? (
            <section className="gx-step gx-card-in rounded-2xl border border-line bg-white p-5 sm:p-6">
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
          if (slotFoto) aplicarFoto(slotFoto, src);
        }}
        onFechar={() => setSlotFoto(null)}
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
