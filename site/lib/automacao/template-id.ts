import type { Nicho } from "@/lib/media/tipos";

const TEMPLATE_ID: Record<Nicho, string> = {
  barbearia: "barbearia-v1",
  salao: "salao-v1",
  estetica: "estetica-v1",
  petshop: "petshop-v1",
  academia: "academia-v1",
  contabilidade: "contabilidade-v1",
  advocacia: "advocacia-v1",
  clinica: "clinica-v1",
  generico: "generico-v1",
};

export function templateIdDoNicho(nicho: Nicho) {
  return TEMPLATE_ID[nicho] || `${nicho}-v1`;
}
