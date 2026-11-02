import { NextRequest, NextResponse } from "next/server";
import {
  gravarAgendamento,
  iniciaEmISO,
  novoCancelToken,
  novoIdAgendamento,
  ocupadosNoDia,
  sanitizarSiteIdPublico,
} from "@/lib/agendamentos/cofre";
import { enviarEmailNegocio, linkWhatsappNegocio, urlCancelamento } from "@/lib/agendamentos/notificar";
import type { Agendamento } from "@/lib/agendamentos/tipos";

export const runtime = "nodejs";
export const maxDuration = 30;

function emailOk(raw: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()) && raw.trim().length <= 120;
}

function telefoneOk(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 || d.length === 11 || (d.startsWith("55") && d.length >= 12 && d.length <= 13);
}

function nomeOk(raw: string) {
  const n = raw.replace(/\s+/g, " ").trim();
  return n.length >= 5 && n.includes(" ");
}

export async function GET(req: NextRequest) {
  const siteId = sanitizarSiteIdPublico(String(req.nextUrl.searchParams.get("siteId") || ""));
  const data = String(req.nextUrl.searchParams.get("data") || "");
  const profissional = String(req.nextUrl.searchParams.get("profissional") || "");
  if (!siteId || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ erro: "Informe siteId e data." }, { status: 400 });
  }
  try {
    const ocupados = await ocupadosNoDia(siteId, data, profissional || undefined);
    return NextResponse.json({ ocupados });
  } catch {
    return NextResponse.json({ ocupados: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = sanitizarSiteIdPublico(String(body.siteId || ""));
    const nomeCompleto = String(body.nomeCompleto || "").replace(/\s+/g, " ").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const telefone = String(body.telefone || "").trim();
    const servico = String(body.servico || "").trim().slice(0, 80);
    const profissional = String(body.profissional || "Sem preferência").trim().slice(0, 80);
    const data = String(body.data || "").trim();
    const hora = String(body.hora || "").trim();
    const negocioNome = String(body.negocioNome || "Negócio").trim().slice(0, 80);
    const negocioWhatsapp = String(body.negocioWhatsapp || "").replace(/\D/g, "");
    const negocioEmail = String(body.negocioEmail || "").trim();
    const nicho = String(body.nicho || "").trim().slice(0, 40);

    if (!siteId) return NextResponse.json({ erro: "Site inválido." }, { status: 400 });
    if (!nomeOk(nomeCompleto)) return NextResponse.json({ erro: "Informe o nome completo." }, { status: 400 });
    if (!emailOk(email)) return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });
    if (!telefoneOk(telefone)) return NextResponse.json({ erro: "Informe o telefone com DDD." }, { status: 400 });
    if (!servico) return NextResponse.json({ erro: "Escolha o serviço." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
      return NextResponse.json({ erro: "Escolha dia e horário." }, { status: 400 });
    }

    const iniciaEm = iniciaEmISO(data, hora);
    if (!iniciaEm || new Date(iniciaEm).getTime() <= Date.now()) {
      return NextResponse.json({ erro: "Escolha um horário futuro." }, { status: 400 });
    }

    const ocupados = await ocupadosNoDia(siteId, data, profissional);
    if (ocupados.some((o) => o.hora === hora && (profissional === "Sem preferência" || o.profissional === profissional))) {
      return NextResponse.json({ erro: "Este horário acabou de ser preenchido. Escolha outro." }, { status: 409 });
    }

    const ag: Agendamento = {
      id: novoIdAgendamento(),
      cancelToken: novoCancelToken(),
      siteId,
      nicho: nicho || undefined,
      negocioNome,
      negocioWhatsapp,
      negocioEmail,
      servico,
      profissional,
      data,
      hora,
      iniciaEm,
      nomeCompleto,
      email,
      telefone,
      status: "confirmado",
      criadoEm: new Date().toISOString(),
    };

    await gravarAgendamento(ag);
    const emailRes = await enviarEmailNegocio(ag, "novo");
    const whatsappUrl = linkWhatsappNegocio(ag, "novo");

    return NextResponse.json({
      ok: true,
      id: ag.id,
      cancelUrl: urlCancelamento(ag),
      whatsappUrl,
      emailEnviado: emailRes.ok,
      aviso: emailRes.ok
        ? ""
        : emailRes.motivo?.includes("RESEND")
          ? "Agendado. O WhatsApp do negócio recebe o aviso; configure RESEND_API_KEY para e-mail automático."
          : emailRes.motivo || "",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json({ erro: msg.includes("R2") ? "Falha ao gravar o agendamento. Tente de novo." : "Não foi possível agendar." }, { status: 500 });
  }
}
