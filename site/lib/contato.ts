import { marca } from "@/lib/marca";

export const contato = {
  whatsapp: "5579996757964",
  whatsappExibicao: "(79) 99675-7964",
  email: `atendimento@${marca.dominio}`,
};

export const mensagemWhatsapp = `Olá, quero colocar meu negócio no ar com o ${marca.nome}.`;

export function linkWhatsapp(mensagem = mensagemWhatsapp) {
  return `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
