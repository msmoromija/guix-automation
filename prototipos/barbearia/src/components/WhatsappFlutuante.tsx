import { MessageCircle } from "lucide-react";
import { site } from "@/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsappFlutuante() {
  const { empresa } = site;
  return (
    <a
      href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      data-action="whatsapp"
      aria-label={empresa.whatsapp_aria}
      className="fixed bottom-4 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-secondary bg-accent text-background"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
