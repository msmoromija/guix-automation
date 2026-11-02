import type { Agendamento } from "./tipos";

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");
}

export function urlCancelamento(ag: Agendamento) {
  return `${siteBase()}/agendamento/${ag.id}?s=${encodeURIComponent(ag.siteId)}&t=${encodeURIComponent(ag.cancelToken)}`;
}

export function mensagemWhatsappAgendamento(ag: Agendamento, tipo: "novo" | "cancelado") {
  const titulo = tipo === "novo" ? "Novo agendamento pelo site" : "Agendamento cancelado pelo cliente";
  return [
    `${titulo}`,
    `Cliente: ${ag.nomeCompleto}`,
    `E-mail: ${ag.email}`,
    `Telefone: ${ag.telefone}`,
    `Serviço: ${ag.servico}`,
    `Profissional: ${ag.profissional}`,
    `Dia: ${ag.data.split("-").reverse().join("/")}`,
    `Horário: ${ag.hora}`,
    tipo === "novo" ? `Cancelar (até 3h antes): ${urlCancelamento(ag)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function linkWhatsappNegocio(ag: Agendamento, tipo: "novo" | "cancelado") {
  const digitos = String(ag.negocioWhatsapp || "").replace(/\D/g, "");
  if (!digitos || /^(55)?79999990000$/.test(digitos)) return "";
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagemWhatsappAgendamento(ag, tipo))}`;
}

export async function enviarEmailNegocio(ag: Agendamento, tipo: "novo" | "cancelado") {
  const para = String(ag.negocioEmail || "").trim();
  if (!para || /nao-informado@guix\.invalid/i.test(para)) {
    return { ok: false, motivo: "E-mail do negócio não informado." };
  }
  const key = process.env.RESEND_API_KEY || "";
  if (!key) {
    return { ok: false, motivo: "RESEND_API_KEY não configurada." };
  }
  const de = process.env.RESEND_FROM || "GuiX.net <noreply@guix.net.br>";
  const assunto = tipo === "novo" ? `Novo agendamento — ${ag.negocioNome}` : `Cancelamento — ${ag.negocioNome}`;
  const texto = mensagemWhatsappAgendamento(ag, tipo);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: de,
        to: [para],
        subject: assunto,
        text: texto,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, motivo: err.slice(0, 160) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "Falha no e-mail" };
  }
}
