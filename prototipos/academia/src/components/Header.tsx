import { casaHref } from "@/lib/casaHref";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { site } from "@/content/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const { empresa, header } = site;
  const href = (h: string) => casaHref(h);

  return (
    <header data-section="header" className="sticky top-0 z-50 border-b bg-page/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          {empresa.logo.src ? (
            <img src={empresa.logo.src} alt={empresa.logo.alt} className="h-8 w-auto" />
          ) : (
            <span data-field="empresa.nome" className="font-heading text-2xl font-bold uppercase tracking-wide">
              {empresa.nome}
            </span>
          )}
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {header.menu.map((m) => (
            <a key={m.id} href={href(m.href)} className="text-sm text-ink-muted hover:text-ink">
              {m.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/agendar" data-action="agendar" data-field="header.botao_agendar" className="btn-primary hidden min-h-10 text-sm sm:inline-flex">
            {header.botao_agendar}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-theme border lg:hidden"
            aria-expanded={open}
            aria-label={header.menu[0]?.label ? `Menu ${empresa.nome}` : empresa.nome}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-page px-4 pb-5 lg:hidden">
          <ul className="flex flex-col">
            {header.menu.map((m) => (
              <li key={m.id}>
                <a href={href(m.href)} onClick={() => setOpen(false)} className="block border-b py-3 font-heading text-xl uppercase">
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/agendar" data-action="agendar" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
            {header.botao_agendar}
          </Link>
        </nav>
      )}
    </header>
  );
}
