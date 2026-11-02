import { useEffect } from "react";
import { site } from "@/content";

/** Client-side sync of title/description; SSR tags come from route head() via seoHead(). */
export function Seo({ title }: { title?: string }) {
  const full = title ? `${title} | ${site.empresa.nome}` : site.seo.title;
  useEffect(() => {
    document.title = full;
    let m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
    m.content = site.seo.description;
  }, [full]);
  return null;
}

export function seoHead(title?: string) {
  const full = title ? `${title} | ${site.empresa.nome}` : site.seo.title;
  const meta = [
    { title: full },
    { name: "description", content: site.seo.description },
    { name: "keywords", content: site.seo.keywords.join(", ") },
    { property: "og:title", content: title ? full : site.seo.og_title },
    { property: "og:description", content: site.seo.og_description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(site.seo.og_image.src
      ? [{ property: "og:image", content: site.seo.og_image.src }, { name: "twitter:image", content: site.seo.og_image.src }]
      : []),
  ];
  const links = site.seo.canonical_url ? [{ rel: "canonical", href: site.seo.canonical_url }] : [];
  return { meta, links };
}
