import { createFileRoute } from "@tanstack/react-router";
import { AgendarPage } from "@/pages/AgendarPage";
import { seoHead } from "@/components/Seo";
import { site } from "@/content/site";

export const Route = createFileRoute("/agendar")({
  validateSearch: (s: Record<string, unknown>): { servico?: string; profissional?: string } => ({
    servico: typeof s.servico === "string" ? s.servico : undefined,
    profissional: typeof s.profissional === "string" ? s.profissional : undefined,
  }),
  head: () => seoHead(site.agendamento.titulo),
  component: AgendarPage,
});
