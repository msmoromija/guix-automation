import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoModelo } from "@/components/exemplos/DemoModelo";
import { carregarExemplo } from "@/lib/automacao/carregar-exemplo";
import type { Nicho as NichoMedia } from "@/lib/media/tipos";
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
    description: `Veja o modelo de ${item.nome} com agenda online: nome, telefone, e-mail e horário reservado no site.`,
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

  let site: Record<string, unknown>;
  try {
    site = await carregarExemplo(nicho as NichoMedia);
  } catch {
    notFound();
  }

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
            <a
              href="#agendar"
              className="rounded-full border border-orange-300/50 bg-orange-400/15 px-4 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-400/25"
            >
              Ir para Agendar
            </a>
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

      <DemoModelo nicho={item.slug} site={site as Parameters<typeof DemoModelo>[0]["site"]} />
    </div>
  );
}
