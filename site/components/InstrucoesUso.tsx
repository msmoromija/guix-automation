import Link from "next/link";
import { passosUso } from "@/lib/instrucoes-uso";

export function InstrucoesUso({
  titulo = "Como funciona, do começo ao domínio",
  compacto = false,
  mostrarAtalhos = true,
}: {
  titulo?: string;
  compacto?: boolean;
  mostrarAtalhos?: boolean;
}) {
  return (
    <section className={compacto ? "rounded-2xl border border-line bg-white p-5" : "rounded-[28px] border border-line bg-white p-6 sm:p-8"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Instruções de uso</p>
      <h2 className={`mt-2 font-bold tracking-[-0.03em] text-ink ${compacto ? "text-lg" : "text-2xl sm:text-3xl"}`}>
        {titulo}
      </h2>
      <ol className={`mt-5 space-y-4 ${compacto ? "text-sm" : "text-[15px]"} leading-7 text-slate-700`}>
        {passosUso.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-xs font-bold text-accent">
              {p.n}
            </span>
            <span>
              <strong className="text-ink">{p.titulo}.</strong> {p.texto}
            </span>
          </li>
        ))}
      </ol>
      {mostrarAtalhos ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/prototipar" className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
            Prototipar agora
          </Link>
          <Link href="/visualizar" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink">
            Abrir meu rascunho
          </Link>
          <Link href="/contratar" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink">
            Comprar com domínio
          </Link>
          <Link href="/#faq" className="rounded-full px-4 py-2.5 text-sm font-semibold text-accent underline">
            Ver FAQ
          </Link>
        </div>
      ) : null}
    </section>
  );
}
