import { NextRequest, NextResponse } from "next/server";
import { lerPacote, sanitizarToken } from "@/lib/prototipos/cofre";
import { montarExtratoPdf } from "@/lib/prototipos/extrato-pdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = sanitizarToken(req.nextUrl.searchParams.get("t") || id);
  const pacote = await lerPacote(token);
  if (!pacote || pacote.token !== sanitizarToken(id)) {
    return NextResponse.json({ erro: "Protótipo inválido ou expirado." }, { status: 404 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://guix.net.br").replace(/\/$/, "");
  const empresa = pacote.site.empresa as { nome?: string; slogan?: string } | undefined;
  const pdf = montarExtratoPdf({
    nome: empresa?.nome || pacote.nome,
    token: pacote.token,
    nicho: pacote.nicho,
    status: pacote.status || (pacote.edicaoFechada ? "aprovado" : "rascunho"),
    aprovadoEm: pacote.aprovadoEm ? new Date(pacote.aprovadoEm).toLocaleString("pt-BR") : undefined,
    prazoIntegracao: pacote.prazoIntegracao
      ? new Date(pacote.prazoIntegracao).toLocaleString("pt-BR")
      : undefined,
    slogan: empresa?.slogan || pacote.slogan,
    contaUrl: `${base}/conta/${pacote.token}?t=${pacote.token}`,
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="guix-extrato-${pacote.token}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
