export function whatsappUrl(numero: string, texto: string): string {
  const digits = numero.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`;
}
