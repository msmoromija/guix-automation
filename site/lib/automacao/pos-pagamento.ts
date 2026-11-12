import { contato } from "@/lib/contato";
import { gravarPacote, lerPacote, lerPacoteBruto, sanitizarToken, type PacotePrototipo } from "@/lib/prototipos/cofre";
import { siteBase, type PedidoCompra } from "@/lib/pedidos/compra";
import { executarRunnerPosPago } from "@/lib/sites/runner-pos-pago";
import { gerarSiteCliente } from "@/lib/automacao/gerar-site";
import type { Nicho } from "@/lib/media/tipos";

const NICHOS: Nicho[] = [
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

function nichoOk(raw: string): Nicho {
  const n = raw.toLowerCase().trim() as Nicho;
  return NICHOS.includes(n) ? n : "barbearia";
}

/**
 * Compra sem protótipo: gera site.json mínimo a partir do nicho + dados do pedido
 * e grava um pacote sintético para o runner.
 * No webhook: sem OpenAI (rápido) — evita estourar o timeout do Asaas.
 */
async function garantirPacote(opts: {
  previewId?: string | null;
  pedido?: PedidoCompra | null;
  cobrancaId: string;
  rapido?: boolean;
}): Promise<{ token: string; pacote: PacotePrototipo | null }> {
  const preview = opts.previewId ? sanitizarToken(opts.previewId) : "";
  if (preview) {
    const pacote = (await lerPacote(preview)) || (await lerPacoteBruto(preview));
    if (pacote) {
      const atualizado: PacotePrototipo = { ...pacote, status: "em_integracao" };
      await gravarPacote(atualizado);
      return { token: sanitizarToken(pacote.token) || preview, pacote: atualizado };
    }
  }

  const ped = opts.pedido;
  if (!ped) return { token: preview || sanitizarToken(opts.cobrancaId) || opts.cobrancaId.slice(0, 16), pacote: null };

  const token =
    preview ||
    sanitizarToken(`p${opts.cobrancaId}`) ||
    sanitizarToken(opts.cobrancaId) ||
    opts.cobrancaId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  const nicho = nichoOk(ped.nichoId);
  try {
    const gerado = await gerarSiteCliente(
      {
        clienteId: token,
        nicho,
        nome: ped.cliente.nome || ped.nichoNome || "Negócio",
        whatsapp: ped.cliente.telefone,
        email: ped.cliente.email,
        // Webhook: sem IA — timeout. Painel/CI pode regenerar com OpenAI depois.
        iaEscreve: opts.rapido ? false : Boolean(process.env.OPENAI_API_KEY),
      },
      { gravarPacote: false },
    );
    const agora = new Date().toISOString();
    const pacote: PacotePrototipo = {
      token,
      nicho,
      nome: ped.cliente.nome || ped.nichoNome,
      whatsapp: ped.cliente.telefone,
      email: ped.cliente.email,
      site: gerado.site,
      status: "em_integracao",
      criadoEm: agora,
      expiraEm: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      edicaoFechada: true,
    };
    await gravarPacote(pacote);
    return { token, pacote };
  } catch (e) {
    console.error("pacote sintetico", e);
    return { token, pacote: null };
  }
}

/**
 * Disparado após pagamento confirmado (webhook Asaas).
 * Marca integração, grava DNA no R2 e tenta GitHub/Vercel/DNS conforme envs.
 */
export async function executarPosPagamento(opts: {
  previewId?: string | null;
  cobrancaId: string;
  pedido?: PedidoCompra | null;
  dominio?: string | null;
}) {
  const passos: string[] = [];
  const { token, pacote } = await garantirPacote({
    previewId: opts.previewId,
    pedido: opts.pedido,
    cobrancaId: opts.cobrancaId,
    rapido: true,
  });
  if (pacote) passos.push("pacote→em_integracao");
  else passos.push("pacote:ausente");

  const runner = await executarRunnerPosPago({
    token,
    cobrancaId: opts.cobrancaId,
    pacote,
    pedido: opts.pedido || null,
    dominio: opts.dominio,
    // Pagamento já manda e-mail com próximos passos; integração só se repo nascer (no runner).
    silenciarEmailIntegracao: true,
  });
  passos.push(...runner.passos);

  const checklist = [
    `PAGAMENTO CONFIRMADO — runner pós-pago`,
    `Token: ${token}`,
    `Cobrança Asaas: ${opts.cobrancaId}`,
    `Negócio: ${pacote?.nome || opts.pedido?.cliente.nome || "—"}`,
    `Nicho: ${pacote?.nicho || opts.pedido?.nichoId || "—"}`,
    `ClienteId: ${runner.clienteId}`,
    `Status: ${runner.status}`,
    runner.idempotente ? `Idempotente: sim (webhook repetido)` : "",
    ``,
    `Automático:`,
    `· GitHub: ${runner.github?.htmlUrl || (runner.github?.ok ? "ok" : "pendente — GUIX_SITES_GIT_TOKEN")}`,
    `· Vercel: ${runner.vercel?.dashboardUrl || (runner.vercel?.ok ? "ok" : "pendente — VERCEL_TOKEN")}`,
    `· DNS: ${runner.dns?.registros?.join(", ") || (runner.dns?.ok ? "ok" : "pendente — acesso à zona Cloudflare")}`,
    `· E-mail: ${runner.email?.registros?.join(", ") || "manual se routing falhar"}`,
    ``,
    `Se algo faltou:`,
    `1. node scripts/baixar-e-processar-pedido.mjs --pedido ${opts.cobrancaId}`,
    `2. Conferir npm run dev em clientes/<slug>/repo`,
    `3. Domínio + e-mail + marcar Publicado`,
    ``,
    `Passos: ${passos.filter(Boolean).join(" · ") || "nenhum"}`,
    `Avisos: ${runner.avisos.join(" · ") || "—"}`,
    `Conta: ${siteBase()}/conta/${token}?t=${token}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const waMe = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(checklist)}`;

  return {
    ok: runner.ok,
    token,
    status: runner.status,
    passos,
    runner,
    checklist,
    ops: { whatsappUrl: waMe },
  };
}
