import type { Lead, TemplateMensagem } from "./tipos";

export type VarsMensagem = {
  nome: string;
  cidade: string;
  nicho: string;
  modelo_url: string;
};

/**
 * Renderiza um template substituindo placeholders:
 * {{nome}}, {{cidade}}, {{nicho}}, {{modelo_url}}
 */
export function renderizarTemplate(
  template: TemplateMensagem | undefined,
  vars: VarsMensagem,
): string {
  let texto = template?.texto || "";
  texto = texto.replace(/\{\{nome\}\}/g, vars.nome);
  texto = texto.replace(/\{\{cidade\}\}/g, vars.cidade);
  texto = texto.replace(/\{\{nicho\}\}/g, vars.nicho);
  texto = texto.replace(/\{\{modelo_url\}\}/g, vars.modelo_url);
  return texto.trim();
}

export function varsDoLead(
  lead: Pick<Lead, "nome" | "cidade" | "nicho" | "modelo_usado">,
  modeloUrl: string,
): VarsMensagem {
  return {
    nome: lead.nome,
    cidade: lead.cidade,
    nicho: lead.nicho,
    modelo_url: lead.modelo_usado || modeloUrl,
  };
}

/** Normaliza um número brasileiro para formato internacional (55 + DDD + número). */
export function telefoneParaWa(raw: string): string {
  const digitos = String(raw || "").replace(/\D/g, "");
  if (!digitos) return "";
  // Se já começar com 55, usa como está; senão adiciona 55.
  if (digitos.startsWith("55")) return digitos;
  return `55${digitos}`;
}

export function linkWhatsApp(telefone: string, mensagem: string): string {
  const tel = telefoneParaWa(telefone);
  const params = new URLSearchParams({ text: mensagem });
  return `https://wa.me/${tel}?${params.toString()}`;
}
