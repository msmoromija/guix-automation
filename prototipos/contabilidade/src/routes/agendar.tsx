import { createFileRoute } from "@tanstack/react-router";
import { AgendarPage } from "@/pages/AgendarPage";
import { seoHead } from "@/components/Seo";
import { site } from "@/content";

interface AgendarSearch {
  servico?: string;
  profissional?: string;
}

export const Route = createFileRoute("/agendar")({
  validateSearch: (s: Record<string, unknown>): AgendarSearch => ({
    servico: typeof s.servico === "string" ? s.servico : undefined,
    profissional: typeof s.profissional === "string" ? s.profissional : undefined,
  }),
  head: () => seoHead(site.agendamento.titulo),
  component: AgendarRoute,
});

function AgendarRoute() {
  const { servico, profissional } = Route.useSearch();
  return <AgendarPage key={`${servico}-${profissional}`} servico={servico} profissional={profissional} />;
}
