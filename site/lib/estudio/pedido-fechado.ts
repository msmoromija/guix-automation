/**
 * 12 pedidos por rascunho.
 * Cada um manda cerca de 2,5 mil tokens ao gpt-4o-mini (contexto + resposta),
 * então a dúzia fica abaixo de US$ 0,02 e ainda cobre telefone, endereço,
 * horário, textos, preços, visual e logo. A copy automática da simulação
 * não entra nessa conta. No 13º, o cliente fala com o time GuiX.
 */
export const LIMITE_PEDIDOS_IA = 12;

export const AVISO_LIMITE =
  "Você usou as 12 alterações deste teste. Para continuar, fale com o time GuiX no contato.";

/** O que a IA pode fazer no rascunho. Estrutura nova fica de fora. */

export const AVISO_ESTRUTURA =
  "Tela nova, função nova ou mudança de estrutura é cotada à parte com o time de atendimento, no contato. O restante do site eu ajusto.";

export const AVISO_FECHADO =
  "Alteração encerrada. O site entrou para aprovação em até 72 horas. Edição nova é com o suporte técnico.";

const ESTRUTURA =
  /\b(nova tela|nova p[aá]gina|outras? p[aá]ginas|loja virtual|e-?commerce|carrinho|checkout|blog|aplicativo|app\b|[aá]rea do cliente|painel do cliente|login|nova fun[cç][aã]o|mudar (o |a )?layout|reestrutur|outra se[cç][aã]o|novo bloco)\b/i;

const CONTEUDO =
  /\b(telefone|whatsapp|n[uú]mero|celular|endere[cç]o|rua|avenida|bairro|hor[aá]rio|pre[cç]o|servi[cç]o|cor|fonte|logo|foto|imagem|texto|sobre|capa|rodap[eé]|cabe[cç]alho|menu|tema)\b/i;

export function soEstrutura(texto: string) {
  const t = texto.trim();
  if (t.length < 8) return false;
  return ESTRUTURA.test(t) && !CONTEUDO.test(t);
}

const OUTRO =
  /\b(cor|pre[cç]o|servi[cç]o|telefone|whatsapp|endere[cç]o|rua|logo|fonte|foto|imagem|capa|sobre|menu)\b/i;

/** Horário isolado, sem esperar a IA. */
export function horarioDireto(raw: string) {
  const t = raw.trim();
  if (t.length < 4 || t.length > 180) return "";
  if (OUTRO.test(t)) return "";
  if (!/\b(hor[aá]rio|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo|\d{1,2}\s*h|\d{1,2}\s*:\s*\d{2})\b/i.test(t)) return "";
  let s = t.replace(/^.*?\bhor[aá]rio\b\s*(de funcionamento)?\s*[,:]?\s*/i, "");
  s = s.replace(/^(para|pra)\s+/i, "");
  s = s.replace(/\b(\d{1,2})(?::(\d{2}))?\s*(?:h|hs)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|hs)?/gi, (_m, a, am, b, bm) => `${a}h${am || ""} às ${b}h${bm || ""}`);
  s = s.replace(/\b(\d{1,2})\s*h\s*(?:às|as|a)\s*(\d{1,2})\s*h\b/gi, "$1h às $2h");
  s = s.replace(/\b(\d{1,2})\s*às\s*(\d{1,2})(?!\d|h)/gi, "$1h às $2h");
  s = s.replace(/\s+das\s+/gi, ", ");
  s = s.replace(/\bterca\b/gi, "terça").replace(/\bsabado\b/gi, "sábado");
  s = s.replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").replace(/^[,.\s]+/, "").trim();
  if (s.length < 3) return "";
  return (s.charAt(0).toUpperCase() + s.slice(1)).slice(0, 160);
}

/** Telefone ou WhatsApp isolado, sem esperar a IA. */
export function telefoneDireto(raw: string) {
  const t = raw.trim();
  if (!/\b(telefone|whatsapp|celular|n[uú]mero)\b/i.test(t)) return "";
  if (/\b(endere[cç]o|rua|hor[aá]rio|pre[cç]o|servi[cç]o|cor|logo|foto|menu)\b/i.test(t)) return "";
  const d = t.replace(/\D/g, "");
  const trecho = d.length > 13 ? d.slice(-13) : d;
  if (trecho.startsWith("55") && (trecho.length === 12 || trecho.length === 13)) return trecho;
  if (trecho.length === 10 || trecho.length === 11) return `55${trecho}`;
  if (trecho.length === 12 || trecho.length === 13) return trecho;
  return "";
}
