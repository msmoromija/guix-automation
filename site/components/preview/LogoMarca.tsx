"use client";

import { hexOk } from "@/lib/estudio/logo-spec";

function svgDeDataUri(src: string): string | null {
  if (!src.startsWith("data:image/svg+xml")) return null;
  const comma = src.indexOf(",");
  if (comma < 0) return null;
  const meta = src.slice(0, comma);
  const payload = src.slice(comma + 1);
  try {
    const raw = /;base64/i.test(meta) ? atob(payload) : decodeURIComponent(payload);
    if (
      /script|foreignObject|javascript:|data:text\/html|<iframe|<object|<embed|xlink:href\s*=\s*["']?\s*javascript/i.test(
        raw,
      ) ||
      /\bon[a-z]+\s*=/i.test(raw)
    ) {
      return null;
    }
    const m = raw.match(/<svg[\s\S]*<\/svg>/i);
    if (!m) return null;
    return m[0]
      .replace(/\s(width|height)="[^"]*"/gi, "")
      .replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="xMinYMid meet"');
  } catch {
    return null;
  }
}

export function LogoMarca({
  src,
  alt,
  className,
  inverter,
  cor,
}: {
  src: string;
  alt?: string;
  className?: string;
  inverter?: boolean;
  /** Pinta PNG monocromático (máscara). */
  cor?: string;
}) {
  const svg = svgDeDataUri(src);
  if (svg) {
    return (
      <span
        role="img"
        aria-label={alt || ""}
        className={`inline-flex items-center text-current [&_svg]:h-full [&_svg]:w-auto ${className || ""}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  // Máscara em span vazio precisa de lado definido — w-auto colapsa para 0.
  if (cor && hexOk(cor) && !src.startsWith("data:")) {
    return (
      <span
        role="img"
        aria-label={alt || ""}
        className={`inline-block shrink-0 ${className || ""}`}
        style={{
          backgroundColor: cor,
          aspectRatio: "1 / 1",
          width: "auto",
          minWidth: "2.75rem",
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ""}
      className={className}
      style={inverter ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
