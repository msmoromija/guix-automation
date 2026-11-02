/** Envio de SMS para OTP do agendamento (Twilio ou webhook genérico). */

function e164Brasil(digitos: string) {
  const d = digitos.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) return `+${d}`;
  if (d.length === 10 || d.length === 11) return `+55${d}`;
  if (d.startsWith("+")) return d;
  return `+${d}`;
}

function mensagemOtp(codigo: string, negocioNome?: string) {
  const casa = negocioNome?.trim() || "o estabelecimento";
  return `GuiX: seu codigo para agendar em ${casa} e ${codigo}. Vale 10 min.`;
}

/** Twilio Messages API — https://www.twilio.com/docs/sms */
async function enviarSmsTwilio(opts: { telefoneDigitos: string; codigo: string; negocioNome?: string }) {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || "").trim();
  if (!sid || !token || !from) {
    return { ok: false as const, motivo: "Twilio SMS não configurado (TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER)." };
  }

  const to = e164Brasil(opts.telefoneDigitos);
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: mensagemOtp(opts.codigo, opts.negocioNome),
  });

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false as const, motivo: `Twilio: ${err.slice(0, 160)}` };
    }
    return { ok: true as const, provedor: "twilio" as const };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha no Twilio" };
  }
}

/**
 * Webhook genérico (Zenvia, Comtele, TotalVoice, etc.):
 * POST JSON { telefone, to, codigo, nome?, negocioNome?, mensagem }
 */
async function enviarSmsWebhook(opts: {
  telefoneDigitos: string;
  codigo: string;
  nome?: string;
  negocioNome?: string;
}) {
  const url = (process.env.AGENDAR_SMS_URL || "").trim();
  if (!url) return { ok: false as const, motivo: "AGENDAR_SMS_URL não configurada." };
  const token = (process.env.AGENDAR_SMS_TOKEN || "").trim();
  const to = e164Brasil(opts.telefoneDigitos);
  const mensagem = mensagemOtp(opts.codigo, opts.negocioNome);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        telefone: opts.telefoneDigitos.startsWith("55") ? opts.telefoneDigitos : `55${opts.telefoneDigitos}`,
        to,
        codigo: opts.codigo,
        nome: opts.nome || "",
        negocioNome: opts.negocioNome || "",
        mensagem,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false as const, motivo: `SMS webhook: ${err.slice(0, 160)}` };
    }
    return { ok: true as const, provedor: "webhook" as const };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha no SMS webhook" };
  }
}

export function smsConfigurado() {
  const twilio =
    Boolean((process.env.TWILIO_ACCOUNT_SID || "").trim()) &&
    Boolean((process.env.TWILIO_AUTH_TOKEN || "").trim()) &&
    Boolean((process.env.TWILIO_FROM_NUMBER || "").trim());
  const webhook = Boolean((process.env.AGENDAR_SMS_URL || "").trim());
  return twilio || webhook;
}

export async function enviarSmsCodigo(opts: {
  telefoneDigitos: string;
  codigo: string;
  nome?: string;
  negocioNome?: string;
}) {
  const twilio = await enviarSmsTwilio(opts);
  if (twilio.ok) return twilio;

  const webhook = await enviarSmsWebhook(opts);
  if (webhook.ok) return webhook;

  return {
    ok: false as const,
    motivo: twilio.motivo !== "Twilio SMS não configurado (TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER)."
      ? twilio.motivo
      : webhook.motivo,
  };
}

/** SMS com texto livre (token de acesso, avisos). */
export async function enviarSmsTexto(opts: { telefoneDigitos: string; mensagem: string }) {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || "").trim();
  const bodyTexto = opts.mensagem.slice(0, 320);

  if (sid && token && from) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: e164Brasil(opts.telefoneDigitos),
          From: from,
          Body: bodyTexto,
        }),
      });
      if (res.ok) return { ok: true as const, provedor: "twilio" as const };
    } catch {
      /* tenta webhook */
    }
  }

  const url = (process.env.AGENDAR_SMS_URL || "").trim();
  if (!url) return { ok: false as const, motivo: "SMS não configurado." };
  const auth = (process.env.AGENDAR_SMS_TOKEN || "").trim();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify({
        telefone: opts.telefoneDigitos.startsWith("55") ? opts.telefoneDigitos : `55${opts.telefoneDigitos}`,
        to: e164Brasil(opts.telefoneDigitos),
        mensagem: bodyTexto,
      }),
    });
    if (!res.ok) return { ok: false as const, motivo: (await res.text()).slice(0, 160) };
    return { ok: true as const, provedor: "webhook" as const };
  } catch (e) {
    return { ok: false as const, motivo: e instanceof Error ? e.message : "Falha no SMS" };
  }
}
