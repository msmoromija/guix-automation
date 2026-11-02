import { MessageCircle } from "lucide-react";
import { site } from "@/content/site";
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
      className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime text-page shadow-md"
    >
      <MessageCircle size={26} />
    </a>
  );
}
