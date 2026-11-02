import { contato } from "@/lib/contato";
import { enviarSmsTexto } from "@/lib/agendamentos/sms";
import {
  gravarPacote,
  PRAZO_INTEGRACAO_HORAS,
  type PacotePrototipo,
} from "./cofre";
import { registrarJobAprovado } from "./ops";

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");
}

export type CanalAprovacao = "email" | "sms" | "whatsapp";

function linksDoToken(token: string) {
  const t = encodeURIComponent(token);
  return {
    contaUrl: `${siteBase()}/conta/${token}?t=${t}`,
    visualizarUrl: `${siteBase()}/visualizar/${token}`,
    contratarUrl: `${siteBase()}/contratar?plano=simples&preview=${token}&t=${t}`,
    downloadUrl: `${siteBase()}/api/prototipo/${token}/site.json?t=${t}`,
    extratoUrl: `${siteBase()}/conta/${token}/extrato?t=${t}`,
    agendaUrl: `${siteBase()}/conta/${token}/agenda?t=${t}`,
  };
}

function textoTokenCliente(opts: { nome: string; token: string; links: ReturnType<typeof linksDoToken> }) {
  return [
    `Olá! Seu protótipo GuiX de ${opts.nome} foi aprovado.`,
    ``,
    `Seu token de acesso: ${opts.token}`,
    ``,
    `Área do cliente: ${opts.links.contaUrl}`,
    `Ver site: ${opts.links.visualizarUrl}`,
    `Extrato / PDF: ${opts.links.extratoUrl}`,
    `Contratar (PIX/cartão): ${opts.links.contratarUrl}`,
    ``,
    `Guarde o token — ele abre sua área e o site de teste.`,
  ].join("\n");
}

async function emailResend(para: string, assunto: string, texto: string) {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) return { ok: false as const, motivo: "RESEND_API_KEY ausente" };
  const de = process.env.RESEND_FROM || "GuiX.net <noreply@guix.net.br>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [para], subject: assunto, text: texto }),
    });
    if (!res.ok) return { ok: false as const, motivo: (await res.text()).slice(0, 160) };
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha e-mail" };
  }
}

async function whatsappWebhook(telefoneDigitos: string, mensagem: string) {
  const url = (process.env.AGENDAR_WHATSAPP_OTP_URL || process.env.GUIX_WHATSAPP_NOTIFY_URL || "").trim();
  if (!url) return { ok: false as const, motivo: "WhatsApp webhook ausente", waMe: "" };
  const token = (process.env.AGENDAR_WHATSAPP_OTP_TOKEN || process.env.GUIX_WHATSAPP_NOTIFY_TOKEN || "").trim();
  const tel = telefoneDigitos.startsWith("55") ? telefoneDigitos : `55${telefoneDigitos}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ telefone: tel, mensagem, tipo: "aprovacao_prototipo" }),
    });
    if (!res.ok) return { ok: false as const, motivo: (await res.text()).slice(0, 160), waMe: "" };
    return { ok: true as const, waMe: "" };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha WA", waMe: "" };
  }
}

function digitosTel(raw: string) {
  return String(raw || "").replace(/\D/g, "");
}

/** Aprova o protótipo, dispara token ao cliente e documentação à GuiX. */
export async function aprovarPrototipo(
  pacote: PacotePrototipo,
  opts: {
    email?: string;
    telefone?: string;
    canais: CanalAprovacao[];
  },
) {
  const agora = new Date();
  const prazo = new Date(agora.getTime() + PRAZO_INTEGRACAO_HORAS * 3600 * 1000);
  const links = linksDoToken(pacote.token);
  const emailCliente = String(opts.email || pacote.email || "").trim().toLowerCase();
  const telefoneCliente = digitosTel(opts.telefone || pacote.whatsapp || "");
  const canais = opts.canais.length ? opts.canais : (["email"] as CanalAprovacao[]);
  const texto = textoTokenCliente({ nome: pacote.nome, token: pacote.token, links });

  const envios: Record<string, { ok: boolean; motivo?: string; waMe?: string }> = {};

  if (canais.includes("email") && emailCliente) {
    envios.email = await emailResend(emailCliente, `Token do seu protótipo GuiX — ${pacote.nome}`, texto);
  } else if (canais.includes("email")) {
    envios.email = { ok: false, motivo: "E-mail do cliente ausente" };
  }

  if (canais.includes("sms") && telefoneCliente.length >= 10) {
    envios.sms = await enviarSmsTexto({
      telefoneDigitos: telefoneCliente,
      mensagem: `GuiX: prototipo aprovado. Token ${pacote.token}. Conta: ${links.contaUrl}`,
    });
  } else if (canais.includes("sms")) {
    envios.sms = { ok: false, motivo: "Telefone ausente para SMS" };
  }

  if (canais.includes("whatsapp") && telefoneCliente.length >= 10) {
    const wa = await whatsappWebhook(telefoneCliente, texto);
    const waMe = `https://wa.me/${telefoneCliente.startsWith("55") ? telefoneCliente : `55${telefoneCliente}`}?text=${encodeURIComponent(texto)}`;
    envios.whatsapp = { ...wa, waMe: wa.ok ? "" : waMe };
  } else if (canais.includes("whatsapp")) {
    envios.whatsapp = { ok: false, motivo: "Telefone ausente para WhatsApp" };
  }

  const atualizado: PacotePrototipo = {
    ...pacote,
    status: "aprovado",
    aprovadoEm: agora.toISOString(),
    prazoIntegracao: prazo.toISOString(),
    edicaoFechada: true,
    fechadoEm: pacote.fechadoEm || agora.toISOString(),
    email: emailCliente || pacote.email,
    whatsapp: telefoneCliente || pacote.whatsapp,
    aprovacao: {
      email: emailCliente || undefined,
      telefone: telefoneCliente || undefined,
      canais,
      enviadoEm: agora.toISOString(),
    },
  };
  await gravarPacote(atualizado);

  const docGuiX = [
    `PROTOCOLO DE APROVAÇÃO — GuiX`,
    `Negócio: ${pacote.nome}`,
    `Nicho: ${pacote.nicho}`,
    `Cidade: ${pacote.cidade || "—"}`,
    `Token: ${pacote.token}`,
    `Aprovado em: ${agora.toLocaleString("pt-BR")}`,
    `Prazo integração: ${prazo.toLocaleString("pt-BR")} (${PRAZO_INTEGRACAO_HORAS}h)`,
    `Cliente e-mail: ${emailCliente || "—"}`,
    `Cliente tel: ${telefoneCliente || "—"}`,
    `Conta: ${links.contaUrl}`,
    `Preview: ${links.visualizarUrl}`,
    `JSON: ${links.downloadUrl}`,
    `Contratar: ${links.contratarUrl}`,
  ].join("\n");

  const opsEmail = (process.env.GUIX_OPS_EMAIL || contato.email).trim();
  const opsMail = await emailResend(opsEmail, `[Aprovado] ${pacote.nome} · prazo ${PRAZO_INTEGRACAO_HORAS}h`, docGuiX);
  const opsWa = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(docGuiX)}`;

  await registrarJobAprovado({
    token: pacote.token,
    nicho: pacote.nicho,
    nome: pacote.nome,
    cidade: pacote.cidade,
    whatsapp: telefoneCliente || pacote.whatsapp,
    email: emailCliente || pacote.email,
    aprovadoEm: atualizado.aprovadoEm!,
    prazoIntegracao: atualizado.prazoIntegracao!,
    status: "aprovado",
    contratarUrl: links.contratarUrl,
    contaUrl: links.contaUrl,
    visualizarUrl: links.visualizarUrl,
    downloadUrl: links.downloadUrl,
    contatoCliente: { email: emailCliente || undefined, telefone: telefoneCliente || undefined },
  }).catch(() => undefined);

  return {
    pacote: atualizado,
    links,
    envios,
    ops: { email: opsMail, whatsappUrl: opsWa, prazoIntegracao: atualizado.prazoIntegracao },
    docGuiX,
  };
}
