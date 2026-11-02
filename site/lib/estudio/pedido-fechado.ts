export type AlvoPedido = "horario" | "capa" | "sobre" | "servicos";

export const ALVOS_PEDIDO: { id: AlvoPedido; label: string; exemplo: string }[] = [
  { id: "horario", label: "Horário", exemplo: "Segunda a sexta, 8h às 17h" },
  { id: "capa", label: "Capa", exemplo: "Mais curta, cite o bairro" },
  { id: "sobre", label: "Sobre", exemplo: "Fale do atendimento sem fila" },
  { id: "servicos", label: "Serviços", exemplo: "Descrições mais curtas" },
];

const FORA =
  /\b(cor|cores|paleta|layout|fonte|tipografia|publicar|dom[ií]nio|pagamento|cnpj|apagar|excluir|loja|blog|foto|imagem|whatsapp|telefone|n[uú]mero)\b/i;

export function avisoFora(texto: string) {
  if (!FORA.test(texto)) return "";
  return "Dá para mudar o horário, a capa, o sobre ou a descrição dos serviços. Cor, foto, telefone e estrutura ficam nos passos do estúdio.";
}

export function limparHorario(raw: string) {
  let s = String(raw || "")
    .trim()
    .replace(/^(fale|fala|coloque|ponha|diga|escreva|atualize)\s+(do|o|sobre|que|no)?\s*(hor[aá]rio)?[:,]?\s*/i, "");
  s = s.replace(/\s+das?\s+/gi, ", ").replace(/\s*-\s*/g, " às ");
  s = s.replace(/\b(\d{1,2})\s*às\s*(\d{1,2})(?!h)/gi, "$1h às $2h");
  s = s.replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").trim();
  if (s.length < 3) return "";
  return (s.charAt(0).toUpperCase() + s.slice(1)).slice(0, 80);
}
