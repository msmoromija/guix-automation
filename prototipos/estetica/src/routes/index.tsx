import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/content";
import { HomePage } from "@/pages/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: site.seo.title },
      { name: "description", content: site.seo.description },
      { name: "keywords", content: site.seo.keywords.join(", ") },
      { property: "og:title", content: site.seo.og_title },
      { property: "og:description", content: site.seo.og_description },
      { property: "og:image", content: site.seo.og_image.src },
      { name: "twitter:image", content: site.seo.og_image.src },
    ],
  }),
  component: HomePage,
});
