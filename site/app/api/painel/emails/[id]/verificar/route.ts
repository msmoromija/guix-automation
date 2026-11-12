import { NextRequest, NextResponse } from "next/server";
import { acessoEmailsAutorizado } from "@/lib/emails/acesso";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!acessoEmailsAutorizado(req)) {
    return NextResponse.json({ erro: "Acesso não autorizado." }, { status: 401 });
  }
  return NextResponse.json({
    erro: "A verificação manual foi substituída pelo provisionamento automático.",
  }, { status: 410 });
}
