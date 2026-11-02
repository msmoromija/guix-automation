import Link from "next/link";
import { notFound } from "next/navigation";
import { tintaSobre } from "@/lib/cor";
import { nichos, nichoPorSlug } from "@/lib/nichos";

export function generateStaticParams() {
  return nichos.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exemplo = nichoPorSlug(slug);
  if (!exemplo) return { title: "Exemplo" };
  return { title: exemplo.negocio, description: exemplo.frase };
}

export default async function NichoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exemplo = nichoPorSlug(slug);
  if (!exemplo) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <Link href="/#exemplos" className="text-sm font-medium text-muted hover:text-ink">
        Todos os exemplos
      </Link>
      <div className="mt-6 grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-accent">{exemplo.nome.toUpperCase()}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">{exemplo.negocio}</h1>
          <p className="mt-4 text-lg text-muted">{exemplo.frase}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">{exemplo.detalhe}</p>
          <p className="mt-3 text-sm text-muted">{exemplo.lugar}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={exemplo.demo}
              className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Ver demonstração
            </a>
            <Link
              href={`/prototipar?nicho=${exemplo.slug}`}
              className="inline-flex rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Usar este modelo
            </Link>
            <Link
              href={`/contratar?plano=simples&nicho=${exemplo.slug}`}
              className="inline-flex rounded-full px-5 py-3 text-sm font-semibold text-accent underline"
            >
              Contratar
            </Link>
          </div>
          <p className="mt-4 max-w-sm text-xs leading-5 text-muted">
            Prototipe grátis com o nome do seu negócio e baixe o site.json antes de pagar. Na entrega
            entram domínio, e-mail profissional e publicação em até 24 horas.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgb(15_23_42_/_0.06)]">
          <div className="border-b border-line px-4 py-3 text-xs text-muted">{exemplo.negocio}</div>
          <div className="min-h-[320px] p-8" style={{ background: exemplo.tema.fundo, color: exemplo.tema.tinta }}>
            <p className="text-sm opacity-70">{exemplo.lugar}</p>
            <p className="mt-8 max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-0.03em]">{exemplo.frase}</p>
            <span
              className="mt-8 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: exemplo.tema.acento, color: tintaSobre(exemplo.tema.acento) }}
            >
              Agendar
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
