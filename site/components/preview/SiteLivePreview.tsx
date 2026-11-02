"use client";

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
  rodape?: { texto?: string };
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

function wa(digitos?: string, msg?: string) {
  if (!digitos) return "#contato";
  const text = encodeURIComponent(msg || "Olá, vim pelo site.");
  return `https://wa.me/${digitos}?text=${text}`;
}

function Foto({
  src,
  alt,
  className,
  style,
  w,
  h,
  faces,
}: {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  w: number;
  h: number;
  faces?: boolean;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={enquadrarFoto(src, w, h, faces) || src} alt={alt || ""} className={`gx-photo ${className || ""}`} style={style} />
  );
}

/** Vitrine ao vivo a partir do site.json do cliente. */
export function SiteLivePreview({
  site,
  visual,
  modo = "pagina",
}: {
  site: Site;
  visual?: VisualConfig;
  modo?: "pagina" | "rascunho";
}) {
  const rascunho = modo === "rascunho";
  const vis = visual || visualPadrao();
  const t = site.tema || {};
  const e = site.empresa || {};
  const heading = t.font_heading || "Oswald";
  const body = t.font_body || "Manrope";
  const redes = (e.redes || []).filter((r) => {
    if (r.id === "instagram") return vis.instagram;
    if (r.id === "facebook") return vis.facebook;
    if (r.id === "tiktok") return vis.tiktok;
    if (r.id === "youtube") return vis.youtube;
    return true;
  });
  if (vis.linkedin && vis.linkedinUrl) {
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

  const marca = (
    <span className={`flex min-w-0 items-center gap-2 ${vis.cabecalho === "centralizado" ? "flex-col text-center" : ""}`}>
      {e.logo?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.logo.src} alt={e.logo.alt || e.nome || ""} className="h-9 max-w-[160px] object-contain" />
      ) : (
        <strong className="truncate text-sm tracking-wide" style={{ fontFamily: heading }}>
          {e.nome}
        </strong>
      )}
      {vis.cabecalho === "logo-slogan" && e.slogan ? (
        <span className="hidden truncate text-xs opacity-70 sm:block">{e.slogan}</span>
      ) : e.logo?.src ? (
        <strong className="truncate text-sm tracking-wide" style={{ fontFamily: heading }}>
          {e.nome}
        </strong>
      ) : null}
    </span>
  );

  return (
    <div style={style} className="overflow-hidden" data-preview="site" data-anim={vis.animacao}>
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
        <header
          className={`flex items-center gap-3 px-4 py-3 md:px-8 ${
            vis.cabecalho === "centralizado" ? "flex-col justify-center text-center" : "justify-between"
          }`}
        >
          {marca}
          <nav className="hidden gap-4 text-xs opacity-80 md:flex">
            {(site.header?.menu || []).slice(0, 6).map((m) => (
              <a key={m.id} href={m.href} className="hover:opacity-100">
                {m.label}
              </a>
            ))}
          </nav>
          {vis.agendamento ? (
            <a
              href="#agendar"
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

        <section id="inicio" className={`relative overflow-hidden ${rascunho ? "min-h-[280px]" : "min-h-[82vh]"}`}>
          {vis.banner !== "solido" && vis.banner !== "degrade" && site.hero?.imagem?.src ? (
            <Foto
              src={site.hero.imagem.src}
              alt={site.hero.imagem.alt || ""}
              className="absolute inset-0 h-full w-full object-cover"
              w={1920}
              h={1080}
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
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, var(--bg), color-mix(in srgb, var(--bg) 55%, transparent), transparent)",
            }}
          />
          <div className={`relative mx-auto flex max-w-5xl flex-col justify-end px-4 pb-16 pt-28 md:px-8 ${rascunho ? "min-h-[280px] pt-16 pb-10" : "min-h-[82vh]"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--s)" }}>
              {e.slogan}
            </p>
            <h1
              className="mt-3 max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl"
              style={{ fontFamily: heading }}
            >
              {site.hero?.titulo}
            </h1>
            <p className="mt-4 max-w-xl text-base" style={{ color: "var(--mt)" }}>
              {site.hero?.subtitulo}
            </p>
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
                href={wa(e.whatsapp, e.whatsapp_mensagem)}
                className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                style={{ borderColor: "var(--s)", color: "var(--tx)", borderRadius: "var(--r)" }}
              >
                {site.hero?.botao_secundario || "WhatsApp"}
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
            <h2 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
              {site.sobre?.titulo}
            </h2>
            {(site.sobre?.paragrafos || []).map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 text-sm leading-7 md:text-base" style={{ color: "var(--mt)" }}>
                {p}
              </p>
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
              />
            </div>
          ) : null}
        </section>
        )}

        <section id="servicos" className={`px-4 md:px-8 ${rascunho ? "py-10" : "py-20"}`} style={{ background: "var(--sf)" }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
              {site.servicos?.titulo}
            </h2>
            <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--mt)" }}>
              {site.servicos?.subtitulo}
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(site.servicos?.itens || []).slice(0, 6).map((s, i) => (
                <article
                  key={s.id || s.nome}
                  className={`gx-card-in overflow-hidden ${i === 0 && !rascunho ? "sm:col-span-2 lg:col-span-1" : ""}`}
                  style={{ background: "var(--bg)", borderRadius: "var(--r)" }}
                >
                  {s.imagem?.src ? (
                    <div className="gx-photo-frame aspect-[16/10] w-full">
                      <Foto src={s.imagem.src} alt={s.imagem.alt || ""} className="h-full w-full object-cover" w={1200} h={750} />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold">{s.nome}</h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--mt)" }}>
                      {s.descricao}
                    </p>
                    <p className="mt-4 text-xl font-bold" style={{ color: "var(--s)" }}>
                      {s.preco_label}
                      {s.duracao_label ? (
                        <span className="ml-2 text-sm font-normal opacity-80">{s.duracao_label}</span>
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

        {equipeVisivel.length ? (
        <section id="profissionais" className="mx-auto max-w-5xl px-4 py-20 md:px-8">
          <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
            {site.profissionais?.titulo}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--mt)" }}>
            {site.profissionais?.subtitulo}
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {equipeVisivel.slice(0, 6).map((p) => (
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
                <h3 className="mt-4 font-semibold">{p.nome}</h3>
                <p className="text-sm" style={{ color: "var(--s)" }}>
                  {p.cargo}
                </p>
                {p.descricao ? (
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-5" style={{ color: "var(--mt)" }}>
                    {p.descricao}
                  </p>
                ) : null}
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
              {(site.galeria?.itens || []).slice(0, 6).map((g) => (
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
              {(site.faq?.itens || []).slice(0, 6).map((f) => (
                <div key={f.id || f.pergunta}>
                  <dt className="font-semibold">{f.pergunta}</dt>
                  <dd className="mt-1 text-sm" style={{ color: "var(--mt)" }}>
                    {f.resposta}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section id="contato" className="px-4 py-20 md:px-8" style={{ background: "var(--sf)" }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: heading }}>
              {site.contato?.titulo || "Onde estamos"}
            </h2>
            <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--mt)" }}>
              {site.contato?.subtitulo}
            </p>
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

        <footer className="px-4 py-8 text-center text-xs md:px-8" style={{ color: "var(--mt)" }}>
          <p>{site.rodape?.texto || e.nome}</p>
          {redes.length ? (
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

        {vis.whatsappFlutuante && e.whatsapp ? (
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
