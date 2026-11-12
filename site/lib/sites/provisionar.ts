import { enviarBuffer } from "@/lib/media/r2";
import type { DnaSite } from "./dna";

export type ResultadoProvision = {
  ok: boolean;
  repoSugerido: string;
  chavePacote: string;
  passos: string[];
  avisos: string[];
};

/**
 * Grava o pacote de integração do site-cliente (DNA + site.json + checklist)
 * no R2 para a equipe/CI consumir. Push git remoto fica para o runner com
 * GUIX_SITES_GIT_TOKEN (ainda não embutido no runtime Vercel).
 */
export async function provisionarSiteCliente(opts: {
  token: string;
  clienteId: string;
  nicho: string;
  nome: string;
  site: Record<string, unknown>;
  cobrancaId: string;
  dna: DnaSite;
}): Promise<ResultadoProvision> {
  const passos: string[] = [];
  const avisos: string[] = [];
  const repoSugerido = `${opts.dna.git.prefixoRepo}${opts.clienteId}`;
  const chavePacote = `sistema/integracoes/${opts.token}/pacote.json`;

  const pacote = {
    geradoEm: new Date().toISOString(),
    token: opts.token,
    cobrancaId: opts.cobrancaId,
    clienteId: opts.clienteId,
    nicho: opts.nicho,
    nome: opts.nome,
    repoSugerido,
    org: opts.dna.git.org,
    branch: opts.dna.git.branchPadrao,
    template: opts.dna.git.template,
    dna: {
      ...opts.dna,
      supabase: {
        ...opts.dna.supabase,
        /** Liga quando SUPABASE_* estiverem no deploy do cliente. */
        habilitado: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
    },
    site: opts.site,
    checklist: [
      "Baixar pacote.zip do pedido (painel) ou R2",
      "Rodar: node scripts/processar-pacote-zip.mjs --zip pacote.zip",
      "Conferir npm run dev no clientes/<slug>/repo",
      "Push do repo site-<cliente> + deploy Vercel",
      "Publicar domínio do cliente + e-mail profissional",
      "Ativar Supabase (clientes, agendamentos, sessoes_otp, mensagens) se necessário",
      "Marcar status publicado no painel GuiX",
    ],
    comandoLocal: `node scripts/processar-pacote-zip.mjs --zip caminho/pacote.zip --cliente ${opts.clienteId}`,
    comandoPedido: `node scripts/baixar-e-processar-pedido.mjs --pedido ${opts.cobrancaId}`,
  };

  try {
    await enviarBuffer({
      key: chavePacote,
      body: Buffer.from(JSON.stringify(pacote, null, 2)),
      contentType: "application/json",
      origem: "biblioteca",
      alt: "pacote integracao",
      tags: ["integracao", opts.token, opts.clienteId],
      status: "aprovada",
      clienteId: `t${opts.token}`,
    });
    passos.push("r2:pacote_integracao");
  } catch (e) {
    avisos.push(e instanceof Error ? e.message : "Falha ao gravar pacote no R2");
  }

  try {
    await enviarBuffer({
      key: `sistema/integracoes/${opts.token}/site.json`,
      body: Buffer.from(JSON.stringify(opts.site, null, 2)),
      contentType: "application/json",
      origem: "biblioteca",
      alt: "site.json integracao",
      tags: ["integracao", "site-json", opts.token],
      status: "aprovada",
      clienteId: `t${opts.token}`,
    });
    passos.push("r2:site_json");
  } catch {
    avisos.push("site.json da integração não gravou no R2");
  }

  const gitToken = (process.env.GUIX_SITES_GIT_TOKEN || "").trim();
  if (!gitToken) {
    avisos.push("GUIX_SITES_GIT_TOKEN ausente — push do repo fica manual/CI.");
  } else {
    avisos.push("Token git presente: use o runner CI para `criar-repo-site` + push (não executado no request HTTP).");
    passos.push("git:token_ok");
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    avisos.push("Supabase hub sem SERVICE_ROLE — tabelas do cliente ficam no checklist.");
  } else {
    passos.push("supabase:hub_configurado");
  }

  return {
    ok: avisos.length === 0 || passos.includes("r2:pacote_integracao"),
    repoSugerido,
    chavePacote,
    passos,
    avisos,
  };
}
