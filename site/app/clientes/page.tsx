import type { Metadata } from "next";
import Link from "next/link";
import { clientes, type ClienteCaso, type FaixaPrecoCliente } from "@/lib/clientes";
import { formatarReais } from "@/lib/dinheiro";
import { planoPorId } from "@/lib/planos";

export const metadata: Metadata = {
  title: "Nossos clientes",
  description:
    "Casos reais por faixa de preço: SaaS MEI em Dia (Presença Avançada) e MOROX Industrial (Presença Personalizada).",
};

const primario =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark";
const secundario =
  "inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent";

const faixas: Array<{
  id: FaixaPrecoCliente;
  titulo: string;
  preco: string;
  texto: string;
  ancoragem: string;
}> = [
  {
    id: "avancado",
    titulo: "Presença Avançada",
    preco: formatarReais(planoPorId("avancado")?.centavos || 149_990),
    texto: "Negócios médios e SaaS com estrutura própria — catálogo, agenda ou produto digital organizado.",
    ancoragem: "faixa-avancado",
  },
  {
    id: "personalizado",
    titulo: "Presença Personalizada",
    preco: `a partir de ${formatarReais(planoPorId("personalizado")?.centavos || 299_990)}`,
    texto: "Operação complexa, fluxos sob medida e personalização profunda — valor final conforme o escopo.",
    ancoragem: "faixa-personalizado",
  },
];

function CartaoCliente({ cliente }: { cliente: ClienteCaso }) {
  const linkPainel = cliente.painelLinkUrl || cliente.appUrl || cliente.siteUrl;
  const ctaPrincipal = cliente.appUrl
    ? { href: cliente.appUrl, label: cliente.appLabel || "Abrir o app" }
    : cliente.siteUrl
      ? { href: cliente.siteUrl, label: "Ver o site" }
      : null;
  const ctaSecundario =
    cliente.appUrl && cliente.siteUrl
      ? { href: cliente.siteUrl, label: "Ver o site" }
      : null;
  const tom =
    cliente.faixa === "personalizado"
      ? {
          faixa: "border-slate-900/10 bg-slate-950 text-white",
          selo: "bg-orange-400 text-slate-950",
          corpo: "from-slate-950 via-slate-900 to-slate-800",
          texto: "text-slate-300",
          soft: "text-slate-400",
          chip: "border-white/15 bg-white/5 text-slate-200",
          aside: "border-white/10 bg-white/5",
        }
      : {
          faixa: "border-orange-200 bg-[#FFF7ED] text-ink",
          selo: "bg-accent text-white",
          corpo: "from-[#fff7ed] via-white to-[#f8fafc]",
          texto: "text-slate-600",
          soft: "text-slate-500",
          chip: "border-line bg-white text-slate-700",
          aside: "border-line bg-[#f8fafc]",
        };

  return (
    <article
      id={cliente.slug}
      className={`overflow-hidden rounded-[28px] border shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)] ${
        cliente.faixa === "personalizado" ? "border-slate-800 bg-slate-950" : "border-line bg-white"
      }`}
    >
      <div className={`border-b px-6 py-8 sm:px-10 sm:py-10 bg-gradient-to-br ${tom.corpo} ${cliente.faixa === "personalizado" ? "border-white/10" : "border-line"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tom.selo}`}>
            {cliente.precoRotulo}
          </span>
          <span className={`text-sm font-semibold ${cliente.faixa === "personalizado" ? "text-orange-300" : "text-accent"}`}>
            {cliente.segmento}
          </span>
        </div>
        <h2 className={`mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl ${cliente.faixa === "personalizado" ? "text-white" : "text-ink"}`}>
          {cliente.nome}
        </h2>
        <p className={`mt-4 max-w-3xl text-[15px] leading-7 ${tom.texto}`}>{cliente.resumo}</p>
        {cliente.marcaRegistrada ? (
          <p
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[12px] font-medium ${
              cliente.faixa === "personalizado"
                ? "border-white/20 bg-white/10 text-slate-200"
                : "border-orange-200 bg-white/90 text-slate-700"
            }`}
          >
            {cliente.marcaRegistrada}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          {ctaPrincipal ? (
            <a
              href={ctaPrincipal.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cliente.faixa === "personalizado" ? `${primario} bg-orange-400 text-slate-950 hover:bg-orange-300` : primario}
            >
              {ctaPrincipal.label}
            </a>
          ) : null}
          {ctaSecundario ? (
            <a
              href={ctaSecundario.href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                cliente.faixa === "personalizado"
                  ? "inline-flex items-center justify-center rounded-full border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-orange-300 hover:text-orange-200"
                  : secundario
              }
            >
              {ctaSecundario.label}
            </a>
          ) : null}
        </div>
        <p className={`mt-4 text-sm ${tom.soft}`}>
          {cliente.appUrl ? (
            <>
              SaaS:{" "}
              <a
                href={cliente.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium underline-offset-2 hover:underline ${cliente.faixa === "personalizado" ? "text-white" : "text-ink"}`}
              >
                {cliente.appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </>
          ) : null}
          {cliente.appUrl && cliente.siteUrl ? " · " : null}
          {cliente.siteUrl ? (
            <>
              Site:{" "}
              <a
                href={cliente.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium underline-offset-2 hover:underline ${cliente.faixa === "personalizado" ? "text-white" : "text-ink"}`}
              >
                {cliente.siteLabel || cliente.siteUrl.replace(/^https?:\/\//, "")}
              </a>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h3 className={`text-xl font-semibold tracking-[-0.02em] ${cliente.faixa === "personalizado" ? "text-white" : "text-ink"}`}>
            O que foi construído
          </h3>
          <p className={`mt-4 text-[15px] leading-7 ${tom.texto}`}>{cliente.detalhe}</p>
          <ul className="mt-6 space-y-3">
            {cliente.destaques.map((item) => (
              <li key={item} className={`flex gap-3 text-[14px] leading-6 ${tom.texto}`}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {cliente.painelTitulo ? (
          <aside className={`rounded-2xl border p-6 ${tom.aside}`}>
            <h3 className={`text-lg font-semibold tracking-[-0.02em] ${cliente.faixa === "personalizado" ? "text-white" : "text-ink"}`}>
              {cliente.painelTitulo}
            </h3>
            {cliente.painelTexto ? <p className={`mt-2 text-sm leading-6 ${tom.texto}`}>{cliente.painelTexto}</p> : null}
            {cliente.painelItens?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {cliente.painelItens.map((nome) => (
                  <span key={nome} className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${tom.chip}`}>
                    {nome}
                  </span>
                ))}
              </div>
            ) : null}
            <a
              href={linkPainel}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex text-sm font-semibold text-accent transition hover:text-accent-dark"
            >
              {cliente.painelLinkLabel || "Conferir no ar →"}
            </a>
          </aside>
        ) : null}
      </div>
    </article>
  );
}

export default function ClientesPage() {
  return (
    <main className="bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_36%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Portfólio</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">Nossos clientes</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Exemplos reais no ar, separados pela faixa de preço do GuiX.net — da Presença Avançada à Personalizada.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {faixas.map((f) => (
            <a
              key={f.id}
              href={`#${f.ancoragem}`}
              className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{f.titulo}</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">{f.preco}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.texto}</p>
            </a>
          ))}
        </div>

        <div className="mt-14 space-y-14">
          {faixas.map((f) => {
            const lista = clientes.filter((c) => c.faixa === f.id);
            if (!lista.length) return null;
            return (
              <section key={f.id} id={f.ancoragem} className="scroll-mt-28 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{f.titulo}</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl">
                      Exemplo nesta faixa · {f.preco}
                    </h2>
                  </div>
                  <Link href={`/#precos`} className="text-sm font-semibold text-accent underline">
                    Ver este plano nos preços
                  </Link>
                </div>
                {lista.map((cliente) => (
                  <CartaoCliente key={cliente.slug} cliente={cliente} />
                ))}
              </section>
            );
          })}
        </div>

        <section className="mt-16 rounded-[24px] border border-line bg-white px-6 py-8 sm:px-8">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Quer ser o próximo?</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
            Domínio, e-mail, site, agenda e WhatsApp — ou um produto digital sob medida, como o MEI em Dia (Avançada) e o
            MOROX (Personalizada). Conte o que o seu negócio precisa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contratar?plano=avancado" className={primario}>
              Quero Presença Avançada
            </Link>
            <Link href="/#precos" className={secundario}>
              Ver todos os preços
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
