import { readFile } from "fs/promises";
import path from "path";
import type { Nicho } from "@/lib/media/tipos";
import { templateIdDoNicho } from "./template-id";

export { templateIdDoNicho };

function candidatosExemplo(nicho: string) {
  const nome = `${nicho}.site.json`;
  const cwd = process.cwd();
  return [
    path.join(cwd, "content", "exemplos", nome),
    path.join(cwd, "site", "content", "exemplos", nome),
    path.join(cwd, "exemplos", nome),
    path.join(cwd, "..", "exemplos", nome),
  ];
}

function modeloGenerico(): Record<string, unknown> {
  return {
    meta: { schema_version: "1.0.0", nicho: "generico", template_id: "generico-v1", locale: "pt-BR" },
    empresa: {
      nome: "",
      slogan: "",
      logo: { id: "img_logo", src: "", alt: "", categoria: "logo" },
      telefone: "",
      telefone_label: "",
      whatsapp: "",
      whatsapp_label: "",
      email: "",
      redes: [],
      expediente: [],
      horario_resumo: "",
      endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", completo: "" },
    },
    tema: {
      color_primary: "#1A3654",
      color_secondary: "#0F766E",
      color_accent: "#0F766E",
      color_background: "#F7F8FA",
      color_surface: "#FFFFFF",
      color_text: "#1A202C",
      color_text_muted: "#5B6472",
      font_heading: "Manrope",
      font_body: "Manrope",
      radius: "md",
    },
    seo: { title: "", description: "", keywords: [], og_title: "", og_description: "", og_image: { id: "img_og", src: "", alt: "", categoria: "og" } },
    header: { botao_agendar: "Fale conosco", menu: [] },
    hero: { titulo: "Conheça nosso negócio", subtitulo: "Consulte os serviços e informações disponíveis.", imagem: { id: "img_hero", src: "", alt: "", categoria: "hero" } },
    sobre: { titulo: "Sobre o negócio", paragrafos: [], imagem: { id: "img_sobre", src: "", alt: "", categoria: "sobre" } },
    servicos: { titulo: "Atendimentos", subtitulo: "Consulte os detalhes diretamente com o negócio.", itens: [] },
    diferenciais: { titulo: "Informações", itens: [] },
    profissionais: { titulo: "Equipe", subtitulo: "", itens: [] },
    eventos: { titulo: "Agenda", itens: [] },
    promocoes: { titulo: "Condições", itens: [] },
    faq: { titulo: "Dúvidas", itens: [] },
    contato: { titulo: "Fale conosco", subtitulo: "" },
    galeria: { titulo: "Galeria", itens: [] },
    rodape: { texto: "", links: [] },
    agendamento: { fechado: "Consulte a disponibilidade diretamente com o negócio." },
  };
}

export async function carregarExemplo(nicho: Nicho): Promise<Record<string, unknown>> {
  if (nicho === "generico") return modeloGenerico();
  const erros: string[] = [];
  for (const arquivo of candidatosExemplo(nicho)) {
    try {
      const raw = await readFile(arquivo, "utf8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      erros.push(`${arquivo}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }
  throw new Error(`exemplo não encontrado para nicho ${nicho}. Tentativas: ${erros.join(" | ")}`);
}
