export function whatsappUrl(numero: string, texto: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}
