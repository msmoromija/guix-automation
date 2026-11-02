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
    "--font-heading": `"${t.font_heading}"`,
    "--font-body": `"${t.font_body}"`,
    "--radius": RADIUS[t.radius] ?? RADIUS.sm,
  };
}

/** Google Fonts URL with only the two families from tema. */
export function fontsHref(site: Site): string {
  const fam = (n: string, w: string) => `family=${n.trim().replace(/\s+/g, "+")}:wght@${w}`;
  return `https://fonts.googleapis.com/css2?${fam(site.tema.font_heading, "500;600;700")}&${fam(site.tema.font_body, "400;500;600;700")}&display=swap`;
}

/** Sets theme variables on documentElement (also rendered inline on <html> during SSR). */
export function applyTheme(site: Site): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(site))) root.style.setProperty(k, v);
}
