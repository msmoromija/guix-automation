import { MessageCircle } from "lucide-react";
import { site } from "@/content";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsappFlutuante() {
  const { empresa } = site;
  return (
    <a
      href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)}
      target="_blank"
      rel="noreferrer"
      aria-label={empresa.whatsapp_aria}
      data-action="whatsapp"
      className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-sand shadow-lg"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
