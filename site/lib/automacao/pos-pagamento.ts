import { contato } from "@/lib/contato";
import { gravarPacote, lerPacote, sanitizarToken, type PacotePrototipo } from "@/lib/prototipos/cofre";
import { atualizarStatusJob, registrarJobAprovado } from "@/lib/prototipos/ops";
import { dnaSitePadrao, slugRepoCliente } from "@/lib/sites/dna";
import { provisionarSiteCliente } from "@/lib/sites/provisionar";
import { siteBase } from "@/lib/pedidos/compra";

/**
 * Disparado após pagamento confirmado (webhook Asaas).
 * Marca integração, gera pacote DNA/git e avisa a equipe GuiX.
 */
export async function executarPosPagamento(opts: {
  previewId: string;
  cobrancaId: string;
}) {
  const token = sanitizarToken(opts.previewId);
  const passos: string[] = [];
  let pacote: PacotePrototipo | null = null;

  try {
    pacote = await lerPacote(token);
  } catch {
    pacote = null;
  }

  if (pacote) {
    pacote = {
      ...pacote,
      status: "em_integracao",
    };
    await gravarPacote(pacote);
    passos.push("pacote→em_integracao");
  }

  try {
    await atualizarStatusJob(token, "em_integracao");
    passos.push("ops→em_integracao");
  } catch {
    /* registry pode não ter o job se aprovou sem registrar */
  }

  const dna = dnaSitePadrao();
  const clienteId = slugRepoCliente(pacote?.nome || token);
  const provision = await provisionarSiteCliente({
    token,
    clienteId,
    nicho: pacote?.nicho || "generico",
    nome: pacote?.nome || token,
    site: pacote?.site || {},
    cobrancaId: opts.cobrancaId,
    dna,
  });
  passos.push(...provision.passos);

  if (pacote) {
    await registrarJobAprovado({
      token,
      nicho: pacote.nicho,
      nome: pacote.nome,
      cidade: pacote.cidade,
      whatsapp: pacote.whatsapp,
      email: pacote.email,
      aprovadoEm: pacote.aprovadoEm || new Date().toISOString(),
      prazoIntegracao: pacote.prazoIntegracao || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: "em_integracao",
      contratarUrl: `${siteBase()}/contratar?preview=${token}&t=${token}`,
      contaUrl: `${siteBase()}/conta/${token}?t=${token}`,
      visualizarUrl: `${siteBase()}/visualizar/${token}`,
      downloadUrl: `${siteBase()}/api/prototipo/${token}/site.json?t=${token}`,
      contatoCliente: { email: pacote.email, telefone: pacote.whatsapp },
    }).catch(() => undefined);
  }

  const checklist = [
    `PAGAMENTO CONFIRMADO — iniciar integração`,
    `Token: ${token}`,
    `Cobrança Asaas: ${opts.cobrancaId}`,
    `Negócio: ${pacote?.nome || "—"}`,
    `Nicho: ${pacote?.nicho || "—"}`,
    `Repo sugerido: ${provision.repoSugerido}`,
    `ClienteId: ${clienteId}`,
    ``,
    `Checklist GuiX:`,
    `1. Revisar site.json e DNA em R2 (sistema/integracoes/${token}/)`,
    `2. Criar/publicar domínio apontando para o site`,
    `3. Provisionar e-mail @domínio (se plano incluir)`,
    `4. Ligar Supabase do cliente (tabelas DNA) quando habilitado`,
    `5. Marcar Publicado no painel /painel/aprovacoes`,
    ``,
    `Passos automáticos: ${passos.join(" · ") || "nenhum"}`,
    `Avisos: ${provision.avisos.join(" · ") || "—"}`,
    `Conta: ${siteBase()}/conta/${token}?t=${token}`,
  ].join("\n");

  /* E-mail de rastreio completo sai em avisarPagamentoConfirmado (webhook). */
  const waMe = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(checklist)}`;

  return {
    ok: true,
    token,
    status: "em_integracao" as const,
    passos,
    provision,
    checklist,
    ops: { whatsappUrl: waMe },
  };
}
