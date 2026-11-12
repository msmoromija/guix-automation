"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contato, linkWhatsapp } from "@/lib/contato";
import { marca } from "@/lib/marca";
import { navegacao } from "@/lib/navegacao";
import { JogoDaVelha } from "@/components/JogoDaVelha";

export function Footer() {
  const path = usePathname() || "";
  if (
    path.startsWith("/p/") ||
    path.startsWith("/exemplos/") ||
    path.startsWith("/conta/") ||
    path.startsWith("/visualizar/") ||
    path.startsWith("/prototipar")
  )
    return null;

  const meio = Math.ceil(navegacao.length / 2);
  const navEsq = navegacao.slice(0, meio);
  const navDir = navegacao.slice(meio);

  return (
    <footer className="chrome-fade border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.9fr] lg:items-start lg:gap-12">
          <div>
            <Link href="/" aria-label={`${marca.nome}, início`}>
              <img src="/midia/logo-estatico.webp" alt="" className="logo-marca h-9 w-auto" />
            </Link>
            <p className="mt-3 max-w-[16rem] text-sm leading-6 text-muted">
              Presença digital completa em até 24 horas.
            </p>
          </div>

          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted">
            <ul className="flex flex-col gap-2">
              {navEsq.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-2">
              {navDir.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-2 text-sm text-muted sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">Contato</p>
            <a href={linkWhatsapp()} className="hover:text-ink">
              WhatsApp {contato.whatsappExibicao}
            </a>
            <a href={`mailto:${contato.email}`} className="hover:text-ink">
              {contato.email}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {marca.nome}. Todos os direitos reservados.
          </p>
          <div className="opacity-80">
            <JogoDaVelha />
          </div>
        </div>
      </div>
    </footer>
  );
}
