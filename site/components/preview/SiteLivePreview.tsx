"use client";

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
  };
  tema?: {
    color_primary?: string;
    color_secondary?: string;
    color_accent?: string;
    color_background?: string;
    color_surface?: string;
    color_text?: string;
    color_text_muted?: string;
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

/** Vitrine ao vivo a partir do site.json do cliente. */
export function SiteLivePreview({ site }: { site: Site }) {
  const t = site.tema || {};
  const e = site.empresa || {};
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

  return (
    <div
      style={style}
      className="overflow-hidden"
      data-preview="site"
    >
      <div
        style={{
          background: "var(--bg)",
          color: "var(--tx)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
          <span className="flex min-w-0 items-center gap-2">
            {e.logo?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.logo.src} alt={e.logo.alt || e.nome || ""} className="h-8 w-8 object-contain" />
            ) : null}
            <strong className="truncate text-sm tracking-wide">{e.nome}</strong>
          </span>
          <nav className="hidden gap-4 text-xs opacity-80 md:flex">
            {(site.header?.menu || []).slice(0, 6).map((m) => (
              <a key={m.id} href={m.href} className="hover:opacity-100">
                {m.label}
              </a>
            ))}
          </nav>
          <a
            href="#agendar"
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--a)", color: "var(--bg)" }}
          >
            {site.header?.botao_agendar || "Agendar"}
          </a>
        </header>

        <section id="inicio" className="relative min-h-[70vh] overflow-hidden">
          {site.hero?.imagem?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.hero.imagem.src}
              alt={site.hero.imagem.alt || ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "var(--sf)" }} />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, var(--bg), color-mix(in srgb, var(--bg) 55%, transparent), transparent)",
            }}
          />
          <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-end px-4 pb-12 pt-24 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--s)" }}>
              {e.slogan}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl">{site.hero?.titulo}</h1>
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

        <section id="sobre" className="mx-auto grid max-w-5xl gap-8 px-4 py-16 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="text-3xl font-bold">{site.sobre?.titulo}</h2>
            {(site.sobre?.paragrafos || []).map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 text-sm leading-6" style={{ color: "var(--mt)" }}>
                {p}
              </p>
            ))}
          </div>
          {site.sobre?.imagem?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.sobre.imagem.src}
              alt={site.sobre.imagem.alt || ""}
              className="h-80 w-full object-cover"
              style={{ borderRadius: "var(--r)" }}
            />
          ) : null}
        </section>

        <section id="servicos" className="px-4 py-12 md:px-8" style={{ background: "var(--sf)" }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold">{site.servicos?.titulo}</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--mt)" }}>
              {site.servicos?.subtitulo}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(site.servicos?.itens || []).slice(0, 6).map((s) => (
                <article
                  key={s.id || s.nome}
                  className="overflow-hidden"
                  style={{ background: "var(--bg)", borderRadius: "var(--r)" }}
                >
                  {s.imagem?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imagem.src} alt={s.imagem.alt || ""} className="aspect-[16/10] w-full object-cover" />
                  ) : null}
                  <div className="p-4">
                    <h3 className="font-semibold">{s.nome}</h3>
                    <p className="mt-2 text-xs leading-5" style={{ color: "var(--mt)" }}>
                      {s.descricao}
                    </p>
                    <p className="mt-3 text-sm" style={{ color: "var(--s)" }}>
                      {s.preco_label} · {s.duracao_label}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="profissionais" className="mx-auto max-w-5xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-bold">{site.profissionais?.titulo}</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--mt)" }}>
            {site.profissionais?.subtitulo}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {(site.profissionais?.itens || []).slice(0, 6).map((p) => (
              <article key={p.id || p.nome} className="text-center">
                {p.foto?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto.src}
                    alt={p.foto.alt || p.nome || ""}
                    className="mx-auto h-36 w-36 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="mx-auto flex h-36 w-36 items-center justify-center rounded-full text-2xl"
                    style={{ background: "var(--sf)" }}
                  >
                    {(p.nome || "?").slice(0, 1)}
                  </div>
                )}
                <h3 className="mt-3 font-semibold">{p.nome}</h3>
                <p className="text-xs" style={{ color: "var(--s)" }}>
                  {p.cargo}
                </p>
              </article>
            ))}
          </div>
        </section>

        {(site.galeria?.itens?.length ?? 0) > 0 ? (
          <section id="galeria" className="mx-auto max-w-5xl px-4 py-12 md:px-8">
            <h2 className="text-3xl font-bold">{site.galeria?.titulo || "Galeria"}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {(site.galeria?.itens || []).slice(0, 6).map((g) => (
                <figure key={g.id || g.legenda}>
                  {g.imagem?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.imagem.src}
                      alt={g.imagem.alt || g.legenda || ""}
                      className="aspect-square w-full object-cover"
                      style={{ borderRadius: "var(--r)" }}
                    />
                  ) : null}
                  {g.legenda ? (
                    <figcaption className="mt-1 text-xs" style={{ color: "var(--mt)" }}>
                      {g.legenda}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {(site.faq?.itens?.length ?? 0) > 0 ? (
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

        <section id="contato" className="px-4 py-16 md:px-8" style={{ background: "var(--sf)" }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold">{site.contato?.titulo || "Contato"}</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--mt)" }}>
              {site.contato?.subtitulo}
            </p>
            <p className="mt-4 text-sm">{e.endereco?.completo}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--mt)" }}>
              {e.horario_resumo}
            </p>
            <a
              href={wa(e.whatsapp, e.whatsapp_mensagem)}
              className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "var(--a)", color: "var(--bg)" }}
            >
              Chamar no WhatsApp
            </a>
          </div>
        </section>

        <footer className="px-4 py-8 text-center text-xs md:px-8" style={{ color: "var(--mt)" }}>
          <p>{site.rodape?.texto || e.nome}</p>
          <CreditosDoSite site={site} />
        </footer>
      </div>
    </div>
  );
}
