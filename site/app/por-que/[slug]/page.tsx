import Link from "next/link";
import { notFound } from "next/navigation";
import { diferenciais, diferencialPorSlug } from "@/lib/diferenciais";

export function generateStaticParams() {
  return diferenciais.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = diferencialPorSlug(slug);
  if (!item) return { title: "Por que o GuiX.net" };
  return { title: item.titulo, description: item.resumo };
}

export default async function DiferencialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = diferencialPorSlug(slug);
  if (!item) notFound();

  const outros = diferenciais.filter((entrada) => entrada.slug !== item.slug);

  return (
    <main className="bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_42%,#f8fafc_42%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <Link href="/#por-que" className="text-sm font-medium text-slate-300 transition hover:text-white">
          ← Voltar a por que o GuiX.net
        </Link>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">{item.numero} · Por que o GuiX.net</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">{item.titulo}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{item.resumo}</p>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-300">{item.detalhe}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contratar"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
              >
                Quero meu site
              </Link>
              <Link
                href="/#precos"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-orange-300/50"
              >
                Ver preços
              </Link>
            </div>
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-white p-6 text-ink shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] sm:p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Na prática</h2>
            <ul className="mt-5 space-y-4">
              {item.pontos.map((ponto) => (
                <li key={ponto} className="flex gap-3 text-[14px] leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-sm leading-6 text-slate-700">
              Não é agência. Não é mensalidade. É presença pronta — domínio, e-mail, site, agenda e WhatsApp.
            </p>
          </aside>
        </div>

        <section className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Os outros motivos</h2>
          <p className="mt-2 text-[15px] text-slate-600">A mesma proposta, em seis argumentos.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {outros.map((entrada) => (
              <Link
                key={entrada.slug}
                href={`/por-que/${entrada.slug}`}
                className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-accent/40"
              >
                <p className="text-[11px] font-semibold tracking-[0.14em] text-accent">{entrada.numero}</p>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{entrada.titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{entrada.texto}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
