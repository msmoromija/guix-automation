import Link from "next/link";
import { notFound } from "next/navigation";
import { Icone } from "@/components/Icones";
import { produtos, produtoPorSlug } from "@/lib/produto";

export function generateStaticParams() {
  return produtos.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = produtoPorSlug(slug);
  if (!item) return { title: "Produto" };
  return { title: item.titulo, description: item.resumo };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = produtoPorSlug(slug);
  if (!item) notFound();

  const outros = produtos.filter((entrada) => entrada.slug !== item.slug);

  return (
    <main className="bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_36%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <Link href="/#produto" className="text-sm font-medium text-slate-600 transition hover:text-ink">
          ← Voltar ao produto
        </Link>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="feature-icon inline-flex h-14 w-14 items-center justify-center rounded-2xl text-accent">
              <Icone nome={item.icone} />
            </span>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Incluso na presença</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">{item.titulo}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{item.resumo}</p>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-600">{item.detalhe}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contratar"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
              >
                Quero meu site
              </Link>
              <Link
                href="/#exemplos"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
              >
                Ver exemplos reais
              </Link>
            </div>
          </div>

          <aside className="rounded-[24px] border border-line bg-white p-6 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.35)] sm:p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">O que você recebe</h2>
            <ul className="mt-5 space-y-4">
              {item.pontos.map((ponto) => (
                <li key={ponto} className="flex gap-3 text-[14px] leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-sm leading-6 text-slate-700">
              Tudo isso entra na mesma entrega: domínio, e-mail, site, agenda e WhatsApp, publicados em até 24 horas.
            </p>
          </aside>
        </div>

        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Outras partes da presença</h2>
          <p className="mt-2 text-[15px] text-slate-600">O mesmo sistema, em cinco peças que trabalham juntas.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {outros.map((entrada) => (
              <Link
                key={entrada.slug}
                href={`/produto/${entrada.slug}`}
                className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_36px_-18px_rgba(15,23,42,0.3)]"
              >
                <span className="feature-icon inline-flex h-10 w-10 items-center justify-center rounded-xl text-accent">
                  <Icone nome={entrada.icone} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{entrada.titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{entrada.texto}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
