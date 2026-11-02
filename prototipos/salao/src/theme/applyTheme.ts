import type { Site } from "@/content/site.types";

const RADIUS: Record<string, string> = { none: "0", sm: "3px", md: "8px", lg: "16px" };

export function themeVars(site: Site): Record<string, string> {
  const t = site.tema;
  return {
    "--color-primary": t.color_primary,
    "--color-secondary": t.color_secondary,
    "--color-accent": t.color_accent,
    "--color-background": t.color_background,
    "--color-surface": t.color_surface,
    "--color-text": t.color_text,
    "--color-text-muted": t.color_text_muted,
    "--font-heading": `"${t.font_heading}", Georgia, serif`,
    "--font-body": `"${t.font_body}", system-ui, sans-serif`,
    "--radius": RADIUS[t.radius] ?? RADIUS.md,
  };
}

export function fontsHref(site: Site): string {
  const fam = (f: string) => `family=${f.trim().replace(/ /g, "+")}:wght@400;500;600;700`;
  return `https://fonts.googleapis.com/css2?${fam(site.tema.font_heading)}&${fam(site.tema.font_body)}&display=swap`;
}

export function applyTheme(site: Site): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(site))) root.style.setProperty(k, v);
}
