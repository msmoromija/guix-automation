import Link from "next/link";
import { notFound } from "next/navigation";
import { nichoPorSlug, nichos } from "@/lib/nichos";

export function generateStaticParams() {
  return nichos.map((item) => ({ nicho: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ nicho: string }> }) {
  const { nicho } = await params;
  const item = nichoPorSlug(nicho);
  if (!item) return { title: "Exemplo" };
  return {
    title: `${item.negocio} · modelo GuiX`,
    description: `Veja o modelo de ${item.nome} e gere seu protótipo antes de pagar.`,
  };
}

export default async function ExemploModeloPage({
  params,
}: {
  params: Promise<{ nicho: string }>;
}) {
  const { nicho } = await params;
  const item = nichoPorSlug(nicho);
  if (!item) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">
              Modelo GuiX · {item.nome}
            </p>
            <p className="truncate text-sm text-slate-300">{item.negocio}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/prototipar?nicho=${item.slug}`}
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-orange-300"
            >
              Usar este modelo
            </Link>
            <Link
              href={`/contratar?plano=simples&nicho=${item.slug}`}
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Contratar
            </Link>
            <Link href="/#exemplos" className="rounded-full px-3 py-2 text-sm text-slate-400 hover:text-white">
              Outros
            </Link>
          </div>
        </div>
      </header>

      <p className="border-b border-white/10 bg-slate-900 px-4 py-2 text-center text-xs text-slate-400">
        Demonstração pública. Gere um protótipo com o nome do seu negócio — grátis, antes de pagar — e baixe o{" "}
        <code className="text-orange-200">site.json</code>.
      </p>

      <iframe
        title={`Demonstração ${item.negocio}`}
        src={`/casas/${item.slug}/`}
        className="min-h-[calc(100vh-7.5rem)] w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
