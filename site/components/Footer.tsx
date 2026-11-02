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

  return (
    <footer className="chrome-fade border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label={`${marca.nome}, início`}>
            <img src="/midia/logo-estatico.webp" alt="" className="logo-marca h-10 w-auto" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">Presença digital completa em até 24 horas.</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-muted">
          {navegacao.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <a href={linkWhatsapp()} className="hover:text-ink">
            WhatsApp {contato.whatsappExibicao}
          </a>
          <a href={`mailto:${contato.email}`} className="hover:text-ink">
            {contato.email}
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
          <p className="text-xs text-muted">© {new Date().getFullYear()} {marca.nome}. Todos os direitos reservados.</p>
          <JogoDaVelha />
        </div>
      </div>
    </footer>
  );
}
