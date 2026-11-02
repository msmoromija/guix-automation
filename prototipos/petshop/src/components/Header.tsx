import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content/site";

export function Wordmark() {
  const { logo, nome } = site.empresa;
  return logo.src ? (
    <img src={logo.src} alt={logo.alt} className="h-9 w-auto" />
  ) : (
    <span data-field="empresa.nome" className="font-display text-xl font-bold text-brand">
      {nome}
    </span>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const href = (h: string) => casaHref(h);

  return (
    <header data-section="header" className="sticky top-0 z-40 border-b bg-page/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/"><Wordmark /></Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {site.header.menu.map((m, i) => (
            <a key={m.id} href={href(m.href)} data-field={`header.menu.${i}.label`} className="text-sm font-semibold text-ink-muted hover:text-brand">
              {m.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" data-field="header.botao_agendar" className="btn-primary min-h-10 px-4 text-sm">
            {site.header.botao_agendar}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-site border text-brand lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-mobile" className="border-t bg-surface lg:hidden">
          {site.header.menu.map((m, i) => (
            <a key={m.id} href={href(m.href)} onClick={() => setOpen(false)} data-field={`header.menu.${i}.label`} className="block border-b px-5 py-4 font-semibold text-brand last:border-0">
              {m.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
