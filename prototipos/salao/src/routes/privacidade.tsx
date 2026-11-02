import { createFileRoute } from "@tanstack/react-router";
import { PrivacidadePage } from "@/pages/PrivacidadePage";
import { seoHead } from "@/components/Seo";
import { site } from "@/content";

export const Route = createFileRoute("/privacidade")({
  head: () => seoHead(site.privacidade.titulo),
  component: PrivacidadePage,
});
