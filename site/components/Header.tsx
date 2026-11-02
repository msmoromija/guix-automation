"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navegacao } from "@/lib/navegacao";
import { LogoMarca } from "./LogoMarca";

const botao = "rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark";

export function Header() {
  const path = usePathname() || "";
  const ocultar = path.startsWith("/p/") || path.startsWith("/exemplos/");
  const [aberto, setAberto] = useState(false);
  const [sombra, setSombra] = useState(false);

  useEffect(() => {
    const aoRolar = () => setSombra(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  if (ocultar) return null;

  return (
    <header
      className={`chrome-fade sticky top-0 z-40 border-b border-line ${sombra ? "shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)]" : ""}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <span onClick={() => setAberto(false)}>
          <LogoMarca />
        </span>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          {navegacao.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
          <Link href="/contratar" className={botao}>
            Quero meu site
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/contratar" className={botao}>
            Quero meu site
          </Link>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-2 text-sm font-medium"
            aria-expanded={aberto}
            onClick={() => setAberto((valor) => !valor)}
          >
            {aberto ? "Fechar" : "Menu"}
          </button>
        </div>
      </div>
      {aberto ? (
        <nav className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm font-medium md:hidden">
          {navegacao.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setAberto(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
