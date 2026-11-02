import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content/site";

export function Wordmark() {
  const { logo, nome } = site.empresa;
  if (logo.src) return <img src={logo.src} alt={logo.alt} className="h-8 w-auto" />;
  return (
    <span data-field="empresa.nome" className="font-heading text-lg uppercase tracking-wider text-text">
      {nome}
    </span>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header data-section="header" className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label={site.empresa.nome} onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <nav className="hidden lg:block">
          <ul className="flex gap-6 text-sm text-text-muted">
            {site.header.menu.map((m) => (
              <li key={m.id}>
                <a href={casaHref(m.href)} className="hover:text-accent">{m.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" data-field="header.botao_agendar" className="btn-primary !min-h-10 !px-4 text-sm">
            {site.header.botao_agendar}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-brand border lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={site.header.menu.map((m) => m.label).join(", ")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-mobile" className="border-t bg-surface lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {site.header.menu.map((m) => (
              <li key={m.id}>
                <a href={casaHref(m.href)} onClick={() => setOpen(false)} className="block border-b py-3 font-heading uppercase tracking-wide last:border-0">
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
