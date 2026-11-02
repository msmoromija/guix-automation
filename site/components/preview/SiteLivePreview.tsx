"use client";

import { LogoMarca } from "@/components/preview/LogoMarca";
import { TextoEditavel } from "@/components/preview/TextoEditavel";
import { tintaClara } from "@/lib/estudio/logo-spec";
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
type ItemPro = { id?: string; nome?: string; cargo?: string; descricao?: string; foto?: Img };
type ItemFaq = { id?: string; pergunta?: string; resposta?: string };

type Site = {
  meta?: { nicho?: string };
  empresa?: {
    nome?: string;
    slogan?: string;
    whatsapp?: string;
    whatsapp_mensagem?: string;
    horario_resumo?: string;
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
  contato?: { titulo?: string; subtitulo?: string };
  galeria?: { titulo?: string; itens?: { id?: string; legenda?: string; imagem?: Img }[] };
  diferenciais?: { titulo?: string; itens?: { id?: string; titulo?: string; descricao?: string }[] };
  promocoes?: { titulo?: string; itens?: { id?: string; titulo?: string; descricao?: string; validade_label?: string; imagem?: Img }[] };
  eventos?: { titulo?: string; itens?: { id?: string; titulo?: string; descricao?: string; data_label?: string; horario?: string; imagem?: Img }[] };
  rodape?: { texto?: string; links?: { id: string; label: string; href: string }[] };
};

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

export type AlvoEdicao = "negocio" | "aparencia" | "marca" | "contato" | "servicos" | "equipe";
export type SlotFoto = { tipo: "hero" | "sobre" | "galeria" | "servico"; indice?: number };

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
}: {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  w: number;
  h: number;
  faces?: boolean;
  onTrocar?: () => void;
}) {
  if (!src) return null;
  const url = enquadrarFoto(src, w, h, faces) || src;
  if (!onTrocar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt || ""} className={`gx-photo ${className || ""}`} style={style} />
    );
  }
  return (
    <button type="button" className={`group/foto relative overflow-hidden ${className || ""}`} style={style} onClick={onTrocar}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt || ""} className="gx-photo h-full w-full object-cover" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-ink/70 py-1.5 text-center text-[11px] font-semibold text-white opacity-100">
        Trocar foto
      </span>
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
  foco,
  revelado,
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
  foco?: AlvoEdicao[];
  revelado?: AlvoEdicao[];
}) {
  const rascunho = modo === "rascunho";
  const vis = visual || visualPadrao(site.meta?.nicho);
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
    ["--tx"]: t.color_text || "#F4F0E6",
    ["--mt"]: t.color_text_muted || "#C8C2B4",
    ["--r"]: raio[t.radius || "sm"] || "8px",
  } as React.CSSProperties;

  const equipeVisivel = (site.profissionais?.itens || []).filter(
    (p) => p.nome && p.nome !== "Sem preferência",
  );

  const logoArquivo = Boolean(e.logo?.src?.startsWith("/marcas/"));
  const tamLogo = vis.logoTamanho || "medio";
  const classeLogo = logoArquivo
    ? tamLogo === "pequeno"
      ? "h-8 w-auto max-w-[64px] object-contain"
      : tamLogo === "grande"
        ? "h-20 w-auto max-w-[140px] object-contain"
        : "h-12 w-auto max-w-[88px] object-contain"
    : tamLogo === "pequeno"
      ? "h-9 w-auto max-w-[180px] object-contain"
      : tamLogo === "grande"
        ? "h-24 w-auto max-w-[460px] object-contain"
        : "h-14 w-auto max-w-[300px] object-contain";
  const cab = vis.cabecalho || "logo-esquerda";
  const marca = (
    <span className={`flex min-w-0 items-center gap-3 ${cab === "centralizado" || cab === "menu-abaixo" ? "flex-col text-center" : ""}`}>
      {e.logo?.src ? (
        <LogoMarca
          src={e.logo.src}
          alt={e.logo.alt || e.nome || ""}
          className={classeLogo}
          inverter={logoArquivo && tintaClara(t.color_text)}
        />
      ) : null}
      {!e.logo?.src || logoArquivo ? (
        <strong className="truncate text-base tracking-wide" style={{ fontFamily: heading }}>
          {e.nome}
        </strong>
      ) : null}
      {cab === "logo-slogan" && e.slogan ? (
        <span className="hidden truncate text-xs opacity-70 sm:block">{e.slogan}</span>
      ) : null}
    </span>
  );

  function aoClicarStudio(e: React.MouseEvent) {
    if (!studio) return;
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    e.preventDefault();
  }

  return (
    <div
      style={style}
      className="overflow-hidden"
      data-preview="site"
      data-anim={vis.animacao}
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
            <button type="button" className="min-w-0 bg-transparent p-0 text-inherit" onClick={(ev) => { ev.stopPropagation(); onTrocarLogo(); }} aria-label="Trocar logo">
              {marca}
            </button>
          ) : (
            marca
          )}
          <nav className={`gap-4 text-xs opacity-80 ${cab === "menu-abaixo" && !estreito ? "flex flex-wrap" : estreito ? "hidden" : "hidden md:flex"}`}>
            {(site.header?.menu || []).slice(0, 7).map((m) => (
              <a key={m.id} href={m.href} className="hover:opacity-100">
                {m.label === "A casa" ? "Sobre" : m.label}
              </a>
            ))}
          </nav>
          {vis.agendamento ? (
            <a
              href={wa(e.whatsapp, e.whatsapp_mensagem)}
              className="px-3 py-1.5 text-xs font-semibold"
              style={{
                background: vis.botao === "sem-contorno" ? "transparent" : "var(--a)",
                color: vis.botao === "sem-contorno" ? "var(--tx)" : "var(--bg)",
                borderRadius: "var(--r)",
                border: vis.botao === "sem-contorno" ? "none" : undefined,
              }}
            >
              {site.header?.botao_agendar || "Agendar"}
            </a>
          ) : (
            <span />
          )}
        </header>
        </Bloco>

        <Bloco alvo="negocio" label="nome e frase" onEditar={onEditar} foco={foco} revelado={revelado}>
        <section id="inicio" className={`relative overflow-hidden ${rascunho ? "min-h-[280px]" : "min-h-[70vh]"}`}>
          {vis.banner !== "solido" && vis.banner !== "degrade" && site.hero?.imagem?.src ? (
            <Foto
              src={site.hero.imagem.src}
              alt={site.hero.imagem.alt || ""}
              className="absolute inset-0 h-full w-full object-cover"
              w={1920}
              h={1080}
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
          <div className={`relative mx-auto flex max-w-5xl flex-col justify-end px-4 pb-16 pt-28 md:px-8 ${rascunho ? "min-h-[280px] pt-16 pb-10" : "min-h-[70vh]"}`}>
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
              className="mt-3 max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl"
              style={{ fontFamily: heading }}
            />
            {site.hero?.subtitulo && !textosIguais(site.hero.subtitulo, site.hero.titulo) ? (
              <TextoEditavel
                as="p"
                valor={site.hero.subtitulo}
                campo="hero.subtitulo"
                onTexto={onTexto}
                multiline
                className="mt-4 max-w-xl text-base"
                style={{ color: "var(--mt)" }}
              />
            ) : null}
            {onTrocarFoto ? (
              <button
                type="button"
                className="mt-4 w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink"
                onClick={() => onTrocarFoto({ tipo: "hero" })}
              >
                Trocar foto da capa
              </button>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                id="agendar"
                href={wa(e.whatsapp, e.whatsapp_mensagem)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: "var(--a)", color: "var(--bg)", borderRadius: "var(--r)" }}
              >
                {site.hero?.botao_principal || "Agendar"}
              </a>
              <a
                href="#contato"
                className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                style={{ borderColor: "var(--s)", color: "var(--tx)", borderRadius: "var(--r)" }}
              >
                {site.hero?.botao_secundario && !textosIguais(site.hero.botao_secundario, site.hero.botao_principal)
                  ? site.hero.botao_secundario
                  : "Ver contato"}
              </a>
            </div>
          </div>
        </section>

        {rascunho ? (
        <section className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--s)" }}>
            {e.nome}
          </p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: heading }}>
            {site.sobre?.titulo || "Sobre"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: "var(--mt)" }}>
            {(site.sobre?.paragrafos && site.sobre.paragrafos[0]) ||
              "Textos e fotos entram quando você gerar o site de teste."}
          </p>
        </section>
        ) : (
        <section id="sobre" className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--s)" }}>
              {e.nome}
            </p>
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
              href={wa(e.whatsapp, e.whatsapp_mensagem)}
              className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "var(--a)", color: "var(--bg)", borderRadius: "var(--r)" }}
            >
              {site.hero?.botao_principal || "Quero agendar"}
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
                      <TextoEditavel as="span" valor={s.preco_label} campo={`srv.${i}.preco`} onTexto={onTexto} />
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
                      <a href={wa(e.whatsapp, e.whatsapp_mensagem)} className="mt-4 inline-block text-sm font-semibold underline">
                        Agendar este
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
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {(site.profissionais?.itens || []).slice(0, 6).map((p, i) =>
              p.nome && p.nome !== "Sem preferência" ? (
              <article key={p.id || p.nome} className="text-center">
                {p.foto?.src ? (
                  <Foto
                    src={p.foto.src}
                    alt={p.foto.alt || p.nome || ""}
                    className="mx-auto h-36 w-36 rounded-full object-cover"
                    w={400}
                    h={400}
                    faces
                  />
                ) : (
                  <div
                    className="mx-auto flex h-36 w-36 items-center justify-center rounded-full text-3xl font-semibold"
                    style={{ background: "var(--sf)", color: "var(--s)" }}
                  >
                    {(p.nome || "?").slice(0, 1)}
                  </div>
                )}
                <TextoEditavel as="h3" valor={p.nome} campo={`pro.${i}.nome`} onTexto={onTexto} className="mt-4 font-semibold" />
                <TextoEditavel as="p" valor={p.cargo} campo={`pro.${i}.cargo`} onTexto={onTexto} className="text-sm" style={{ color: "var(--s)" }} />
                {p.descricao ? (
                  <TextoEditavel
                    valor={p.descricao}
                    campo={`pro.${i}.descricao`}
                    onTexto={onTexto}
                    multiline
                    className="mx-auto mt-2 max-w-xs text-xs leading-5"
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
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
              {site.diferenciais?.titulo}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {(site.diferenciais?.itens || []).slice(0, 6).map((d) => (
                <article key={d.id || d.titulo} className="p-5" style={{ background: "var(--sf)", borderRadius: "var(--r)" }}>
                  <h3 className="font-semibold">{d.titulo}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }}>
                    {d.descricao}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!rascunho && (site.promocoes?.itens?.length ?? 0) > 0 ? (
          <section id="promocoes" className="px-4 py-20 md:px-8" style={{ background: "var(--sf)" }}>
            <div className="mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
                {site.promocoes?.titulo || "Promoções"}
              </h2>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {(site.promocoes?.itens || []).slice(0, 4).map((p) => (
                  <article key={p.id || p.titulo} className="overflow-hidden" style={{ background: "var(--bg)", borderRadius: "var(--r)" }}>
                    {p.imagem?.src ? (
                      <Foto src={p.imagem.src} alt={p.imagem.alt || ""} className="aspect-[16/9] w-full object-cover" w={1200} h={675} />
                    ) : null}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold">{p.titulo}</h3>
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }}>
                        {p.descricao}
                      </p>
                      {p.validade_label ? (
                        <p className="mt-3 text-xs" style={{ color: "var(--s)" }}>
                          {p.validade_label}
                        </p>
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
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
              {site.eventos?.titulo || "Eventos"}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {(site.eventos?.itens || []).slice(0, 4).map((ev) => (
                <article key={ev.id || ev.titulo} className="overflow-hidden" style={{ background: "var(--sf)", borderRadius: "var(--r)" }}>
                  {ev.imagem?.src ? (
                    <Foto src={ev.imagem.src} alt={ev.imagem.alt || ""} className="aspect-[16/9] w-full object-cover" w={1200} h={675} />
                  ) : null}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--s)" }}>
                      {[ev.data_label, ev.horario].filter(Boolean).join(" · ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{ev.titulo}</h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }}>
                      {ev.descricao}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!rascunho && (site.galeria?.itens?.length ?? 0) > 0 ? (
          <section id="galeria" className="mx-auto max-w-5xl px-4 py-20 md:px-8">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
              {site.galeria?.titulo && site.galeria.titulo !== "A casa" ? site.galeria.titulo : "O espaço"}
            </h2>
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
                    <figcaption className="mt-2 text-xs" style={{ color: "var(--mt)" }}>
                      {g.legenda}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {!rascunho && (site.faq?.itens?.length ?? 0) > 0 ? (
          <section id="faq" className="mx-auto max-w-3xl px-4 py-12 md:px-8">
            <h2 className="text-3xl font-bold">{site.faq?.titulo}</h2>
            <dl className="mt-6 space-y-4">
              {(site.faq?.itens || []).slice(0, 6).map((f, i) => (
                <div key={f.id || f.pergunta}>
                  <TextoEditavel as="dt" valor={f.pergunta} campo={`faq.${i}.pergunta`} onTexto={onTexto} className="font-semibold" />
                  <TextoEditavel
                    valor={f.resposta}
                    campo={`faq.${i}.resposta`}
                    onTexto={onTexto}
                    multiline
                    className="mt-1 text-sm"
                    style={{ color: "var(--mt)" }}
                  />
                </div>
              ))}
            </dl>
          </section>
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
            {e.endereco?.completo ? <p className="mt-6 text-base">{e.endereco.completo}</p> : null}
            {e.horario_resumo ? (
              <p className="mt-1 text-sm" style={{ color: "var(--mt)" }}>
                {e.horario_resumo}
              </p>
            ) : null}
            <a
              href={wa(e.whatsapp, e.whatsapp_mensagem)}
              className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: "var(--a)", color: "var(--bg)", borderRadius: "var(--r)" }}
            >
              Chamar no WhatsApp
            </a>
          </div>
        </section>

        <footer
          className={
            (vis.rodapeLayout || "centralizado") === "dividido"
              ? "flex flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs md:px-8"
              : (vis.rodapeLayout || "centralizado") === "empilhado"
                ? "flex flex-col items-start gap-3 px-4 py-10 text-left text-xs md:px-8"
                : (vis.rodapeLayout || "centralizado") === "minimo"
                  ? "px-4 py-4 text-center text-xs md:px-8"
                  : "px-4 py-8 text-center text-xs md:px-8"
          }
          style={{ color: "var(--mt)", background: (vis.rodapeLayout || "centralizado") === "dividido" ? "var(--sf)" : undefined }}
        >
          <p>{site.rodape?.texto || e.nome}</p>
          {(vis.rodapeLayout || "centralizado") === "minimo" ? null : site.rodape?.links?.length ? (
            <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {site.rodape.links.map((l) => (
                <a key={l.id} href={l.href} className="underline" target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noreferrer" : undefined}>
                  {l.label}
                </a>
              ))}
            </p>
          ) : null}
          {(vis.rodapeLayout || "centralizado") === "minimo" ? null : redes.length ? (
            <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {redes.map((r) => (
                <a key={r.id} href={r.url} className="underline" target="_blank" rel="noreferrer">
                  {r.label || r.id}
                </a>
              ))}
            </p>
          ) : null}
          <CreditosDoSite site={site} />
        </footer>
        </Bloco>

        {vis.whatsappFlutuante && wa(e.whatsapp) !== "#contato" && !studio ? (
          <a
            href={wa(e.whatsapp, e.whatsapp_mensagem)}
            className={`${rascunho ? "absolute" : "fixed"} bottom-5 right-5 z-40 px-4 py-3 text-sm font-semibold shadow-lg`}
            style={{ background: "#25D366", color: "#052e16", borderRadius: "var(--r)" }}
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
