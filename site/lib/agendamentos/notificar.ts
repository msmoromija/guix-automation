import { enviarSmsTexto } from "./sms";
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
    `WhatsApp: ${ag.telefone}`,
    `E-mail: ${ag.email}`,
    `Serviço: ${ag.servico}`,
    `Profissional: ${ag.profissional}`,
    `Dia: ${ag.data.split("-").reverse().join("/")}`,
    `Horário: ${ag.hora}`,
  ];
  if (ag.observacao) linhas.push(`Observação do cliente: ${ag.observacao}`);
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

function escapar(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function htmlAgendamento(ag: Agendamento, tipo: TipoAvisoAgenda) {
  const titulo = tituloAviso(tipo);
  const dia = ag.data.split("-").reverse().join("/");
  const link =
    tipo === "solicitacao"
      ? urlGestao(ag)
      : urlCancelamento(ag);
  const labelLink = tipo === "solicitacao" ? "Responder solicitação" : "Acompanhar agendamento";
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#0f172a;max-width:520px;margin:0 auto">
      <h1 style="margin:0 0 12px;font-size:20px">${escapar(titulo)}</h1>
      <p style="margin:0 0 8px"><strong>Status:</strong> ${escapar(rotuloStatus(ag.status))}</p>
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin:12px 0 16px;background:#f8fafc">
        <p style="margin:0 0 6px"><strong>Cliente:</strong> ${escapar(ag.nomeCompleto)}</p>
        <p style="margin:0 0 6px"><strong>Serviço:</strong> ${escapar(ag.servico)}</p>
        <p style="margin:0 0 6px"><strong>Profissional:</strong> ${escapar(ag.profissional)}</p>
        <p style="margin:0"><strong>Quando:</strong> ${escapar(dia)} às ${escapar(ag.hora)}</p>
      </div>
      ${ag.observacao ? `<p style="margin:0 0 12px;color:#475569">Obs.: ${escapar(ag.observacao)}</p>` : ""}
      ${ag.respostaNota ? `<p style="margin:0 0 12px;color:#475569">Nota: ${escapar(ag.respostaNota)}</p>` : ""}
      <p style="margin:0 0 8px">
        <a href="${escapar(link)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px">${escapar(labelLink)}</a>
      </p>
      <p style="margin:14px 0 0;font-size:12px;color:#94a3b8">${escapar(ag.negocioNome)}</p>
    </div>
  `.trim();
}

async function enviarResend(opts: { para: string; assunto: string; texto: string; html?: string }) {
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
        ...(opts.html ? { html: opts.html } : {}),
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
  return enviarResend({
    para,
    assunto,
    texto: mensagemAgendamento(ag, mapa),
    html: htmlAgendamento(ag, mapa),
  });
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
  return enviarResend({
    para,
    assunto,
    texto: mensagemAgendamento(ag, tipo),
    html: htmlAgendamento(ag, tipo),
  });
}

async function enviarWhatsappTexto(telefoneDigitos: string, mensagem: string) {
  const url = (process.env.AGENDAR_WHATSAPP_OTP_URL || process.env.GUIX_WHATSAPP_NOTIFY_URL || "").trim();
  if (!url) {
    const tel = telefoneDigitos.startsWith("55") ? telefoneDigitos : `55${telefoneDigitos}`;
    return {
      ok: false as const,
      motivo: "WhatsApp webhook ausente",
      waMe: `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`,
    };
  }
  const token = (process.env.AGENDAR_WHATSAPP_OTP_TOKEN || process.env.GUIX_WHATSAPP_NOTIFY_TOKEN || "").trim();
  const tel = telefoneDigitos.startsWith("55") ? telefoneDigitos : `55${telefoneDigitos}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ telefone: tel, mensagem, tipo: "agendamento_cliente" }),
    });
    if (!res.ok) return { ok: false as const, motivo: (await res.text()).slice(0, 160), waMe: "" };
    return { ok: true as const, waMe: "" };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha WA", waMe: "" };
  }
}

/** Avisa o cliente por e-mail + SMS + WhatsApp (quando configurados). */
export async function notificarClienteResposta(ag: Agendamento, tipo: "confirmado" | "recusado") {
  const texto = mensagemAgendamento(ag, tipo);
  const email = await enviarEmailCliente(ag, tipo);
  const digitos = String(ag.telefone || "").replace(/\D/g, "");
  let sms: { ok: boolean; motivo?: string } = { ok: false, motivo: "Telefone ausente" };
  let whatsapp: { ok: boolean; motivo?: string; waMe?: string } = { ok: false, motivo: "Telefone ausente" };
  if (digitos.length >= 10) {
    const smsMsg =
      tipo === "confirmado"
        ? `GuiX: ${ag.negocioNome} confirmou ${ag.data.split("-").reverse().join("/")} as ${ag.hora}. ${urlCancelamento(ag)}`
        : `GuiX: ${ag.negocioNome} nao pode no horario ${ag.data.split("-").reverse().join("/")} ${ag.hora}. Escolha outro no site.`;
    sms = await enviarSmsTexto({ telefoneDigitos: digitos, mensagem: smsMsg });
    whatsapp = await enviarWhatsappTexto(digitos, texto);
  }
  return { email, sms, whatsapp };
}
