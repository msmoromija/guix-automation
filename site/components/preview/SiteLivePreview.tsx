"use client";

import { AgendarBloco } from "@/components/preview/AgendarBloco";
import { IconeRede } from "@/components/estudio/IconeRede";
import { LogoMarca } from "@/components/preview/LogoMarca";
import { TextoEditavel } from "@/components/preview/TextoEditavel";
import { tintaClara, uriMarcaViva } from "@/lib/estudio/logo-spec";
import { marca } from "@/lib/marca";
import { googleFontsHref, visualPadrao, type VisualConfig } from "@/lib/estudio/visual";
import { enquadrarFoto } from "@/lib/media/tratar-url";

type Img = { src?: string; alt?: string; origem?: string; credito?: { texto?: string; perfil_url?: string; fotografo?: string } };
type ItemServico = {
  id?: string;
  nome?: string;
  descricao?: string;
  preco_label?: string;
  duracao_label?: string;
  imagem?: Img;
};
type ItemPro = { id?: string; nome?: string; cargo?: string; descricao?: string; whatsapp?: string; foto?: Img };
type ItemFaq = { id?: string; pergunta?: string; resposta?: string };

type Site = {
  meta?: { nicho?: string };
  empresa?: {
    nome?: string;
    slogan?: string;
    whatsapp?: string;
    whatsapp_label?: string;
    telefone_label?: string;
    whatsapp_mensagem?: string;
    email?: string;
    horario_resumo?: string;
    expediente?: { dia: string; label?: string; intervalos: string[] }[];
    endereco?: { completo?: string };
    logo?: Img;
    redes?: { id?: string; url?: string; label?: string }[];
  };
  tema?: {
    color_primary?: string;
    color_secondary?: string;
    color_accent?: string;
    color_background?: string;
    color_surface?: string;
    color_heading?: string;
    color_text?: string;
    color_text_muted?: string;
    font_heading?: string;
    font_body?: string;
    radius?: string;
  };
  header?: { botao_agendar?: string; menu?: { id: string; label: string; href: string }[] };
  hero?: {
    titulo?: string;
    subtitulo?: string;
    botao_principal?: string;
    botao_secundario?: string;
    imagem?: Img;
  };
  sobre?: { titulo?: string; paragrafos?: string[]; imagem?: Img };
  servicos?: { titulo?: string; subtitulo?: string; itens?: ItemServico[] };
  profissionais?: { titulo?: string; subtitulo?: string; itens?: ItemPro[] };
  faq?: { titulo?: string; itens?: ItemFaq[] };
  contato?: { titulo?: string; subtitulo?: string; formulario?: { botao?: string } };
  galeria?: { titulo?: string; itens?: { id?: string; legenda?: string; imagem?: Img }[] };
  diferenciais?: { titulo?: string; itens?: { id?: string; titulo?: string; descricao?: string }[] };
  promocoes?: { titulo?: string; itens?: { id?: string; titulo?: string; descricao?: string; validade_label?: string; imagem?: Img }[] };
  eventos?: { titulo?: string; itens?: { id?: string; titulo?: string; descricao?: string; data_label?: string; horario?: string; imagem?: Img }[] };
  rodape?: { texto?: string; links?: { id: string; label: string; href: string }[] };
  agendamento?: { titulo?: string; subtitulo?: string; botao_confirmar?: string; fechado?: string; passo_profissional?: string };
  obrigado?: { botao_whatsapp?: string };
};

function textoOuPadrao(salvo: string | undefined, visivel: string, schema: string) {
  if (!salvo || salvo === schema) return visivel;
  return salvo;
}

const raio: Record<string, string> = { none: "0px", sm: "8px", md: "14px", lg: "22px" };

function coletarCreditos(site: Site) {
  const imgs: Img[] = [];
  if (site.hero?.imagem) imgs.push(site.hero.imagem);
  if (site.sobre?.imagem) imgs.push(site.sobre.imagem);
  for (const s of site.servicos?.itens || []) if (s.imagem) imgs.push(s.imagem);
  for (const p of site.profissionais?.itens || []) if (p.foto) imgs.push(p.foto);
  for (const g of site.galeria?.itens || []) if (g.imagem) imgs.push(g.imagem);
  const vistos = new Set<string>();
  return imgs
    .filter((i) => i.origem === "unsplash" && i.credito?.texto)
    .filter((i) => {
      const k = i.credito!.texto!;
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
}

function CreditosDoSite({ site }: { site: Site }) {
  const creditos = coletarCreditos(site);
  if (!creditos.length) return null;
  return (
    <p className="mx-auto mt-3 max-w-2xl opacity-55">
      {creditos.map((c, i) => (
        <span key={c.credito?.texto}>
          {i > 0 ? " · " : null}
          {c.credito?.perfil_url ? (
            <a href={c.credito.perfil_url} target="_blank" rel="noreferrer">
              {c.credito.texto}
            </a>
          ) : (
            c.credito?.texto
          )}
        </span>
      ))}
    </p>
  );
}

/** Assinatura fixa — não editável pelo cliente. */
function AssinaturaGuix() {
  return (
    <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-5 tracking-wide opacity-70">
      Desenvolvido por{" "}
      <a
        href={marca.site}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline decoration-current/30 underline-offset-2 hover:opacity-100"
        style={{ color: "var(--a)" }}
      >
        {marca.nome}
      </a>
    </p>
  );
}

export type AlvoEdicao = "negocio" | "aparencia" | "marca" | "contato" | "servicos" | "equipe";
export type SlotFoto = { tipo: "hero" | "sobre" | "galeria" | "servico" | "profissional"; indice?: number };

function textosIguais(a?: string, b?: string) {
  const n = (s?: string) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-záéíóúâêôãõç0-9]+/gi, "");
  const x = n(a);
  const y = n(b);
  if (!x || !y) return false;
  return x === y || y.startsWith(x) || x.startsWith(y);
}

const WA_PLACEHOLDER = /^(55)?79999990000$/;

function precoVisivel(v?: string) {
  const s = String(v || "").trim();
  if (!s || /^r\$\s*0([.,]00)?$/i.test(s) || s === "0") return "Sob consulta";
  return s;
}

function dadoVisivel(v?: string) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/endereço a confirmar|horário a combinar|nao-informado@guix\.invalid/i.test(s)) return "";
  const digitos = s.replace(/\D/g, "");
  if (WA_PLACEHOLDER.test(digitos)) return "";
  return s;
}

function wa(digitos?: string, msg?: string) {
  const d = String(digitos || "").replace(/\D/g, "");
  if (!d || WA_PLACEHOLDER.test(d)) return "#contato";
  const text = encodeURIComponent(msg || "Olá, vim pelo site.");
  return `https://wa.me/${d}?text=${text}`;
}

function Bloco({
  alvo,
  label,
  onEditar,
  foco,
  revelado,
  children,
}: {
  alvo: AlvoEdicao;
  label: string;
  onEditar?: (alvo: AlvoEdicao) => void;
  foco?: AlvoEdicao[];
  revelado?: AlvoEdicao[];
  children: React.ReactNode;
}) {
  const ativo = Boolean(foco?.length && foco.includes(alvo));
  const ok = Boolean(revelado?.includes(alvo));
  const escurecer = Boolean(foco?.length) && !ativo && !ok;
  return (
    <div
      data-preview-alvo={alvo}
      className={`group/bloco relative transition-[filter,box-shadow] duration-700 ${ativo ? "gx-foco-bloco z-[2]" : ""} ${escurecer ? "gx-dim-bloco" : ""}`}
    >
      {children}
      {onEditar ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditar(alvo);
          }}
          className="absolute left-3 top-3 z-30 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-ink shadow-md opacity-100 lg:opacity-0 lg:group-hover/bloco:opacity-100"
        >
          Editar {label}
        </button>
      ) : null}
    </div>
  );
}

function Foto({
  src,
  alt,
  className,
  style,
  w,
  h,
  faces,
  onTrocar,
  mostrarAcao = true,
}: {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  w: number;
  h: number;
  faces?: boolean;
  onTrocar?: () => void;
  mostrarAcao?: boolean;
}) {
  if (!src) return null;
  const url = enquadrarFoto(src, w, h, faces) || src;
  if (!onTrocar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt || ""} className={`gx-photo ${className || ""}`} style={style} />
    );
  }
  const preencheFundo = /\babsolute\b/.test(className || "");
  return (
    <button
      type="button"
      className={`group/foto overflow-hidden border-0 bg-transparent p-0 ${className || ""}`}
      style={{
        ...style,
        // Evita conflito Tailwind relative/absolute: a capa precisa preencher o hero.
        position: preencheFundo ? "absolute" : "relative",
      }}
      onClick={onTrocar}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt || ""} className="gx-photo pointer-events-none h-full w-full object-cover" draggable={false} />
      {mostrarAcao ? (
        <span className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-[2px]">
          Trocar foto
        </span>
      ) : null}
    </button>
  );
}

/** Vitrine ao vivo a partir do site.json do cliente. */
export function SiteLivePreview({
  site,
  visual,
  modo = "pagina",
  studio = false,
  estreito = false,
  onEditar,
  onTrocarFoto,
  onTrocarLogo,
  onTexto,
  onAncora,
  foco,
  revelado,
  siteId,
}: {
  site: Site;
  visual?: VisualConfig;
  modo?: "pagina" | "rascunho";
  studio?: boolean;
  estreito?: boolean;
  onEditar?: (alvo: AlvoEdicao) => void;
  onTrocarFoto?: (slot: SlotFoto) => void;
  onTrocarLogo?: () => void;
  onTexto?: (campo: string, valor: string) => void;
  onAncora?: (id: string) => void;
  foco?: AlvoEdicao[];
  revelado?: AlvoEdicao[];
  /** Token do rascunho/site — grava agendamentos e libera cancelamento. */
  siteId?: string;
}) {
  const rascunho = modo === "rascunho";
  const vis = visual || visualPadrao(site.meta?.nicho);
  const heroComFoto =
    vis.banner !== "solido" &&
    vis.banner !== "degrade" &&
    Boolean(site.hero?.imagem?.src);
  const t = site.tema || {};
  const e = site.empresa || {};
  const heading = t.font_heading || "Oswald";
  const body = t.font_body || "Manrope";
  const redes = [
    ...(e.redes || []).filter((r) => {
      if (!r.url) return false;
      if (r.id === "instagram") return vis.instagram !== false;
      if (r.id === "facebook") return vis.facebook !== false;
      if (r.id === "tiktok") return vis.tiktok !== false;
      if (r.id === "youtube") return vis.youtube !== false;
      return true;
    }),
    ...(vis.redesExtra || []).filter((r) => r.url && !(e.redes || []).some((x) => x.id === r.id && x.url)),
  ];
  if (vis.linkedin !== false && vis.linkedinUrl && !redes.some((r) => r.id === "linkedin")) {
    redes.push({ id: "linkedin", label: "LinkedIn", url: vis.linkedinUrl });
  }
  const style = {
    ["--p"]: t.color_primary || "#111",
    ["--s"]: t.color_secondary || "#C6A15B",
    ["--a"]: t.color_accent || "#D4B483",
    ["--bg"]: t.color_background || "#0C0C0C",
    ["--sf"]: t.color_surface || "#171717",
    ["--hd"]: vis.corTitulos || t.color_heading || t.color_text || "#F4F0E6",
    ["--tx"]: t.color_text || "#F4F0E6",
    ["--mt"]: t.color_text_muted || "#C8C2B4",
    ["--r"]: raio[t.radius || "sm"] || "8px",
  } as React.CSSProperties;

  const chavesEquipe = new Set<string>();
  const equipeVisivelComIndices = (site.profissionais?.itens || [])
    .map((p, indice) => ({ p, indice }))
    .filter(({ p }) => {
      if (!p.nome || p.nome === "Sem preferência") return false;
      const normalizar = (valor: string) =>
        valor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("pt-BR")
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
      const chave = `${normalizar(p.nome)}|${normalizar(p.cargo || "")}`;
      if (chavesEquipe.has(chave)) return false;
      chavesEquipe.add(chave);
      return true;
    })
    .slice(0, 12);
  const equipeVisivel = equipeVisivelComIndices.map(({ p }) => p);

  const arquivoMarca =
    vis.logoArquivo && /^\/marcas\/[a-z0-9-]+\/\d{2}\.png$/.test(vis.logoArquivo) ? vis.logoArquivo : "";
  const logoGerada = !arquivoMarca && (vis.logoIcone || vis.logoEmblema || vis.logoLayout === "wordmark")
    ? uriMarcaViva(
        {
          id: "marca-ia",
          origem: "manual",
          icone: vis.logoIcone || "",
          emblema: vis.logoEmblema,
          layout: vis.logoLayout || "lado",
          fonteId: vis.logoFonteId || "system",
          corIcone: vis.logoCorIcone,
          corNome: vis.logoCorNome,
          corAcento: vis.logoCorAcento,
        },
        { nome: e.nome || "Seu negócio", slogan: e.slogan, acento: vis.logoCorAcento || t.color_accent || "#D4B483" },
      )
    : "";
  const logoSrc = arquivoMarca || logoGerada || e.logo?.src || "";
  const logoArquivo = Boolean(arquivoMarca || (!logoGerada && e.logo?.src?.startsWith("/marcas/")));
  const tamLogo = vis.logoTamanho || "medio";
  const pintaArquivo = Boolean(logoArquivo && (vis.logoCorIcone || vis.logoCorAcento || t.color_accent));
  const classeLogo = logoArquivo
    ? tamLogo === "pequeno"
      ? pintaArquivo
        ? "gx-logo-arquivo h-10 w-10"
        : "gx-logo-arquivo h-10 w-auto max-w-[72px] object-contain"
      : tamLogo === "grande"
        ? pintaArquivo
          ? "gx-logo-arquivo h-20 w-20"
          : "gx-logo-arquivo h-20 w-auto max-w-[160px] object-contain"
        : pintaArquivo
          ? "gx-logo-arquivo h-14 w-14"
          : "gx-logo-arquivo h-14 w-auto max-w-[104px] object-contain"
    : tamLogo === "pequeno"
      ? "h-9 w-auto max-w-[180px] object-contain"
      : tamLogo === "grande"
        ? "h-24 w-auto max-w-[460px] object-contain"
        : "h-14 w-auto max-w-[300px] object-contain";
  const cab = vis.cabecalho || "logo-esquerda";
  const logoAlinhamento = vis.logoAlinhamento || "centro";
  const alinhamentoLockup =
    logoAlinhamento === "topo" ? "items-start" : logoAlinhamento === "base" ? "items-end" : "items-center";
  const mostraTextoForaDoSvg = !logoSrc || logoArquivo;
  const mostraSloganLockup = Boolean(e.slogan || onTexto) && (cab === "logo-slogan" || mostraTextoForaDoSvg);
  const marca = (
    <span
      className={`flex min-w-0 gap-3 ${alinhamentoLockup} ${
        cab === "centralizado" || cab === "menu-abaixo" ? "flex-col text-center" : ""
      }`}
    >
      {logoSrc ? (
        <LogoMarca
          src={logoSrc}
          alt={e.logo?.alt || e.nome || ""}
          className={classeLogo}
          cor={pintaArquivo ? vis.logoCorIcone || vis.logoCorAcento || t.color_accent : undefined}
          inverter={logoArquivo && !pintaArquivo && tintaClara(t.color_text)}
        />
      ) : null}
      {mostraTextoForaDoSvg ? (
        <span className={`flex min-w-0 flex-col leading-tight ${cab === "centralizado" || cab === "menu-abaixo" ? "items-center" : "items-start justify-center"}`}>
          <TextoEditavel
            as="span"
            valor={e.nome}
            campo="nome"
            onTexto={onTexto}
            className="truncate text-base font-semibold tracking-wide"
            style={{ fontFamily: heading, color: vis.logoCorNome || undefined }}
          />
          {mostraSloganLockup ? (
            <TextoEditavel
              as="span"
              valor={e.slogan || "Frase da marca"}
              campo="slogan"
              onTexto={onTexto}
              className="mt-0.5 truncate text-[11px] font-normal"
              style={{ color: vis.logoCorAcento || undefined, opacity: vis.logoCorAcento ? 1 : 0.7 }}
            />
          ) : null}
        </span>
      ) : null}
    </span>
  );

  function aoClicarStudio(e: React.MouseEvent) {
    if (!studio) return;
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) return;
    e.preventDefault();
  }

  function aoAncora(ev: React.MouseEvent<HTMLAnchorElement>) {
    const href = ev.currentTarget.getAttribute("href") || "";
    const alvo = ev.target as HTMLElement;
    const noEditor = Boolean(alvo.closest("[data-editar], [contenteditable='true'], [role='textbox']"));
    const sel = window.getSelection();
    const selecionando = Boolean(sel && !sel.isCollapsed && ev.currentTarget.contains(sel.anchorNode));
    if (noEditor || selecionando || ev.detail > 1) {
      ev.preventDefault();
      return;
    }
    if (!href.startsWith("#")) {
      if (studio) ev.preventDefault();
      return;
    }
    ev.preventDefault();
    const id = href.slice(1);
    ev.currentTarget.closest("[data-preview]")?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    onAncora?.(id);
  }

  return (
    <div
      style={style}
      className="overflow-hidden"
      data-preview="site"
      data-anim={vis.animacao}
      lang="pt-BR"
      onClick={aoClicarStudio}
    >
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={googleFontsHref(vis)} />
      <div
        className="relative"
        style={{
          background: "var(--bg)",
          color: "var(--tx)",
          fontFamily: `${body}, system-ui, sans-serif`,
        }}
      >
        <Bloco alvo="marca" label="marca" onEditar={onEditar} foco={foco} revelado={revelado}>
        <header
          className={
            cab === "centralizado"
              ? "flex flex-col items-center gap-3 px-4 py-3 text-center md:px-8"
              : cab === "menu-abaixo"
                ? "flex flex-col gap-3 px-4 py-3 md:px-8"
                : cab === "logo-direita"
                  ? "flex flex-row-reverse items-center justify-between gap-3 px-4 py-3 md:px-8"
                  : cab === "compacto"
                    ? "flex items-center justify-between gap-2 px-3 py-1.5 md:px-6"
                    : "flex items-center justify-between gap-3 px-4 py-3 md:px-8"
          }
        >
          {onTrocarLogo ? (
            <span
              role="button"
              tabIndex={0}
              className="min-w-0 cursor-pointer bg-transparent p-0 text-inherit"
              onClick={(ev) => { ev.stopPropagation(); onTrocarLogo(); }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  ev.stopPropagation();
                  onTrocarLogo();
                }
              }}
              aria-label="Trocar logo"
            >
              {marca}
            </span>
          ) : (
            marca
          )}
          <nav className={`gap-4 text-xs opacity-80 ${cab === "menu-abaixo" && !estreito ? "flex flex-wrap" : estreito ? "hidden" : "hidden md:flex"}`}>
            {(() => {
              const base = (site.header?.menu || []).filter((m) => {
                // Esconde só o menu de eventos/encontros quando não há itens — nunca some com #agendar
                if (/#agendar\b/i.test(m.href || "")) return vis.agendamento !== false;
                if ((site.eventos?.itens?.length ?? 0) > 0) return true;
                return !/#eventos\b/i.test(m.href || "") && !/^(encontros|eventos)$/i.test(String(m.label || "").trim());
              });
              const temAgendar = base.some((m) => /#agendar\b/i.test(m.href || ""));
              const menu =
                vis.agendamento !== false && !temAgendar
                  ? [...base, { id: "agendar", label: "Agenda", href: "#agendar" }]
                  : base;
              return menu.slice(0, 7).map((m, i) => (
                <a key={m.id} href={m.href} className="hover:opacity-100" onClickCapture={aoAncora}>
                  <TextoEditavel as="span" valor={m.label === "A casa" ? "Sobre" : m.label} campo={`menu.${i}.label`} onTexto={onTexto} />
                </a>
              ));
            })()}
          </nav>
          {vis.agendamento !== false ? (
            <a
              href="#agendar"
              className="px-3 py-1.5 text-xs font-semibold"
              style={{
                background: vis.botao === "sem-contorno" ? "transparent" : "var(--a)",
                color: vis.botao === "sem-contorno" ? "var(--tx)" : "var(--bg)",
                borderRadius: "var(--r)",
                border: vis.botao === "sem-contorno" ? "none" : undefined,
              }}
              onClickCapture={aoAncora}
            >
              <TextoEditavel as="span" valor={site.header?.botao_agendar || "Agendar"} campo="header.botao" onTexto={onTexto} />
            </a>
          ) : (
            <span />
          )}
        </header>
        </Bloco>

        <Bloco alvo="negocio" label="nome e frase" onEditar={onEditar} foco={foco} revelado={revelado}>
        <section
          id="inicio"
          className={`relative overflow-hidden ${
            heroComFoto ? "bg-[var(--bg)]" : rascunho ? "min-h-[280px]" : "min-h-[70vh]"
          }`}
        >
          {heroComFoto ? (
            <div
              className={`relative h-[68vh] min-h-[420px] max-h-[760px] ${
                estreito ? "" : "md:absolute md:inset-y-0 md:right-0 md:h-auto md:max-h-none md:w-[56%]"
              }`}
            >
              <Foto
                src={site.hero?.imagem?.src}
                alt={site.hero?.imagem?.alt || ""}
                className="h-full w-full object-cover"
                w={1600}
                h={1200}
                faces
                mostrarAcao={false}
                onTrocar={onTrocarFoto ? () => onTrocarFoto({ tipo: "hero" }) : undefined}
              />
            </div>
          ) : (
            <>
              {vis.banner !== "solido" && vis.banner !== "degrade" && site.hero?.imagem?.src ? (
                <Foto
                  src={site.hero.imagem.src}
                  alt={site.hero.imagem.alt || ""}
                  className="absolute inset-0 h-full w-full object-cover"
                  w={1920}
                  h={1080}
                  faces
                  onTrocar={onTrocarFoto ? () => onTrocarFoto({ tipo: "hero" }) : undefined}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      vis.banner === "degrade"
                        ? "linear-gradient(135deg, var(--p), var(--sf), var(--a))"
                        : "var(--sf)",
                  }}
                />
              )}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(to top, var(--bg), color-mix(in srgb, var(--bg) 55%, transparent), transparent)",
                }}
              />
            </>
          )}
          <div
            className={`relative mx-auto flex w-full flex-col justify-center px-4 ${
              heroComFoto
                ? `max-w-6xl py-9 sm:py-12 ${estreito ? "" : "md:min-h-[72vh] md:px-8 md:py-16"}`
                : `max-w-5xl justify-end pb-16 pt-28 md:px-8 ${rascunho ? "min-h-[280px] pt-16 pb-10" : "min-h-[70vh]"}`
            }`}
          >
            <div className={heroComFoto ? `w-full max-w-xl ${estreito ? "" : "md:w-[42%] md:max-w-none"}` : "w-full"}>
              {heroComFoto && onTrocarFoto ? (
                <button
                  type="button"
                  className="mb-4 inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{ borderColor: "color-mix(in srgb, var(--tx) 20%, transparent)", color: "var(--tx)" }}
                  onClick={() => onTrocarFoto({ tipo: "hero" })}
                >
                  Trocar foto da capa
                </button>
              ) : null}
              {e.slogan && !textosIguais(e.slogan, site.hero?.subtitulo) && !textosIguais(e.slogan, site.hero?.titulo) ? (
                <TextoEditavel
                  as="p"
                  valor={e.slogan}
                  campo="slogan"
                  onTexto={onTexto}
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--s)" }}
                />
              ) : null}
              <TextoEditavel
                as="h1"
                valor={site.hero?.titulo}
                campo="hero.titulo"
                onTexto={onTexto}
                className={`mt-3 max-w-3xl text-4xl font-bold leading-[1.05] ${estreito ? "" : "md:text-5xl xl:text-6xl"}`}
                style={{ fontFamily: heading }}
              />
              {site.hero?.subtitulo && !textosIguais(site.hero.subtitulo, site.hero.titulo) ? (
                <TextoEditavel
                  as="p"
                  valor={site.hero.subtitulo}
                  campo="hero.subtitulo"
                  onTexto={onTexto}
                  multiline
                  className={`mt-4 max-w-xl text-base leading-7 ${estreito ? "" : "md:text-[17px]"}`}
                  style={{ color: "var(--mt)" }}
                />
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={vis.agendamento !== false ? "#agendar" : wa(e.whatsapp, e.whatsapp_mensagem)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--a)", color: "var(--bg)", borderRadius: "var(--r)" }}
                  onClickCapture={aoAncora}
                >
                  <TextoEditavel as="span" valor={site.hero?.botao_principal || "Agendar horário"} campo="hero.botao" onTexto={onTexto} />
                </a>
                <a
                  href={dadoVisivel(e.whatsapp_label || e.telefone_label) ? wa(e.whatsapp, e.whatsapp_mensagem) : "#contato"}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "var(--s)", color: "var(--tx)", borderRadius: "var(--r)" }}
                  onClickCapture={aoAncora}
                >
                  <TextoEditavel
                    as="span"
                    valor={
                      site.hero?.botao_secundario && (!textosIguais(site.hero.botao_secundario, site.hero.botao_principal) || onTexto)
                        ? site.hero.botao_secundario
                        : dadoVisivel(e.whatsapp_label || e.telefone_label)
                          ? "Chamar no WhatsApp"
                          : "Ver contato"
                    }
                    campo="hero.botao2"
                    onTexto={onTexto}
                  />
                </a>
              </div>
            </div>
          </div>
        </section>

        {rascunho ? (
        <section className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <TextoEditavel as="p" valor={e.nome} campo="nome" onTexto={onTexto} className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--s)" }} />
          <TextoEditavel as="h2" valor={site.sobre?.titulo || "Sobre"} campo="sobre.titulo" onTexto={onTexto} className="mt-2 text-2xl font-bold" style={{ fontFamily: heading }} />
          <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: "var(--mt)" }}>
            {(site.sobre?.paragrafos && site.sobre.paragrafos[0]) ||
              "Textos e fotos entram quando você gerar o site de teste."}
          </p>
        </section>
        ) : (
        <section id="sobre" className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:px-8">
          <div>
            <TextoEditavel as="p" valor={e.nome} campo="nome" onTexto={onTexto} className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--s)" }} />
            <TextoEditavel
              as="h2"
              valor={site.sobre?.titulo}
              campo="sobre.titulo"
              onTexto={onTexto}
              className="mt-2 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: heading }}
            />
            {(site.sobre?.paragrafos || []).map((p, i) => (
              <TextoEditavel
                key={`sobre-${i}`}
                valor={p}
                campo={`sobre.p.${i}`}
                onTexto={onTexto}
                multiline
                className="mt-4 text-sm leading-7 md:text-base"
                style={{ color: "var(--mt)" }}
              />
            ))}
            <a
              href={vis.agendamento !== false ? "#agendar" : wa(e.whatsapp, e.whatsapp_mensagem)}
              className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "var(--a)", color: "var(--bg)", borderRadius: "var(--r)" }}
              onClickCapture={aoAncora}
            >
              <TextoEditavel as="span" valor={site.hero?.botao_principal || "Quero agendar"} campo="hero.botao" onTexto={onTexto} />
            </a>
          </div>
          {site.sobre?.imagem?.src ? (
            <div className="gx-photo-frame h-96 w-full" style={{ borderRadius: "var(--r)" }}>
              <Foto
                src={site.sobre.imagem.src}
                alt={site.sobre.imagem.alt || ""}
                className="h-full w-full object-cover"
                style={{ borderRadius: "var(--r)" }}
                w={1200}
                h={900}
                onTrocar={onTrocarFoto ? () => onTrocarFoto({ tipo: "sobre" }) : undefined}
              />
            </div>
          ) : null}
        </section>
        )}
        </Bloco>

        <Bloco alvo="servicos" label="serviços" onEditar={onEditar} foco={foco} revelado={revelado}>
        <section id="servicos" className={`px-4 md:px-8 ${rascunho ? "py-10" : "py-20"}`} style={{ background: "var(--sf)" }}>
          <div className="mx-auto max-w-5xl">
            <TextoEditavel
              as="h2"
              valor={site.servicos?.titulo}
              campo="servicos.titulo"
              onTexto={onTexto}
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: heading }}
            />
            <TextoEditavel
              valor={site.servicos?.subtitulo}
              campo="servicos.subtitulo"
              onTexto={onTexto}
              className="mt-2 max-w-xl text-sm"
              style={{ color: "var(--mt)" }}
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(site.servicos?.itens || []).slice(0, 6).map((s, i) => (
                <article
                  key={s.id || s.nome}
                  className={`gx-card-in overflow-hidden ${i === 0 && !rascunho ? "sm:col-span-2 lg:col-span-1" : ""}`}
                  style={{ background: "var(--bg)", borderRadius: "var(--r)" }}
                >
                  {s.imagem?.src ? (
                    <div className="gx-photo-frame aspect-[16/10] w-full">
                      <Foto
                        src={s.imagem.src}
                        alt={s.imagem.alt || ""}
                        className="h-full w-full object-cover"
                        w={1200}
                        h={750}
                        onTrocar={onTrocarFoto ? () => onTrocarFoto({ tipo: "servico", indice: i }) : undefined}
                      />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <TextoEditavel as="h3" valor={s.nome} campo={`srv.${i}.nome`} onTexto={onTexto} className="text-lg font-semibold" />
                    <TextoEditavel
                      valor={s.descricao}
                      campo={`srv.${i}.descricao`}
                      onTexto={onTexto}
                      multiline
                      className="mt-2 text-sm leading-6"
                      style={{ color: "var(--mt)" }}
                    />
                    <p className="mt-4 text-xl font-bold" style={{ color: "var(--s)" }}>
                      <TextoEditavel as="span" valor={precoVisivel(s.preco_label)} campo={`srv.${i}.preco`} onTexto={onTexto} corretor={false} />
                      {s.duracao_label ? (
                        <TextoEditavel
                          as="span"
                          valor={s.duracao_label}
                          campo={`srv.${i}.duracao`}
                          onTexto={onTexto}
                          className="ml-2 text-sm font-normal opacity-80"
                        />
                      ) : null}
                    </p>
                    {!rascunho ? (
                      <a href={wa(e.whatsapp, e.whatsapp_mensagem)} className="mt-4 inline-block text-sm font-semibold underline" onClickCapture={aoAncora}>
                        <TextoEditavel as="span" valor={textoOuPadrao(site.agendamento?.botao_confirmar, "Agendar este", "Confirmar pelo WhatsApp")} campo="cta.servico" onTexto={onTexto} />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        </Bloco>

        {equipeVisivel.length ? (
        <Bloco alvo="equipe" label="quem atende" onEditar={onEditar} foco={foco} revelado={revelado}>
        <section id="profissionais" className="mx-auto max-w-5xl px-4 py-20 md:px-8">
          <TextoEditavel
            as="h2"
            valor={site.profissionais?.titulo}
            campo="equipe.titulo"
            onTexto={onTexto}
            className="text-3xl font-bold md:text-4xl"
            style={{ fontFamily: heading }}
          />
          <TextoEditavel
            valor={site.profissionais?.subtitulo}
            campo="equipe.subtitulo"
            onTexto={onTexto}
            className="mt-2 text-sm"
            style={{ color: "var(--mt)" }}
          />
          <div className="gx-equipe-grade mt-10">
            {equipeVisivelComIndices.map(({ p, indice }) =>
              p.nome && p.nome !== "Sem preferência" ? (
              <article key={p.id || p.nome} className="gx-equipe-item text-center">
                {p.foto?.src ? (
                  <Foto
                    src={p.foto.src}
                    alt={p.foto.alt || p.nome || ""}
                    className={`gx-equipe-foto gx-equipe-foto--${vis.equipeFotoTamanho || "medio"} gx-equipe-foto--${vis.equipeFotoForma || "circulo"} mx-auto object-cover`}
                    w={400}
                    h={400}
                    faces
                    onTrocar={onTrocarFoto ? () => onTrocarFoto({ tipo: "profissional", indice }) : undefined}
                  />
                ) : (
                  <div
                    className={`gx-equipe-foto gx-equipe-foto--${vis.equipeFotoTamanho || "medio"} gx-equipe-foto--${vis.equipeFotoForma || "circulo"} relative mx-auto flex items-center justify-center text-3xl font-semibold`}
                    style={{ background: "var(--sf)", color: "var(--s)" }}
                  >
                    {(p.nome || "?").slice(0, 1)}
                    {onTrocarFoto ? (
                      <button
                        type="button"
                        className="absolute inset-x-1 bottom-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white"
                        onClick={() => onTrocarFoto({ tipo: "profissional", indice })}
                      >
                        Adicionar foto
                      </button>
                    ) : null}
                  </div>
                )}
                <TextoEditavel as="h3" valor={p.nome} campo={`pro.${indice}.nome`} onTexto={onTexto} className="mt-4 font-semibold" />
                <TextoEditavel as="p" valor={p.cargo} campo={`pro.${indice}.cargo`} onTexto={onTexto} className="text-sm" style={{ color: "var(--s)" }} />
                {p.descricao ? (
                  <TextoEditavel
                    valor={p.descricao}
                    campo={`pro.${indice}.descricao`}
                    onTexto={onTexto}
                    multiline
                    className="mx-auto mt-2 max-w-[11rem] text-xs leading-5"
                    style={{ color: "var(--mt)" }}
                  />
                ) : null}
              </article>
            ) : null
            )}
          </div>
        </section>
        </Bloco>
        ) : null}

        {!rascunho && (site.diferenciais?.itens?.length ?? 0) > 0 ? (
          <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
            <TextoEditavel as="h2" valor={site.diferenciais?.titulo} campo="diferenciais.titulo" onTexto={onTexto} className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }} />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {(site.diferenciais?.itens || []).slice(0, 6).map((d, i) => (
                <article key={d.id || d.titulo} className="p-5" style={{ background: "var(--sf)", borderRadius: "var(--r)" }}>
                  <TextoEditavel as="h3" valor={d.titulo} campo={`dif.${i}.titulo`} onTexto={onTexto} className="font-semibold" />
                  <TextoEditavel valor={d.descricao} campo={`dif.${i}.descricao`} onTexto={onTexto} multiline className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }} />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!rascunho && (site.promocoes?.itens?.length ?? 0) > 0 ? (
          <section id="promocoes" className="px-4 py-20 md:px-8" style={{ background: "var(--sf)" }}>
            <div className="mx-auto max-w-5xl">
              <TextoEditavel as="h2" valor={site.promocoes?.titulo || "Promoções"} campo="promo.titulo" onTexto={onTexto} className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }} />
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {(site.promocoes?.itens || []).slice(0, 4).map((p, i) => (
                  <article key={p.id || p.titulo} className="overflow-hidden" style={{ background: "var(--bg)", borderRadius: "var(--r)" }}>
                    {p.imagem?.src ? (
                      <Foto src={p.imagem.src} alt={p.imagem.alt || ""} className="aspect-[16/9] w-full object-cover" w={1200} h={675} />
                    ) : null}
                    <div className="p-5">
                      <TextoEditavel as="h3" valor={p.titulo} campo={`prm.${i}.titulo`} onTexto={onTexto} className="text-lg font-semibold" />
                      <TextoEditavel valor={p.descricao} campo={`prm.${i}.descricao`} onTexto={onTexto} multiline className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }} />
                      {p.validade_label || onTexto ? (
                        <TextoEditavel valor={p.validade_label || "Validade"} campo={`prm.${i}.validade`} onTexto={onTexto} className="mt-3 text-xs" style={{ color: "var(--s)" }} />
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!rascunho && (site.eventos?.itens?.length ?? 0) > 0 ? (
          <section id="eventos" className="mx-auto max-w-5xl px-4 py-20 md:px-8">
            <TextoEditavel as="h2" valor={site.eventos?.titulo || "Agenda"} campo="eventos.titulo" onTexto={onTexto} className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }} />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {(site.eventos?.itens || []).slice(0, 4).map((ev, i) => (
                <article key={ev.id || ev.titulo} className="overflow-hidden" style={{ background: "var(--sf)", borderRadius: "var(--r)" }}>
                  {ev.imagem?.src ? (
                    <Foto src={ev.imagem.src} alt={ev.imagem.alt || ""} className="aspect-[16/9] w-full object-cover" w={1200} h={675} />
                  ) : null}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
                      <TextoEditavel as="span" valor={ev.data_label || "Data"} campo={`evt.${i}.data`} onTexto={onTexto} />
                      {ev.horario && !/recesso|natal|aviso|aten[cç][aã]o|fechado|n[aã]o atender/i.test(`${ev.titulo || ""} ${ev.descricao || ""}`) ? (
                        <>
                          <span className="mx-1 opacity-60">·</span>
                          <TextoEditavel as="span" valor={ev.horario} campo={`evt.${i}.horario`} onTexto={onTexto} corretor={false} />
                        </>
                      ) : null}
                    </p>
                    <TextoEditavel as="h3" valor={ev.titulo} campo={`evt.${i}.titulo`} onTexto={onTexto} className="mt-2 text-lg font-semibold" />
                    <TextoEditavel valor={ev.descricao} campo={`evt.${i}.descricao`} onTexto={onTexto} multiline className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!rascunho && (site.galeria?.itens?.length ?? 0) > 0 ? (
          <section id="galeria" className="mx-auto max-w-5xl px-4 py-20 md:px-8">
            <TextoEditavel
              as="h2"
              valor={site.galeria?.titulo && site.galeria.titulo !== "A casa" ? site.galeria.titulo : "O espaço"}
              campo="galeria.titulo"
              onTexto={onTexto}
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: heading }}
            />
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
              {(site.galeria?.itens || []).slice(0, 6).map((g, gi) => (
                <figure key={g.id || g.legenda} className="gx-card-in">
                  {g.imagem?.src ? (
                    <div className="gx-photo-frame aspect-square w-full" style={{ borderRadius: "var(--r)" }}>
                      <Foto
                        src={g.imagem.src}
                        alt={g.imagem.alt || g.legenda || ""}
                        className="h-full w-full object-cover"
                        style={{ borderRadius: "var(--r)" }}
                        w={900}
                        h={900}
                        onTrocar={onTrocarFoto ? () => onTrocarFoto({ tipo: "galeria", indice: gi }) : undefined}
                      />
                    </div>
                  ) : null}
                  {g.legenda && g.legenda !== "A casa" ? (
                    <TextoEditavel valor={g.legenda} campo={`gal.${gi}.legenda`} onTexto={onTexto} className="mt-2 text-xs" style={{ color: "var(--mt)" }} />
                  ) : onTexto ? (
                    <TextoEditavel valor="Legenda da foto" campo={`gal.${gi}.legenda`} onTexto={onTexto} className="mt-2 text-xs" style={{ color: "var(--mt)" }} />
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {!rascunho && ((site.faq?.itens?.length ?? 0) > 0 || onTexto) ? (
          <section id="faq" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
            <TextoEditavel
              as="h2"
              valor={site.faq?.titulo || "Dúvidas"}
              campo="faq.titulo"
              onTexto={onTexto}
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: heading }}
            />
            <div className="mt-8 space-y-5">
              {(site.faq?.itens || []).slice(0, 10).map((f, i) => (
                <div
                  key={f.id || `${f.pergunta}-${i}`}
                  className="rounded-[var(--r)] border px-5 py-4"
                  style={{ borderColor: "color-mix(in srgb, var(--tx) 12%, transparent)", background: "var(--sf)" }}
                >
                  <TextoEditavel
                    as="h3"
                    valor={f.pergunta || "Pergunta"}
                    campo={`faq.${i}.pergunta`}
                    onTexto={onTexto}
                    className="text-base font-semibold leading-snug md:text-lg"
                  />
                  <TextoEditavel
                    valor={f.resposta || "Resposta"}
                    campo={`faq.${i}.resposta`}
                    onTexto={onTexto}
                    multiline
                    className="mt-2 text-sm leading-6 md:text-[15px]"
                    style={{ color: "var(--mt)" }}
                  />
                  {onTexto ? (
                    <button type="button" className="mt-2 text-xs opacity-70" onClick={() => onTexto(`faq.${i}.remover`, "remover")}>
                      Remover pergunta
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {onTexto ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {(site.faq?.itens?.length || 0) < 10 ? (
                  <button type="button" className="rounded-full border border-current px-4 py-2 text-sm" onClick={() => onTexto("faq.nova", "Nova pergunta")}>
                    Incluir pergunta
                  </button>
                ) : null}
                {(site.faq?.itens?.length || 0) > 0 ? (
                  <button type="button" className="rounded-full border border-current px-4 py-2 text-sm" onClick={() => onTexto("faq.limpar", "limpar")}>
                    Remover todas
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {!rascunho && vis.agendamento !== false ? (
          <div>
            <AgendarBloco
              titulo={site.agendamento?.titulo}
              subtitulo={site.agendamento?.subtitulo}
              servicos={site.servicos?.itens || []}
              profissionais={equipeVisivel}
              expediente={e.expediente || []}
              agendaEquipe={vis.agendaEquipe}
              duracaoSlotMinutos={vis.duracaoSlotMinutos || 30}
              modoConfirmacao={vis.modoConfirmacaoAgenda || "automatico"}
              whatsapp={e.whatsapp}
              emailNegocio={e.email}
              negocioNome={e.nome}
              siteId={siteId}
              nicho={site.meta?.nicho}
              fechado={site.agendamento?.fechado}
              studio={studio || (Boolean(onTexto) && !siteId)}
            />
          </div>
        ) : null}

        <Bloco alvo="contato" label="contato" onEditar={onEditar} foco={foco} revelado={revelado}>
        <section id="contato" className="px-4 py-20 md:px-8" style={{ background: "var(--sf)" }}>
          <div className="mx-auto max-w-5xl">
            <TextoEditavel
              as="h2"
              valor={site.contato?.titulo || "Onde estamos"}
              campo="contato.titulo"
              onTexto={onTexto}
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: heading }}
            />
            <TextoEditavel
              valor={site.contato?.subtitulo}
              campo="contato.subtitulo"
              onTexto={onTexto}
              className="mt-2 max-w-xl text-sm"
              style={{ color: "var(--mt)" }}
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {onTexto || dadoVisivel(e.endereco?.completo) ? (
                <div className="flex gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--a) 18%, transparent)", color: "var(--a)" }} aria-hidden>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>Endereço</p>
                    <TextoEditavel valor={dadoVisivel(e.endereco?.completo) || "Escreva o endereço"} campo="endereco" onTexto={onTexto} className="mt-1 text-sm" />
                  </div>
                </div>
              ) : null}
              {onTexto || dadoVisivel(e.horario_resumo) ? (
                <div className="flex gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--a) 18%, transparent)", color: "var(--a)" }} aria-hidden>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11H7v-2h4V6h2z"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
                      {studio ? "Horário (resumo no site)" : "Horário"}
                    </p>
                    <TextoEditavel valor={dadoVisivel(e.horario_resumo) || "Horário de funcionamento"} campo="horario" onTexto={onTexto} className="mt-1 text-sm" />
                    {studio && vis.agendamento !== false ? (
                      <a href="#agendar" onClickCapture={aoAncora} className="mt-2 inline-flex text-xs font-semibold underline" style={{ color: "var(--a)" }}>
                        Ver grade de agendamento ↓
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {onTexto || dadoVisivel(e.whatsapp_label || e.telefone_label) ? (
                <div className="flex gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-[#128C7E]" aria-hidden>
                    <IconeRede id="whatsapp" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>WhatsApp</p>
                    <TextoEditavel as="span" valor={dadoVisivel(e.whatsapp_label || e.telefone_label) || "Telefone com DDD"} campo="telefone" onTexto={onTexto} corretor={false} className="mt-1 block text-sm" />
                  </div>
                </div>
              ) : null}
              {onTexto || (e.email && !/nao-informado@guix\.invalid/i.test(e.email)) ? (
                <div className="flex gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--tx) 14%, transparent)" }}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--a) 18%, transparent)", color: "var(--a)" }} aria-hidden>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5z"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>E-mail</p>
                    <p className="mt-1 break-all text-sm">{e.email && !/nao-informado@guix\.invalid/i.test(e.email) ? e.email : "contato@seunegocio.com.br"}</p>
                  </div>
                </div>
              ) : null}
            </div>
            {redes.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {redes.map((r) => (
                  <a
                    key={`contato-${r.id}`}
                    href={r.url}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border"
                    style={{ borderColor: "color-mix(in srgb, var(--tx) 18%, transparent)", color: "var(--tx)" }}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={vis.rotulosRede?.[r.id || ""] || r.label || r.id}
                    onClickCapture={aoAncora}
                    title={vis.rotulosRede?.[r.id || ""] || r.label || r.id}
                  >
                    <IconeRede id={String(r.id || "")} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            ) : null}
            <a
              href={wa(e.whatsapp, e.whatsapp_mensagem)}
              className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: "var(--a)", color: "var(--bg)", borderRadius: "var(--r)" }}
              onClickCapture={aoAncora}
            >
              <IconeRede id="whatsapp" className="h-4 w-4" />
              <TextoEditavel as="span" valor={textoOuPadrao(site.contato?.formulario?.botao, "Chamar no WhatsApp", "Enviar pelo WhatsApp")} campo="cta.contato" onTexto={onTexto} />
            </a>
          </div>
        </section>

        <footer
          className={
            ((vis.rodapeLayout || "centralizado") === "dividido"
              ? "flex flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs md:px-8"
              : (vis.rodapeLayout || "centralizado") === "empilhado"
                ? "flex flex-col items-start gap-3 px-4 py-10 text-left text-xs md:px-8"
                : (vis.rodapeLayout || "centralizado") === "minimo"
                  ? "px-4 py-4 text-center text-xs md:px-8"
                  : "px-4 py-8 text-center text-xs md:px-8") +
            (vis.whatsappFlutuante ? " pb-28 sm:pb-10" : "")
          }
          style={{ color: "var(--mt)", background: (vis.rodapeLayout || "centralizado") === "dividido" ? "var(--sf)" : undefined }}
        >
          <TextoEditavel valor={site.rodape?.texto || e.nome} campo="rodape.texto" onTexto={onTexto} />
          {(vis.rodapeLayout || "centralizado") === "minimo" ? null : site.rodape?.links?.length ? (
            <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {site.rodape.links.map((l, i) => (
                <a key={l.id} href={l.href} className="underline" target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noreferrer" : undefined} onClickCapture={aoAncora}>
                  <TextoEditavel as="span" valor={l.label} campo={`rodape.${i}.label`} onTexto={onTexto} />
                </a>
              ))}
            </p>
          ) : null}
          {(vis.rodapeLayout || "centralizado") === "minimo" ? null : redes.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {redes.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{ borderColor: "color-mix(in srgb, var(--tx) 18%, transparent)", color: "var(--tx)" }}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={vis.rotulosRede?.[r.id || ""] || r.label || r.id}
                  onClickCapture={aoAncora}
                  title={vis.rotulosRede?.[r.id || ""] || r.label || r.id}
                >
                  <IconeRede id={String(r.id || "")} className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
          <CreditosDoSite site={site} />
          <AssinaturaGuix />
        </footer>
        </Bloco>

        {vis.whatsappFlutuante && wa(e.whatsapp) !== "#contato" ? (
          <a
            href={wa(e.whatsapp, e.whatsapp_mensagem)}
            className={`${studio || rascunho ? "absolute" : "fixed"} bottom-5 right-4 z-40 px-3.5 py-3 text-sm font-semibold shadow-lg sm:right-5 sm:px-4`}
            style={{ background: "#25D366", color: "#052e16", borderRadius: "999px" }}
            onClickCapture={aoAncora}
            aria-label="WhatsApp"
          >
            <TextoEditavel as="span" valor={textoOuPadrao(site.obrigado?.botao_whatsapp, "WhatsApp", "Abrir WhatsApp")} campo="cta.flutuante" onTexto={onTexto} corretor={false} />
          </a>
        ) : null}
      </div>
    </div>
  );
}
