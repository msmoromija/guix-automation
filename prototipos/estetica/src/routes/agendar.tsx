import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/content";
import { AgendarPage } from "@/pages/AgendarPage";

type Search = { servico?: string; profissional?: string };

export const Route = createFileRoute("/agendar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    servico: typeof s.servico === "string" ? s.servico : undefined,
    profissional: typeof s.profissional === "string" ? s.profissional : undefined,
  }),
  head: () => ({
    meta: [
      { title: `${site.agendamento.titulo} | ${site.empresa.nome}` },
      { name: "description", content: site.seo.description },
      { property: "og:title", content: `${site.agendamento.titulo} | ${site.empresa.nome}` },
      { property: "og:description", content: site.agendamento.subtitulo },
    ],
  }),
  component: AgendarRoute,
});

function AgendarRoute() {
  const { servico, profissional } = Route.useSearch();
  return <AgendarPage servico={servico} profissional={profissional} />;
}
