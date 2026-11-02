import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/content";
import { PrivacidadePage } from "@/pages/PrivacidadePage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: `${site.privacidade.titulo} | ${site.empresa.nome}` },
      { name: "description", content: site.seo.description },
      { property: "og:title", content: `${site.privacidade.titulo} | ${site.empresa.nome}` },
      { property: "og:description", content: site.privacidade.paragrafos[0] ?? site.seo.description },
    ],
  }),
  component: PrivacidadePage,
});
