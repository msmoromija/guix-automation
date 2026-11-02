import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/content";
import { ObrigadoPage } from "@/pages/ObrigadoPage";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: `${site.obrigado.agendamento.titulo} | ${site.empresa.nome}` },
      { name: "description", content: site.seo.description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: site.obrigado.agendamento.titulo },
      { property: "og:description", content: site.obrigado.agendamento.texto },
    ],
  }),
  component: ObrigadoPage,
});
