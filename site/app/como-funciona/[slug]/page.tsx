import Link from "next/link";
import { notFound } from "next/navigation";
import { passos, passoPorSlug } from "@/lib/passos";

export function generateStaticParams() {
  return passos.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = passoPorSlug(slug);
  if (!item) return { title: "Como funciona" };
  return { title: item.titulo, description: item.resumo };
}

export default async function PassoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = passoPorSlug(slug);
  if (!item) notFound();

  const outros = passos.filter((entrada) => entrada.slug !== item.slug);

  return (
    <main className="bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_36%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <Link href="/#como-funciona" className="text-sm font-medium text-slate-600 transition hover:text-ink">
          ← Voltar a como funciona
        </Link>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-accent shadow-sm">
              {item.numero}
            </p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Como funciona</p>
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
                href="/#produto"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
              >
                Ver o que está incluso
              </Link>
            </div>
          </div>

          <aside className="rounded-[24px] border border-line bg-white p-6 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.35)] sm:p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Neste passo</h2>
            <ul className="mt-5 space-y-4">
              {item.pontos.map((ponto) => (
                <li key={ponto} className="flex gap-3 text-[14px] leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-sm leading-6 text-slate-700">
              Do pedido à publicação: informações, configuração, ar em até 24 horas e controle pelo painel.
            </p>
          </aside>
        </div>

        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Os outros passos</h2>
          <p className="mt-2 text-[15px] text-slate-600">A mesma jornada, em quatro momentos.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {outros.map((entrada) => (
              <Link
                key={entrada.slug}
                href={`/como-funciona/${entrada.slug}`}
                className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_36px_-18px_rgba(15,23,42,0.3)]"
              >
                <p className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-xs font-semibold text-accent">
                  {entrada.numero}
                </p>
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
