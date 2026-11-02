import type { Site } from "@/content/site.types";
import { formatarData } from "./expediente";

export const LEAD_KEY = "presenca.lead";

export interface Lead {
  tipo: "agendamento" | "contato";
  servico_id: string;
  profissional_id: string;
  data: string;
  horario: string;
  nome: string;
  telefone: string;
  email: string;
  mensagem: string;
}

export function salvarLead(lead: Lead): void {
  sessionStorage.setItem(LEAD_KEY, JSON.stringify(lead));
}

export function lerLead(): Lead | null {
  try {
    const raw = sessionStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    const l = JSON.parse(raw) as Lead;
    return l.tipo === "agendamento" || l.tipo === "contato" ? l : null;
  } catch {
    return null;
  }
}

export function mensagemLead(lead: Lead, site: Site): string {
  if (lead.tipo === "contato") {
    return `Olá, meu nome é ${lead.nome}. WhatsApp: ${lead.telefone}. ${lead.mensagem}`.trim();
  }
  const servico = site.servicos.itens.find((s) => s.id === lead.servico_id)?.nome ?? "";
  const prof =
    site.profissionais.itens.find((p) => p.id === lead.profissional_id)?.nome ??
    site.agendamento.sem_preferencia;
  const obs = lead.mensagem.trim() ? ` ${lead.mensagem.trim()}` : "";
  return `Olá, quero agendar: ${servico} com ${prof} em ${formatarData(lead.data)} às ${lead.horario}. Meu nome é ${lead.nome}. WhatsApp: ${lead.telefone}.${obs}`;
}
