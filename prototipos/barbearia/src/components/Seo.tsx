import { useEffect } from "react";
import { site } from "@/content/site";

/** Client-side title/description sync. SSR metadata comes from each route's head(). */
export function Seo({ title }: { title?: string }) {
  useEffect(() => {
    document.title = title ? `${title} | ${site.empresa.nome}` : site.seo.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = site.seo.description;
  }, [title]);
  return null;
}

export function seoHead(title?: string) {
  const t = title ? `${title} | ${site.empresa.nome}` : site.seo.title;
  const meta = [
    { title: t },
    { name: "description", content: site.seo.description },
    { name: "keywords", content: site.seo.keywords.join(", ") },
    { property: "og:title", content: title ? t : site.seo.og_title },
    { property: "og:description", content: site.seo.og_description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(site.seo.og_image.src
      ? [
          { property: "og:image", content: site.seo.og_image.src },
          { name: "twitter:image", content: site.seo.og_image.src },
        ]
      : []),
  ];
  const links = site.seo.canonical_url ? [{ rel: "canonical", href: site.seo.canonical_url }] : [];
  return { meta, links };
}
