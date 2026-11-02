import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content";

export function Header() {
  const [open, setOpen] = useState(false);
  const { empresa, header } = site;
  const item = (href: string) => casaHref(href);
  return (
    <header data-section="header" className="sticky top-0 z-40 border-b bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center" data-field="empresa.nome">
          {empresa.logo.src ? (
            <img src={empresa.logo.src} alt={empresa.logo.alt} className="h-9 w-auto" />
          ) : (
            <span className="font-display text-xl text-brand">{empresa.nome}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {header.menu.map((m) => (
            <a key={m.id} href={item(m.href)} className="text-sm text-ink-muted hover:text-brand" data-field={`header.menu.${m.id}`}>
              {m.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" className="btn-primary hidden !min-h-10 !px-4 text-sm sm:inline-flex" data-field="header.botao_agendar">
            {header.botao_agendar}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-ui border text-brand lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={header.menu[0]?.label ?? empresa.nome}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-mobile" className="border-t bg-paper px-5 pb-6 pt-2 lg:hidden">
          {header.menu.map((m) => (
            <a key={m.id} href={item(m.href)} onClick={() => setOpen(false)} className="block border-b py-3 text-ink">
              {m.label}
            </a>
          ))}
          <Link to="/agendar" data-action="agendar" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
            {header.botao_agendar}
          </Link>
        </nav>
      )}
    </header>
  );
}
