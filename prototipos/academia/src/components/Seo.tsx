import { useEffect } from "react";
import { site } from "@/content/site";

export function pageTitle(titulo?: string): string {
  return titulo ? `${titulo} | ${site.empresa.nome}` : site.seo.title;
}

/** Client-side sync of title/description (SSR head comes from route head()). */
export function Seo({ titulo }: { titulo?: string }) {
  useEffect(() => {
    document.title = pageTitle(titulo);
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = site.seo.description;
    const existing = document.querySelector('link[rel="canonical"]');
    if (site.seo.canonical_url) {
      const link = existing ?? document.head.appendChild(document.createElement("link"));
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", site.seo.canonical_url);
    } else existing?.remove();
  }, [titulo]);
  return null;
}

export function seoHead(titulo?: string) {
  const s = site.seo;
  return {
    meta: [
      { title: pageTitle(titulo) },
      { name: "description", content: s.description },
      { name: "keywords", content: s.keywords.join(", ") },
      { property: "og:title", content: titulo ? pageTitle(titulo) : s.og_title },
      { property: "og:description", content: s.og_description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(s.og_image.src && !titulo
        ? [{ property: "og:image", content: s.og_image.src }, { name: "twitter:image", content: s.og_image.src }]
        : []),
    ],
    links: s.canonical_url ? [{ rel: "canonical", href: s.canonical_url }] : [],
  };
}
