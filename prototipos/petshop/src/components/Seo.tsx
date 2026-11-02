import { useEffect } from "react";
import { site } from "@/content/site";

/** Client-side title/description sync. Server-rendered tags come from seoHead(). */
export function Seo({ titulo }: { titulo?: string }) {
  useEffect(() => {
    document.title = titulo ? `${titulo} | ${site.empresa.nome}` : site.seo.title;
    let m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "description";
      document.head.appendChild(m);
    }
    m.content = site.seo.description;
  }, [titulo]);
  return null;
}

export function seoHead(titulo?: string) {
  const { seo, empresa } = site;
  const title = titulo ? `${titulo} | ${empresa.nome}` : seo.title;
  return {
    meta: [
      { title },
      { name: "description", content: seo.description },
      { name: "keywords", content: seo.keywords.join(", ") },
      { property: "og:title", content: titulo ? title : seo.og_title },
      { property: "og:description", content: seo.og_description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: seo.og_image.src },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: seo.og_image.src },
    ],
    links: seo.canonical_url ? [{ rel: "canonical", href: seo.canonical_url }] : [],
  };
}
