import { useEffect } from "react";
import { site } from "@/content/site";

/** Client-side title/description sync. SSR metadata comes from each route's head(). */
export function Seo({ titulo }: { titulo?: string }) {
  useEffect(() => {
    document.title = titulo ? `${titulo} | ${site.empresa.nome}` : site.seo.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = site.seo.description;
    if (site.seo.canonical_url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = site.seo.canonical_url;
    }
  }, [titulo]);
  return null;
}

export function seoHead(titulo?: string) {
  const title = titulo ? `${titulo} | ${site.empresa.nome}` : site.seo.title;
  return {
    meta: [
      { title },
      { name: "description", content: site.seo.description },
      { name: "keywords", content: site.seo.keywords.join(", ") },
      { property: "og:title", content: titulo ? title : site.seo.og_title },
      { property: "og:description", content: site.seo.og_description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(site.seo.og_image.src
        ? [
            { property: "og:image", content: site.seo.og_image.src },
            { name: "twitter:image", content: site.seo.og_image.src },
          ]
        : []),
    ],
    links: site.seo.canonical_url ? [{ rel: "canonical", href: site.seo.canonical_url }] : [],
  };
}
