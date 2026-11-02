import type { CreditoUnsplash } from "./tipos";

export function formatarCredito(c: CreditoUnsplash): string {
  return c.texto || `Photo by ${c.fotografo} on Unsplash`;
}

/** HTML discreto para o rodapé do site do cliente. */
export function htmlCreditoRodape(creditos: CreditoUnsplash[]): string {
  const unicos = new Map<string, CreditoUnsplash>();
  for (const c of creditos) {
    if (!c?.fotografo) continue;
    unicos.set(`${c.fotografo}|${c.perfil_url}`, c);
  }
  if (!unicos.size) return "";

  const partes = [...unicos.values()].map((c) => {
    const nome = escapeHtml(c.fotografo);
    const perfil = escapeAttr(c.perfil_url);
    const unsplash = escapeAttr(c.unsplash_url || "https://unsplash.com");
    return `Photo by <a href="${perfil}" rel="noopener noreferrer" target="_blank">${nome}</a> on <a href="${unsplash}" rel="noopener noreferrer" target="_blank">Unsplash</a>`;
  });

  return `<p class="creditos-midia" style="font-size:11px;opacity:.55;margin:0">${partes.join(" · ")}</p>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
