import { after, NextRequest, NextResponse } from "next/server";
import { acessoEmailsAutorizado } from "@/lib/emails/acesso";
import { listarOrcamentos, type StatusOrcamento } from "@/lib/orcamentos/store";
import { dnsConfigurado } from "@/lib/sites/dns";
import { vercelConfigurado } from "@/lib/sites/vercel-api";
import { zohoConfigurado } from "@/lib/emails/zoho";
import {
  gravarExecucao,
  marcarFalhaExecucao,
  listarExecucoes,
  novaExecucao,
  novoIdExecucao,
  type ExecucaoEmails,
  type StatusEmail,
} from "@/lib/emails/store";
import { MAX_CONTAS, normalizarDominio, provisionarEmails } from "@/lib/emails/provisionar";

export const runtime = "nodejs";
export const maxDuration = 300;

function texto(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  return v.normalize("NFC").trim().slice(0, max);
}

export type ProjetoEmail = {
  id: string;
  cliente: string;
  criadoEm: string;
  statusOrcamento: StatusOrcamento;
  dataAprovacao: string | null;
  dominio: string;
  statusEmail: StatusEmail;
  ultimaExecucaoId: string | null;
  contas: string[];
};

/** Mais recente por projeto. */
function ultimasPorProjeto(execucoes: ExecucaoEmails[]) {
  const mapa = new Map<string, ExecucaoEmails>();
  for (const exec of execucoes) {
    const atual = mapa.get(exec.projetoId);
    if (!atual || exec.criadoEm > atual.criadoEm) mapa.set(exec.projetoId, exec);
  }
  return mapa;
}

export async function GET(req: NextRequest) {
  if (!acessoEmailsAutorizado(req)) return NextResponse.json({ erro: "Acesso não autorizado." }, { status: 401 });

  const [orcamentos, execucoesCompletas] = await Promise.all([listarOrcamentos(200), listarExecucoes(60)]);
  const ultimas = ultimasPorProjeto(execucoesCompletas);
  const integracoes = {
    zoho: {
      configurado: zohoConfigurado(),
      pendentes: [
        ...(!process.env.ZOHO_CLIENT_ID?.trim() ? ["ZOHO_CLIENT_ID"] : []),
        ...(!process.env.ZOHO_CLIENT_SECRET?.trim() ? ["ZOHO_CLIENT_SECRET"] : []),
        ...(!process.env.ZOHO_REFRESH_TOKEN?.trim() ? ["ZOHO_REFRESH_TOKEN"] : []),
      ],
    },
    vercel: {
      configurado: vercelConfigurado() && Boolean(process.env.GUIX_VERCEL_PROJETO?.trim()),
      pendentes: [
        ...(!process.env.VERCEL_TOKEN?.trim() ? ["VERCEL_TOKEN"] : []),
        ...(!process.env.GUIX_VERCEL_PROJETO?.trim() ? ["GUIX_VERCEL_PROJETO"] : []),
      ],
    },
    cloudflare: {
      configurado: dnsConfigurado(),
      pendentes: [
        ...(!(process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim() && !process.env.VERCEL_TOKEN?.trim()
          ? ["CF_API_TOKEN (Cloudflare) ou VERCEL_TOKEN (Vercel DNS)"]
          : []),
      ],
    },
    retomada: {
      configurado: Boolean(process.env.CRON_SECRET?.trim()),
      pendentes: [...(!process.env.CRON_SECRET?.trim() ? ["CRON_SECRET"] : [])],
    },
  };

  const projetos: ProjetoEmail[] = orcamentos.map((o) => {
    const exec = ultimas.get(o.id);
    return {
      id: o.id,
      cliente: o.clienteNome || "Sem nome",
      criadoEm: o.criadoEm,
      statusOrcamento: o.status,
      dataAprovacao: o.pagoEm || null,
      dominio: exec?.dominio || o.dominio || "",
      statusEmail: exec?.status || "pendente",
      ultimaExecucaoId: exec?.id || null,
      contas: exec?.contas || [],
    };
  });

  // Histórico resumido: o detalhe (passos/logs) vem por GET /api/painel/emails/{id}.
  const execucoes = execucoesCompletas.map((e) => ({
    id: e.id,
    projetoId: e.projetoId,
    cliente: e.cliente,
    dominio: e.dominio,
    status: e.status,
    usuario: e.usuario,
    criadoEm: e.criadoEm,
    concluidoEm: e.concluidoEm ?? null,
    contas: e.contasCriadas.length,
  }));

  return NextResponse.json({ ok: true, projetos, execucoes, integracoes });
}

export async function POST(req: NextRequest) {
  if (!acessoEmailsAutorizado(req)) return NextResponse.json({ erro: "Acesso não autorizado." }, { status: 401 });
  if (
    !zohoConfigurado() ||
    !dnsConfigurado() ||
    !vercelConfigurado() ||
    !process.env.GUIX_VERCEL_PROJETO?.trim()
  ) {
    const faltantes = [
      ...(!process.env.ZOHO_CLIENT_ID?.trim() ? ["ZOHO_CLIENT_ID"] : []),
      ...(!process.env.ZOHO_CLIENT_SECRET?.trim() ? ["ZOHO_CLIENT_SECRET"] : []),
      ...(!process.env.ZOHO_REFRESH_TOKEN?.trim() ? ["ZOHO_REFRESH_TOKEN"] : []),
      ...(!dnsConfigurado() ? ["CF_API_TOKEN (Cloudflare) ou VERCEL_TOKEN (Vercel DNS)"] : []),
      ...(!process.env.VERCEL_TOKEN?.trim() ? ["VERCEL_TOKEN"] : []),
      ...(!process.env.GUIX_VERCEL_PROJETO?.trim() ? ["GUIX_VERCEL_PROJETO"] : []),
    ];
    return NextResponse.json({
      erro: "O provisionamento está bloqueado até configurar as integrações obrigatórias no ambiente de produção.",
      faltantes,
    }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));

  const projetoId = texto(body.projetoId, 60);
  if (!projetoId) return NextResponse.json({ erro: "Informe o projeto." }, { status: 400 });

  const orcamento = (await listarOrcamentos(200)).find((o) => o.id === projetoId);
  if (!orcamento) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });

  const dominio = normalizarDominio(texto(body.dominio, 180) || orcamento.dominio || "");
  const partesDominio = dominio.split(".");
  if (
    dominio.length > 253 ||
    partesDominio.length < 2 ||
    !/^[a-z0-9.-]+$/.test(dominio) ||
    !partesDominio.at(-1)?.match(/^[a-z]{2,}$/) ||
    partesDominio.some((parte) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(parte))
  ) {
    return NextResponse.json({ erro: "Informe um domínio válido (ex.: cliente.com.br)." }, { status: 400 });
  }

  const brutas = Array.isArray(body.contas) ? body.contas : [];
  const contas = [
    ...new Set(
      brutas
        .map((c: unknown) => texto(c, 120).toLowerCase())
        .filter((c: string) => /^[^@\s]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(c) && c.endsWith(`@${dominio}`)),
    ),
  ].slice(0, MAX_CONTAS) as string[];

  if (contas.length === 0) {
    return NextResponse.json({ erro: "Informe pelo menos uma caixa de e-mail." }, { status: 400 });
  }

  const cliente = texto(body.cliente, 120) || orcamento.clienteNome || "Cliente";
  const usuario = texto(body.usuario, 60) || "suporte";
  const id = novoIdExecucao();

  await gravarExecucao(novaExecucao({
    id, projetoId, cliente, dominio, contas, usuario,
  }));

  after(async () => {
    await provisionarEmails({ id, projetoId, cliente, dominio, contas, usuario }).catch((erro) => {
      console.error("provisionar emails", erro);
      return marcarFalhaExecucao(id, erro);
    });
  });

  return NextResponse.json({ ok: true, id });
}
