import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content";

export function Header() {
  const [open, setOpen] = useState(false);
  const { empresa, header } = site;
  const href = (h: string) => casaHref(h);

  return (
    <header data-section="header" className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          {empresa.logo.src ? (
            <img src={empresa.logo.src} alt={empresa.logo.alt} className="h-9 w-auto" />
          ) : (
            <span data-field="empresa.nome" className="font-[family-name:var(--font-heading)] text-xl font-semibold text-primary">
              {empresa.nome}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {header.menu.map((m) => (
            <a key={m.id} href={href(m.href)} data-field={`header.menu.${m.id}.label`} className="text-sm text-muted-foreground hover:text-primary">
              {m.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" data-field="header.botao_agendar" className="btn-primary hidden text-sm sm:inline-flex">
            {header.botao_agendar}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-border text-primary lg:hidden"
            aria-expanded={open}
            aria-label={header.menu.map((m) => m.label).join(", ")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-4 pb-4 lg:hidden">
          {header.menu.map((m) => (
            <a key={m.id} href={href(m.href)} onClick={() => setOpen(false)} className="block border-b border-border py-3 text-primary">
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
