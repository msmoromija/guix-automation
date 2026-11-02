import { createFileRoute } from "@tanstack/react-router";
import { ObrigadoPage } from "@/pages/ObrigadoPage";
import { seoHead } from "@/components/Seo";
import { site } from "@/content/site";

export const Route = createFileRoute("/obrigado")({
  head: () => {
    const h = seoHead(site.obrigado.agendamento.titulo);
    return { ...h, meta: [...h.meta, { name: "robots", content: "noindex" }] };
  },
  component: ObrigadoPage,
});
