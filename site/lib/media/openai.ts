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
  servicosDetalhe?: Array<{ nome: string; descricao?: string; preco?: string; duracao?: string }>;
  profissionaisDetalhe?: Array<{ nome: string; cargo?: string; descricao?: string }>;
  tom?: string;
  estilo?: string;
  destaque?: string;
}): Promise<GeracaoSiteJson> {
  const tags = tagsDoNicho(entrada.nicho);
  const tom = entrada.tom || tomDoEstilo(entrada.estilo);
  const sistema = [
    "Você é redator de um site local real, não de template.",
    "Responda SOMENTE com JSON válido, sem markdown.",
    "Português do Brasil com acentuação correta (clássico, máquina, você).",
    "Frases concretas do ofício. Evite clichê de agência.",
    "A expressão 'hora marcada' no máximo UMA vez em todo o JSON. Prefira 'na agenda', 'no horário combinado', 'sem fila na porta'.",
    "Não invente endereço, CNPJ, telefone, bairro fictício nem cargo cômico (nada de animador de porta).",
    "NÃO troque os nomes dos serviços nem da equipe informados. Só reescreva descrições se estiverem pobres.",
    "FAQ: 4 perguntas específicas deste negócio (preço, duração, o que levar, como chegar), nunca genéricas.",
    "Galeria: título 'O espaço' ou 'Ambiente'. Legendas curtas do que se vê, não 'A casa'.",
    "Hero: título com o nome do negócio ou uma promessa curta; subtítulo com 1 fato (cidade, ofício, como agendar).",
    "Sobre: 2 parágrafos. O primeiro diz quem atende e o que faz; o segundo, como é o atendimento.",
    "Cada serviço tem descrição de 1 ou 2 frases com o que entra no preço.",
    "Nunca use a palavra 'cardápio' (no Brasil isso é menu de restaurante). Use 'serviços', 'tabela de serviços' ou 'o que fazemos'.",
    REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico,
    "imagens_sugeridas: só tags da lista, uma sugestão por foto, sem repetir a mesma tag em todos.",
  ].join(" ");

  const user = {
    nicho: entrada.nicho,
    regra_nicho: REGRA_NICHO[entrada.nicho],
    nome_negocio: entrada.nome,
    slogan: entrada.slogan || "",
    cidade: entrada.cidade || "",
    servicos_informados: entrada.servicos || [],
    lista_de_servicos: entrada.servicosDetalhe || [],
    equipe_informada: entrada.profissionaisDetalhe || [],
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
      temperature: 0.7,
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
