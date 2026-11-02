import type { EntradaAutomacao } from "./tipos";
import { templateIdDoNicho } from "./carregar-exemplo";
import { ehFicticio, enderecoCompleto } from "./limpar-exemplo";

function soDigitos(v: string) {
  return v.replace(/\D/g, "");
}

function rotuloTel(digitos: string) {
  const d = soDigitos(digitos);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}

function whatsappE164(raw: string) {
  let d = soDigitos(raw);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}

/** Preenche empresa / meta / seo básicos a partir dos dados do cliente. */
export function aplicarDadosCliente(site: Record<string, unknown>, entrada: EntradaAutomacao) {
  const meta = { ...(site.meta as Record<string, unknown>) };
  meta.nicho = entrada.nicho;
  meta.template_id = templateIdDoNicho(entrada.nicho);
  meta.schema_version = "1.0.0";
  meta.locale = "pt-BR";
  site.meta = meta;

  const empresa = { ...(site.empresa as Record<string, unknown>) };
  empresa.nome = entrada.nome;
  if (entrada.slogan) empresa.slogan = entrada.slogan;
  if (entrada.cnpj) empresa.cnpj = entrada.cnpj;
  if (entrada.email) empresa.email = entrada.email;

  if (entrada.whatsapp) {
    const wa = whatsappE164(entrada.whatsapp);
    empresa.whatsapp = wa;
    empresa.whatsapp_label = rotuloTel(wa.startsWith("55") ? wa.slice(2) : wa);
    empresa.whatsapp_mensagem = `Olá, vim pelo site de ${entrada.nome} e quero agendar um horário.`;
    empresa.whatsapp_aria = `Chamar ${entrada.nome} no WhatsApp`;
    const tel = soDigitos(entrada.telefone || wa.replace(/^55/, ""));
    if (/^[0-9]{10,13}$/.test(tel)) {
      empresa.telefone = tel;
      empresa.telefone_label = rotuloTel(tel);
    }
  } else if (entrada.telefone) {
    const dig = soDigitos(entrada.telefone);
    empresa.telefone = dig;
    empresa.telefone_label = rotuloTel(dig);
  }

  const endereco = { ...((empresa.endereco as Record<string, unknown>) || {}) };
  endereco.logradouro = ehFicticio(entrada.logradouro) ? "" : entrada.logradouro || "";
  endereco.numero = entrada.numero || "";
  endereco.bairro = ehFicticio(entrada.bairro) ? "" : entrada.bairro || "";
  endereco.cidade = ehFicticio(entrada.cidade) ? "" : entrada.cidade || "";
  endereco.estado = entrada.estado || "";
  endereco.cep = entrada.cep || "";
  endereco.completo = enderecoCompleto(entrada);
  empresa.endereco = endereco;

  const logo = { ...((empresa.logo as Record<string, unknown>) || {}) };
  logo.alt = entrada.nome;
  empresa.logo = logo;
  site.empresa = empresa;

  const cidade = String(endereco.cidade || entrada.cidade || "");
  const seo = { ...(site.seo as Record<string, unknown>) };
  seo.title = cidade ? `${entrada.nome} | ${cidade}` : entrada.nome;
  seo.og_title = seo.title;
  if (!seo.description) {
    seo.description = `Site de ${entrada.nome}${cidade ? ` em ${cidade}` : ""}. Agende pelo WhatsApp.`;
  }
  site.seo = seo;

  return site;
}
