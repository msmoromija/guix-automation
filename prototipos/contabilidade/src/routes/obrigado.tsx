import { createFileRoute } from "@tanstack/react-router";
import { ObrigadoPage } from "@/pages/ObrigadoPage";
import { seoHead } from "@/components/Seo";
import { site } from "@/content";

export const Route = createFileRoute("/obrigado")({
  head: () => ({ ...seoHead(site.obrigado.agendamento.titulo), meta: [...seoHead(site.obrigado.agendamento.titulo).meta, { name: "robots", content: "noindex" }] }),
  component: ObrigadoPage,
});
