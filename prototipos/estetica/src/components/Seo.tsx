import { useEffect } from "react";
import { site } from "@/content";

/** Sets document.title and meta description on the client. Pass a title for inner pages. */
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
    const existing = document.querySelector('link[rel="canonical"]');
    if (site.seo.canonical_url) {
      const link = existing ?? document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", site.seo.canonical_url);
      if (!existing) document.head.appendChild(link);
    } else existing?.remove();
  }, [titulo]);
  return null;
}
