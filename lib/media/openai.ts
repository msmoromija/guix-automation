import type { GeracaoSiteJson, Nicho } from "./tipos";
import { tagsDoNicho } from "./catalogo";

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não definida");
  return key;
}

export async function gerarTextosSite(entrada: {
  nicho: Nicho;
  nome: string;
  cidade?: string;
  servicos?: string[];
  tom?: string;
}): Promise<GeracaoSiteJson> {
  const tags = tagsDoNicho(entrada.nicho);
  const sistema = [
    "Você escreve conteúdo comercial em português do Brasil para sites de presença digital.",
    "Responda SOMENTE com JSON válido, sem markdown.",
    "Use o modelo de campos pedido. Textos curtos, concretos, sem citar GuiX nem GNU Guix.",
    "Em imagens_sugeridas, escolha tags da lista fornecida.",
  ].join(" ");

  const user = {
    nicho: entrada.nicho,
    nome_negocio: entrada.nome,
    cidade: entrada.cidade || "",
    servicos: entrada.servicos || [],
    tom: entrada.tom || "profissional e acolhedor",
    tags_disponiveis: tags,
    schema: {
      hero: { titulo: "string", subtitulo: "string" },
      sobre: { titulo: "string", paragrafos: ["string"] },
      servicos: { titulo: "string", subtitulo: "string", sugestoes: ["string"] },
      imagens_sugeridas: [
        { categoria: "hero|servico|sobre|galeria", tags: ["string"], motivo: "string" },
      ],
    },
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI: resposta vazia");
  return JSON.parse(raw) as GeracaoSiteJson;
}
