/** Prefixes in-app links with the Vite base so the house works under /casas/<nicho>/. */
export function casaHref(href: string) {
  if (!href || /^(https?:|mailto:|tel:)/.test(href)) return href;
  const base = import.meta.env.BASE_URL || "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  if (href.startsWith("#")) return `${base}${href}`;
  if (href.startsWith("/")) return `${root}${href}`;
  return `${base}${href}`;
}
