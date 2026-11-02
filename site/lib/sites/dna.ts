/**
 * DNA do site-cliente GuiX — pré-configuração comum a todo negócio gerado.
 * Agenda, mensagens e (em seguida) Supabase/git nascem daqui, não de cópia manual.
 */

export type DnaConectividade = {
  agendamento: boolean;
  whatsappFlutuante: boolean;
  otpEmail: boolean;
  otpSms: boolean;
  notificarNegocioWhatsapp: boolean;
  notificarNegocioEmail: boolean;
  cancelamentoAntecedenciaHoras: number;
};

export type DnaSupabase = {
  habilitado: boolean;
  /** Schema lógico — tabelas esperadas no projeto do cliente. */
  tabelas: string[];
  authClientes: boolean;
};

export type DnaGit = {
  org: string;
  prefixoRepo: string;
  branchPadrao: string;
  template: "casas-vite" | "next-site";
};

export type DnaSite = {
  versao: "1.0.0";
  conectividade: DnaConectividade;
  supabase: DnaSupabase;
  git: DnaGit;
  envObrigatorias: string[];
  envOpcionais: string[];
};

/** DNA padrão de todo site novo provisionado pelo motor. */
export function dnaSitePadrao(): DnaSite {
  return {
    versao: "1.0.0",
    conectividade: {
      agendamento: true,
      whatsappFlutuante: true,
      otpEmail: true,
      otpSms: true,
      notificarNegocioWhatsapp: true,
      notificarNegocioEmail: true,
      cancelamentoAntecedenciaHoras: 3,
    },
    supabase: {
      habilitado: false,
      tabelas: ["clientes", "agendamentos", "sessoes_otp", "mensagens"],
      authClientes: true,
    },
    git: {
      org: process.env.GUIX_SITES_GIT_ORG || "guix-sites",
      prefixoRepo: "site-",
      branchPadrao: "main",
      template: "casas-vite",
    },
    envObrigatorias: ["NEXT_PUBLIC_SITE_URL", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
    envOpcionais: [
      "OPENAI_API_KEY",
      "RESEND_API_KEY",
      "RESEND_FROM",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_FROM_NUMBER",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  };
}

export function slugRepoCliente(clienteId: string) {
  const limpo = clienteId
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const dna = dnaSitePadrao();
  return `${dna.git.prefixoRepo}${limpo || "cliente"}`;
}
