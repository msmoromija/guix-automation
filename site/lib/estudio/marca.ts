/** Marca em SVG — quem não tem logo ainda. Sem API de imagem, instantâneo e nítido. */

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "G";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function gerarMarcaSvg(opts: {
  nome: string;
  slogan?: string;
  fundo: string;
  tinta: string;
  acento: string;
}) {
  const ini = iniciais(opts.nome);
  const nome = opts.nome.replace(/[<>&]/g, "").slice(0, 42);
  const slogan = (opts.slogan || "").replace(/[<>&]/g, "").slice(0, 64);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" viewBox="0 0 640 160">
  <rect width="640" height="160" rx="16" fill="${opts.fundo}"/>
  <rect x="20" y="28" width="104" height="104" rx="14" fill="${opts.acento}"/>
  <text x="72" y="96" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700" fill="${opts.fundo}">${ini}</text>
  <text x="148" y="${slogan ? 78 : 96}" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="${opts.tinta}">${nome}</text>
  ${slogan ? `<text x="148" y="112" font-family="system-ui, sans-serif" font-size="14" fill="${opts.acento}">${slogan}</text>` : ""}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
