import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";
import { seoHead } from "@/components/Seo";

export const Route = createFileRoute("/")({
  head: () => seoHead(),
  component: HomePage,
});
