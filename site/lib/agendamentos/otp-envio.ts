import type { CanalVerificacao } from "./cliente";
import { enviarSmsCodigo, smsConfigurado } from "./sms";

async function enviarEmailCodigo(opts: { para: string; nome: string; codigo: string; negocioNome?: string }) {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) return { ok: false as const, motivo: "RESEND_API_KEY não configurada." };
  const de = process.env.RESEND_FROM || "GuiX.net <noreply@guix.net.br>";
  const casa = opts.negocioNome?.trim() || "o estabelecimento";
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
        subject: `Seu código para agendar — ${casa}`,
        text: [
          `Olá, ${opts.nome}.`,
          ``,
          `Seu código de verificação é: ${opts.codigo}`,
          ``,
          `Ele vale por 10 minutos. Se você não pediu para agendar em ${casa}, ignore este e-mail.`,
        ].join("\n"),
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

/** Webhook opcional (Z-API / Evolution / etc.): POST JSON { telefone, codigo, nome, negocioNome }. */
async function enviarWhatsappCodigo(opts: {
  telefoneDigitos: string;
  nome: string;
  codigo: string;
  negocioNome?: string;
}) {
  const url = (process.env.AGENDAR_WHATSAPP_OTP_URL || "").trim();
  if (!url) return { ok: false as const, motivo: "WhatsApp OTP não configurado." };
  const token = (process.env.AGENDAR_WHATSAPP_OTP_TOKEN || "").trim();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        telefone: opts.telefoneDigitos.startsWith("55") ? opts.telefoneDigitos : `55${opts.telefoneDigitos}`,
        codigo: opts.codigo,
        nome: opts.nome,
        negocioNome: opts.negocioNome || "",
        mensagem: `Seu código GuiX para agendar em ${opts.negocioNome || "o estabelecimento"} é ${opts.codigo}. Vale 10 minutos.`,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false as const, motivo: err.slice(0, 160) };
    }
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha no WhatsApp" };
  }
}

export async function enviarCodigoVerificacao(opts: {
  canal: CanalVerificacao;
  email: string;
  telefoneDigitos: string;
  nome: string;
  codigo: string;
  negocioNome?: string;
}) {
  if (opts.canal === "email") {
    return enviarEmailCodigo({
      para: opts.email,
      nome: opts.nome,
      codigo: opts.codigo,
      negocioNome: opts.negocioNome,
    });
  }

  // 1) SMS (Twilio ou webhook)
  const sms = await enviarSmsCodigo({
    telefoneDigitos: opts.telefoneDigitos,
    codigo: opts.codigo,
    nome: opts.nome,
    negocioNome: opts.negocioNome,
  });
  if (sms.ok) {
    return { ok: true as const, canalEfetivo: "sms" as const };
  }

  // 2) WhatsApp webhook (se houver)
  const wa = await enviarWhatsappCodigo({
    telefoneDigitos: opts.telefoneDigitos,
    nome: opts.nome,
    codigo: opts.codigo,
    negocioNome: opts.negocioNome,
  });
  if (wa.ok) {
    return { ok: true as const, canalEfetivo: "telefone" as const };
  }

  // 3) Sem SMS/WA: e-mail do cadastro (ainda exige posse do e-mail)
  const emailFallback = await enviarEmailCodigo({
    para: opts.email,
    nome: opts.nome,
    codigo: opts.codigo,
    negocioNome: opts.negocioNome,
  });
  if (emailFallback.ok) {
    const dica = smsConfigurado()
      ? "Não deu para entregar o SMS agora — enviamos o código no seu e-mail."
      : "SMS ainda não está ligado neste servidor — enviamos o código no seu e-mail.";
    return {
      ok: true as const,
      aviso: dica,
      canalEfetivo: "email" as const,
    };
  }

  return {
    ok: false as const,
    motivo: sms.motivo || wa.motivo || emailFallback.motivo || "Não foi possível enviar o código.",
  };
}
