import { contato } from "@/lib/contato";
import { baixarObjeto, enviarBuffer } from "@/lib/media/r2";
import { siteBase, type PedidoCompra } from "@/lib/pedidos/compra";
import type { PacotePrototipo } from "@/lib/prototipos/cofre";
import { atualizarStatusJob, registrarJobAprovado, type JobAprovado } from "@/lib/prototipos/ops";
import {
  avisarClienteEmIntegracao,
  avisarClienteFilaPublicacao,
  avisarClienteSitePublicado,
} from "@/lib/automacao/emails-institucionais";
import { provisionarRepoGithub, githubConfigurado } from "./github";
import { provisionarProjetoVercel, vercelConfigurado } from "./vercel-api";
import {
  cloudflareDnsConfigurado,
  provisionarDnsVercel,
  provisionarEmailRouting,
} from "./cloudflare-dns";
import { dnaSitePadrao, slugRepoCliente } from "./dna";
import { provisionarSiteCliente } from "./provisionar";
import type { Nicho } from "@/lib/media/tipos";

type RunnerSnapshot = {
  cobrancaId?: string;
  status?: string;
  emails?: { integracao?: boolean; publicado?: boolean; fila?: boolean };
  githubOk?: boolean;
  vercelOk?: boolean;
};

const NICHOS_OK: Nicho[] = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "dentista",
  "clinica",
  "psicologia",
  "nutricionista",
];

function nichoSeguro(raw: string): Nicho {
  const n = raw.toLowerCase().trim() as Nicho;
  if (NICHOS_OK.includes(n)) return n;
  if (n === "generico") return "barbearia";
  return "barbearia";
}

function autoProvisionLigado() {
  const v = (process.env.GUIX_AUTO_PROVISION || "1").trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

function slugCliente(nome: string, token: string) {
  return slugRepoCliente(nome || token).replace(/^site-/, "") || token.slice(0, 24);
}

function arquivosDoPacote(opts: {
  clienteId: string;
  nicho: string;
  nome: string;
  token: string;
  cobrancaId: string;
  site: Record<string, unknown>;
  visual: unknown;
  meta: Record<string, unknown>;
  dna: unknown;
}) {
  const readme = `# ${opts.nome}

Site-cliente GuiX (\`${opts.clienteId}\` / ${opts.nicho}).

## Conteúdo deste commit
- \`config/site.json\` — contrato 1.0.0
- \`config/visual.json\` — layout / agenda
- \`config/meta.json\` — dados do pedido
- \`config/dna.json\` — conectividade

## Montar o app localmente (monorepo GuiX)
\`\`\`bash
node scripts/baixar-e-processar-pedido.mjs --pedido ${opts.cobrancaId}
node scripts/processar-pacote-zip.mjs --zip pacote.zip --cliente ${opts.clienteId}
\`\`\`

Token protótipo: \`${opts.token}\`
`;

  return {
    "README.md": readme,
    "CHECKLIST.md": `# Checklist ${opts.nome}\n\n- [x] Pacote commitado via runner pós-pago\n- [ ] npm run build no template do nicho\n- [ ] Domínio + e-mail\n- [ ] Marcar publicado no painel\n`,
    "config/site.json": JSON.stringify(opts.site, null, 2),
    "config/visual.json": JSON.stringify(opts.visual ?? {}, null, 2),
    "config/meta.json": JSON.stringify(opts.meta, null, 2),
    "config/dna.json": JSON.stringify(opts.dna, null, 2),
    "guix.json": JSON.stringify(
      {
        versao: "1.0",
        clienteId: opts.clienteId,
        nicho: opts.nicho,
        token: opts.token,
        cobrancaId: opts.cobrancaId,
        geradoEm: new Date().toISOString(),
      },
      null,
      2,
    ),
  };
}

async function lerRunnerAnterior(token: string): Promise<RunnerSnapshot | null> {
  try {
    const buf = await baixarObjeto(`sistema/integracoes/${token}/runner.json`);
    return JSON.parse(buf.toString("utf8")) as RunnerSnapshot;
  } catch {
    return null;
  }
}

function comTimeout<T>(p: Promise<T>, ms: number, rotulo: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${rotulo} (${ms}ms)`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export type ResultadoRunner = {
  ok: boolean;
  clienteId: string;
  status: "em_integracao" | "publicado" | "pago";
  passos: string[];
  avisos: string[];
  idempotente?: boolean;
  github?: Awaited<ReturnType<typeof provisionarRepoGithub>>;
  vercel?: Awaited<ReturnType<typeof provisionarProjetoVercel>>;
  dns?: Awaited<ReturnType<typeof provisionarDnsVercel>>;
  email?: Awaited<ReturnType<typeof provisionarEmailRouting>>;
  provision?: Awaited<ReturnType<typeof provisionarSiteCliente>>;
  job?: JobAprovado | null;
  emails?: { integracao?: unknown; publicado?: unknown; fila?: unknown };
};

/**
 * Orquestra o que for possível após o pagamento.
 * Idempotente por cobrança: reentrega do webhook Asaas não reenvia e-mails nem republica.
 */
export async function executarRunnerPosPago(opts: {
  token: string;
  cobrancaId: string;
  pacote: PacotePrototipo | null;
  pedido?: PedidoCompra | null;
  dominio?: string | null;
  /** Se true, não manda e-mail de integração (o de pagamento já foi). Default true no webhook. */
  silenciarEmailIntegracao?: boolean;
}): Promise<ResultadoRunner> {
  const passos: string[] = [];
  const avisos: string[] = [];
  const token = opts.token;
  const pacote = opts.pacote;
  const nome = pacote?.nome || opts.pedido?.cliente.nome || token;
  const nicho = nichoSeguro(String(pacote?.nicho || opts.pedido?.nichoId || "barbearia"));
  const clienteId = slugCliente(nome, token);
  const dominio =
    (opts.dominio || process.env.GUIX_DOMINIO_CLIENTE || "").trim().replace(/^https?:\/\//, "") || "";

  const anterior = await lerRunnerAnterior(token);
  if (anterior?.cobrancaId === opts.cobrancaId && (anterior.status === "publicado" || anterior.githubOk)) {
    passos.push("idempotente:runner_ja_executado");
    return {
      ok: true,
      clienteId,
      status: (anterior.status as ResultadoRunner["status"]) || "em_integracao",
      passos,
      avisos: ["Webhook repetido — runner já havia rodado para esta cobrança."],
      idempotente: true,
    };
  }

  const dna = dnaSitePadrao();
  const provision = await provisionarSiteCliente({
    token,
    clienteId,
    nicho,
    nome,
    site: (pacote?.site || {}) as Record<string, unknown>,
    cobrancaId: opts.cobrancaId,
    dna,
  });
  passos.push(...provision.passos);
  avisos.push(...provision.avisos);

  const meta = {
    token,
    cobrancaId: opts.cobrancaId,
    nome,
    nicho,
    cidade: pacote?.cidade || "",
    whatsapp: pacote?.whatsapp || opts.pedido?.cliente.telefone || "",
    email: pacote?.email || opts.pedido?.cliente.email || "",
    geradoEm: new Date().toISOString(),
  };

  let github: ResultadoRunner["github"];
  let vercel: ResultadoRunner["vercel"];
  let dns: ResultadoRunner["dns"];
  let emailDns: ResultadoRunner["email"];

  if (autoProvisionLigado() && githubConfigurado()) {
    try {
      github = await comTimeout(
        provisionarRepoGithub({
          clienteId,
          nome,
          arquivos: arquivosDoPacote({
            clienteId,
            nicho,
            nome,
            token,
            cobrancaId: opts.cobrancaId,
            site: (pacote?.site || {}) as Record<string, unknown>,
            visual: pacote?.visual || {},
            meta,
            dna: {
              ...dna,
              clienteId,
              nicho,
              nome,
              supabase: {
                ...dna.supabase,
                habilitado: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
              },
            },
          }),
        }),
        25_000,
        "github",
      );
      passos.push(...(github.passos || []));
      avisos.push(...(github.avisos || []));
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : "github falhou");
      github = { ok: false, passos: [], avisos: [String(e)] };
    }
  } else if (!githubConfigurado()) {
    avisos.push("GitHub: defina GUIX_SITES_GIT_TOKEN para criar o repo automaticamente.");
  }

  const githubPronto = Boolean(github?.ok && github.repo);

  if (autoProvisionLigado() && vercelConfigurado() && githubPronto && github?.repo) {
    try {
      vercel = await comTimeout(
        provisionarProjetoVercel({
          projetoNome: `site-${clienteId}`,
          githubRepo: github.repo,
          framework: "vite",
          dominio: dominio || undefined,
        }),
        20_000,
        "vercel",
      );
      passos.push(...(vercel.passos || []));
      avisos.push(...(vercel.avisos || []));
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : "vercel falhou");
      vercel = { ok: false, passos: [], avisos: [String(e)] };
    }
  } else if (!vercelConfigurado()) {
    avisos.push("Vercel: defina VERCEL_TOKEN (+ VERCEL_TEAM_ID) para criar o projeto automaticamente.");
  }

  if (dominio && cloudflareDnsConfigurado()) {
    try {
      dns = await comTimeout(provisionarDnsVercel({ dominio }), 15_000, "dns");
      passos.push(...(dns.passos || []));
      avisos.push(...(dns.avisos || []));
      emailDns = await comTimeout(
        provisionarEmailRouting({
          dominio,
          destino: (process.env.GUIX_EMAIL_FORWARD_TO || contato.email).trim(),
        }),
        15_000,
        "email-routing",
      );
      passos.push(...(emailDns.passos || []));
      avisos.push(...(emailDns.avisos || []));
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : "dns/email falhou");
    }
  } else if (dominio && !cloudflareDnsConfigurado()) {
    avisos.push("DNS: verifique CF_API_TOKEN (Zone Read + DNS Edit) e se a zona ativa do domínio está na conta.");
  }

  const vercelSolido =
    Boolean(vercel?.ok) &&
    Boolean(vercel?.projectId) &&
    !(vercel?.avisos || []).some((a) => /sem git/i.test(a));

  const forcarPublicar = (process.env.GUIX_AUTO_PUBLICAR || "").trim() === "1" && githubPronto;
  const autoPublicar = forcarPublicar || (githubPronto && vercelSolido);

  let status: ResultadoRunner["status"] = "em_integracao";
  if (autoPublicar) status = "publicado";

  const jobBase: JobAprovado = {
    token,
    nicho,
    nome,
    cidade: pacote?.cidade,
    whatsapp: pacote?.whatsapp || opts.pedido?.cliente.telefone,
    email: pacote?.email || opts.pedido?.cliente.email,
    aprovadoEm: pacote?.aprovadoEm || new Date().toISOString(),
    prazoIntegracao: pacote?.prazoIntegracao || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    status,
    contratarUrl: `${siteBase()}/contratar?preview=${token}&t=${token}`,
    contaUrl: `${siteBase()}/conta/${token}?t=${token}`,
    visualizarUrl: dominio ? `https://${dominio}` : `${siteBase()}/visualizar/${token}`,
    downloadUrl: `${siteBase()}/api/prototipo/${token}/site.json?t=${token}`,
    contatoCliente: {
      email: pacote?.email || opts.pedido?.cliente.email,
      telefone: pacote?.whatsapp || opts.pedido?.cliente.telefone,
    },
  };

  let job: JobAprovado | null = null;
  try {
    job = await registrarJobAprovado(jobBase);
    await atualizarStatusJob(token, status);
    passos.push(`ops→${status}`);
  } catch {
    avisos.push("Registry de aprovações não atualizou");
  }

  const emails: ResultadoRunner["emails"] = {};
  const jaIntegracao = Boolean(anterior?.emails?.integracao);
  const jaPublicado = Boolean(anterior?.emails?.publicado);
  const jaFila = Boolean(anterior?.emails?.fila);
  const silenciarIntegracao = opts.silenciarEmailIntegracao !== false;

  if (job) {
    try {
      if (status === "publicado" && !jaPublicado) {
        emails.publicado = await avisarClienteSitePublicado(job);
      } else if (!silenciarIntegracao && status === "em_integracao") {
        // Webhook já manda e-mail de pagamento com checklist — não duplicar.
        // Aqui: fila curta (painel / progresso real) 1×.
        if (!jaFila && !jaPublicado) {
          emails.fila = await avisarClienteFilaPublicacao(job);
        } else if (!jaIntegracao && githubPronto) {
          emails.integracao = await avisarClienteEmIntegracao(job);
        }
      }
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : "falha e-mail status");
    }
  }

  try {
    await enviarBuffer({
      key: `sistema/integracoes/${token}/runner.json`,
      body: Buffer.from(
        JSON.stringify(
          {
            geradoEm: new Date().toISOString(),
            cobrancaId: opts.cobrancaId,
            status,
            clienteId,
            passos,
            avisos,
            githubOk: githubPronto,
            vercelOk: vercelSolido,
            github,
            vercel,
            dns,
            email: emailDns,
            dominio: dominio || null,
            emails: {
              integracao: Boolean(emails.integracao) || jaIntegracao,
              publicado: Boolean(emails.publicado) || jaPublicado,
              fila: Boolean(emails.fila) || jaFila,
            },
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
      origem: "biblioteca",
      alt: "runner pos-pago",
      tags: ["integracao", "runner", token],
      status: "aprovada",
      clienteId: `t${token}`,
    });
    passos.push("r2:runner_json");
  } catch {
    avisos.push("runner.json não gravou no R2");
  }

  return {
    ok: provision.ok || githubPronto,
    clienteId,
    status,
    passos,
    avisos,
    github,
    vercel,
    dns,
    email: emailDns,
    provision,
    job,
    emails,
  };
}
