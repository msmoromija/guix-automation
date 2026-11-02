import { REGRA_NICHO, tagsDoNicho, tomDoEstilo } from "./catalogo";
import type { GeracaoSiteJson, Nicho } from "./tipos";

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não definida");
  return key;
}

export async function gerarTextosSite(entrada: {
  nicho: Nicho;
  nome: string;
  cidade?: string;
  slogan?: string;
  servicos?: string[];
  tom?: string;
  estilo?: string;
  destaque?: string;
}): Promise<GeracaoSiteJson> {
  const tags = tagsDoNicho(entrada.nicho);
  const tom = entrada.tom || tomDoEstilo(entrada.estilo);
  const sistema = [
    "Você é o redator e diretor de arte do site. Decide textos, nomes de serviço, FAQ e que tipo de foto usar.",
    "Responda SOMENTE com JSON válido, sem markdown.",
    "Português do Brasil, concreto, sem citar GuiX.",
    "Não invente endereço, CNPJ, telefone.",
    REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico,
    "imagens_sugeridas: só tags da lista. Cada item precisa bater com o nicho.",
    "Hero e sobre: frases novas, não genéricas de template.",
  ].join(" ");

  const user = {
    nicho: entrada.nicho,
    regra_nicho: REGRA_NICHO[entrada.nicho],
    nome_negocio: entrada.nome,
    slogan: entrada.slogan || "",
    cidade: entrada.cidade || "",
    servicos_informados: entrada.servicos || [],
    tom,
    estilo_visual: entrada.estilo || "moderno",
    o_que_destacar: entrada.destaque || "",
    tags_disponiveis: tags,
    schema: {
      hero: { titulo: "string", subtitulo: "string" },
      sobre: { titulo: "string", paragrafos: ["string"] },
      servicos: {
        titulo: "string",
        subtitulo: "string",
        itens: [{ nome: "string", descricao: "string" }],
      },
      seo: { title: "string", description: "string", keywords: ["string"] },
      faq: { titulo: "string", itens: [{ pergunta: "string", resposta: "string" }] },
      profissionais: {
        titulo: "string",
        subtitulo: "string",
        itens: [{ nome: "string", cargo: "string", descricao: "string" }],
      },
      contato: { titulo: "string", subtitulo: "string" },
      galeria: { titulo: "string", legendas: ["string"] },
      rodape: { texto: "string" },
      imagens_sugeridas: [
        { categoria: "hero|servico|sobre|galeria|profissional", tags: ["string"], motivo: "string" },
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
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI: ${res.status} ${err.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI: resposta vazia");
  return JSON.parse(raw) as GeracaoSiteJson;
}
