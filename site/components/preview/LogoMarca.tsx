"use client";

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
}: {
  src: string;
  alt?: string;
  className?: string;
  inverter?: boolean;
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
