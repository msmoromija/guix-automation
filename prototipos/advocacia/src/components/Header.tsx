import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const { empresa, header } = site;
  return (
    <header
      data-section="header"
      className="sticky top-0 z-40 border-b border-site-line bg-site-bg/95 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {empresa.logo.src ? (
            <img src={empresa.logo.src} alt={empresa.logo.alt} className="h-8 w-auto" />
          ) : (
            <span data-field="empresa.nome" className="font-heading text-xl text-site-primary">
              {empresa.nome}
            </span>
          )}
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {header.menu.map((m) => (
            <a key={m.id} href={casaHref(m.href)} className="text-sm text-site-muted hover:text-site-primary">
              {m.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" data-field="header.botao_agendar" className="btn-primary hidden min-h-10 px-4 text-sm sm:inline-flex">
            {header.botao_agendar}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border border-site-line text-site-primary lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={header.menu[0]?.label ?? empresa.nome}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-mobile" className="border-t border-site-line bg-site-surface lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-3">
            {header.menu.map((m) => (
              <li key={m.id}>
                <a href={casaHref(m.href)} onClick={() => setOpen(false)} className="block border-b border-site-line py-3 font-heading text-lg text-site-primary last:border-0">
                  {m.label}
                </a>
              </li>
            ))}
            <li className="pt-4 pb-2">
              <Link to="/agendar" data-action="agendar" onClick={() => setOpen(false)} className="btn-primary w-full">
                {header.botao_agendar}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
