import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content";

export function Header() {
  const [open, setOpen] = useState(false);
  const { empresa, header } = site;
  return (
    <header data-section="header" className="sticky top-0 z-40 border-b border-secondary/20 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="font-heading text-2xl font-semibold text-primary" data-field="empresa.nome">
          {empresa.logo.src ? <img src={empresa.logo.src} alt={empresa.logo.alt} className="h-9 w-auto" /> : empresa.nome}
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {header.menu.map((m, i) => (
            <a key={m.id} href={casaHref(m.href)} data-field={`header.menu.${i}.label`} className="text-sm text-text-muted hover:text-primary">
              {m.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" data-field="header.botao_agendar" className="btn-primary hidden min-h-10 px-4 text-sm sm:inline-flex">
            {header.botao_agendar}
          </Link>
          <button type="button" aria-expanded={open} aria-controls="menu-mobile" aria-label={header.menu[0]?.label ? "Menu" : "Menu"} onClick={() => setOpen((v) => !v)} className="rounded-site line p-2 text-primary lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-mobile" className="border-t border-secondary/20 bg-surface px-5 py-3 lg:hidden">
          {header.menu.map((m, i) => (
            <a key={m.id} href={casaHref(m.href)} onClick={() => setOpen(false)} data-field={`header.menu.${i}.label`} className="block py-3 text-base text-primary">
              {m.label}
            </a>
          ))}
          <Link to="/agendar" data-action="agendar" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
            {header.botao_agendar}
          </Link>
        </nav>
      )}
    </header>
  );
}
