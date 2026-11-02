import type { Agendamento } from "./tipos";
import { rotuloStatus } from "./tipos";

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");
}

export type TipoAvisoAgenda = "solicitacao" | "confirmado" | "recusado" | "cancelado";

export function urlCancelamento(ag: Agendamento) {
  return `${siteBase()}/agendamento/${ag.id}?s=${encodeURIComponent(ag.siteId)}&t=${encodeURIComponent(ag.cancelToken)}`;
}

export function urlGestao(ag: Agendamento) {
  return `${siteBase()}/agendamento/${ag.id}/gestao?s=${encodeURIComponent(ag.siteId)}&m=${encodeURIComponent(ag.manageToken)}`;
}

function tituloAviso(tipo: TipoAvisoAgenda) {
  if (tipo === "solicitacao") return "Nova solicitação de horário";
  if (tipo === "confirmado") return "Horário confirmado pelo profissional";
  if (tipo === "recusado") return "Solicitação recusada pelo profissional";
  return "Agendamento cancelado pelo cliente";
}

export function mensagemAgendamento(ag: Agendamento, tipo: TipoAvisoAgenda) {
  const linhas = [
    tituloAviso(tipo),
    `Status: ${rotuloStatus(ag.status)}`,
    `Cliente: ${ag.nomeCompleto}`,
    `E-mail: ${ag.email}`,
    `Telefone: ${ag.telefone}`,
    `Serviço: ${ag.servico}`,
    `Profissional: ${ag.profissional}`,
    `Dia: ${ag.data.split("-").reverse().join("/")}`,
    `Horário: ${ag.hora}`,
  ];
  if (ag.respostaNota) linhas.push(`Nota: ${ag.respostaNota}`);
  if (tipo === "solicitacao") {
    linhas.push(`Responder (aceitar/recusar): ${urlGestao(ag)}`);
    linhas.push(`Cliente acompanha em: ${urlCancelamento(ag)}`);
  } else if (tipo === "cancelado") {
    linhas.push(`Detalhe: ${urlCancelamento(ag)}`);
  } else {
    linhas.push(`Acompanhar: ${urlCancelamento(ag)}`);
  }
  return linhas.filter(Boolean).join("\n");
}

/** @deprecated use mensagemAgendamento */
export function mensagemWhatsappAgendamento(ag: Agendamento, tipo: "novo" | "cancelado") {
  return mensagemAgendamento(ag, tipo === "novo" ? "solicitacao" : "cancelado");
}

export function linkWhatsappNegocio(ag: Agendamento, tipo: TipoAvisoAgenda | "novo" | "cancelado") {
  const digitos = String(ag.negocioWhatsapp || "").replace(/\D/g, "");
  if (!digitos || /^(55)?79999990000$/.test(digitos)) return "";
  const mapa: TipoAvisoAgenda =
    tipo === "novo" ? "solicitacao" : tipo === "cancelado" ? "cancelado" : (tipo as TipoAvisoAgenda);
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagemAgendamento(ag, mapa))}`;
}

async function enviarResend(opts: { para: string; assunto: string; texto: string }) {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) return { ok: false as const, motivo: "RESEND_API_KEY não configurada." };
  const de = process.env.RESEND_FROM || "GuiX.net <noreply@guix.net.br>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: de,
        to: [opts.para],
        subject: opts.assunto,
        text: opts.texto,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false as const, motivo: err.slice(0, 160) };
    }
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha no e-mail" };
  }
}

export async function enviarEmailNegocio(ag: Agendamento, tipo: TipoAvisoAgenda | "novo" | "cancelado") {
  const para = String(ag.negocioEmail || "").trim();
  if (!para || /nao-informado@guix\.invalid/i.test(para)) {
    return { ok: false as const, motivo: "E-mail do negócio não informado." };
  }
  const mapa: TipoAvisoAgenda =
    tipo === "novo" ? "solicitacao" : tipo === "cancelado" ? "cancelado" : (tipo as TipoAvisoAgenda);
  const assunto =
    mapa === "solicitacao"
      ? `Solicitação de horário — ${ag.negocioNome}`
      : mapa === "cancelado"
        ? `Cancelamento — ${ag.negocioNome}`
        : `${tituloAviso(mapa)} — ${ag.negocioNome}`;
  return enviarResend({ para, assunto, texto: mensagemAgendamento(ag, mapa) });
}

export async function enviarEmailCliente(ag: Agendamento, tipo: TipoAvisoAgenda) {
  const para = String(ag.email || "").trim();
  if (!para) return { ok: false as const, motivo: "E-mail do cliente ausente." };
  const assunto =
    tipo === "confirmado"
      ? `Horário confirmado — ${ag.negocioNome}`
      : tipo === "recusado"
        ? `Horário indisponível — ${ag.negocioNome}`
        : `Atualização do agendamento — ${ag.negocioNome}`;
  return enviarResend({ para, assunto, texto: mensagemAgendamento(ag, tipo) });
}
