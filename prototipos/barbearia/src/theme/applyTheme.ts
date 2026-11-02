import type { Site } from "@/content/site.types";

const RADIUS: Record<string, string> = { none: "0px", sm: "3px", md: "6px", lg: "10px" };

export function themeVars(s: Site): Record<string, string> {
  const t = s.tema;
  return {
    "--color-primary": t.color_primary,
    "--color-secondary": t.color_secondary,
    "--color-accent": t.color_accent,
    "--color-background": t.color_background,
    "--color-surface": t.color_surface,
    "--color-text": t.color_text,
    "--color-text-muted": t.color_text_muted,
    "--font-heading": `"${t.font_heading}", sans-serif`,
    "--font-body": `"${t.font_body}", sans-serif`,
    "--radius": RADIUS[t.radius] ?? "3px",
  };
}

/** Writes theme variables on <html>. Also rendered inline during SSR so the first paint is themed. */
export function applyTheme(s: Site): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(s))) root.style.setProperty(k, v);
}

export function googleFontsHref(s: Site): string {
  const fam = (f: string) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`;
  return `https://fonts.googleapis.com/css2?${fam(s.tema.font_heading)}&${fam(s.tema.font_body)}&display=swap`;
}
