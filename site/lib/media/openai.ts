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
  bairro?: string;
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
    "Hero: título com uma promessa curta do ofício, não só o nome. Subtítulo com 1 fato (bairro/cidade, ofício, como agendar). O subtítulo NÃO pode repetir o slogan nem o título.",
    "contato.titulo: 'Venha ao' ou 'Venha à' + bairro (ou cidade). Nunca use o bairro do modelo de exemplo.",
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
    bairro: entrada.bairro || "",
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

  return (await completarJson(sistema, user, 0.7)) as unknown as GeracaoSiteJson;
}

const ESCOPO = [
  "Você escreve só os textos do site local deste cliente.",
  "Pode mudar: título e subtítulo da capa, sobre, descrições dos serviços, título do bloco de serviços, contato, dúvidas e o título da equipe.",
  "Não pode: mudar layout, cores, fontes, ordem dos blocos, fotos, domínio, pagamento, publicar, inventar telefone, CNPJ ou endereço, trocar o nicho, apagar seções, criar loja ou blog.",
  "Mantenha no mínimo 3 serviços. Não troque os nomes dos serviços nem da equipe que o cliente informou.",
  "Se o pedido sair desse escopo, preencha aviso_limite com uma frase curta dizendo o limite e mesmo assim entregue o texto mais próximo do que foi pedido, dentro do ofício e dos dados reais.",
  "Se o pedido estiver no escopo, aviso_limite fica string vazia.",
  "Português do Brasil. Sem cardápio. Sem clichê de agência. Sem repetir o slogan no subtítulo.",
].join(" ");

export async function escreverCopiaSimulacao(entrada: {
  nicho: Nicho;
  nome: string;
  cidade?: string;
  bairro?: string;
  slogan?: string;
  tom?: string;
  destaque?: string;
  servicos: Array<{ nome: string; preco?: string; duracao?: string; descricao?: string }>;
  profissionais?: Array<{ nome: string; cargo?: string; descricao?: string }>;
}) {
  const sistema = `${ESCOPO} ${REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico} Responda só JSON. Hero com promessa do ofício, não só o nome. Sobre com 2 parágrafos. Uma descrição por serviço, na mesma ordem e quantidade. FAQ com 4 perguntas deste negócio. contato.titulo: Venha ao/à + bairro, ou Venha a + cidade se não houver bairro.`;
  const json = await completarJson(sistema, {
    nicho: entrada.nicho,
    nome: entrada.nome,
    slogan: entrada.slogan || "",
    cidade: entrada.cidade || "",
    bairro: entrada.bairro || "",
    tom: entrada.tom || "",
    destaque: entrada.destaque || "",
    servicos: entrada.servicos,
    equipe: (entrada.profissionais || []).filter((p) => p.nome.trim()),
    schema: {
      aviso_limite: "",
      hero: { titulo: "", subtitulo: "" },
      sobre: { titulo: "", paragrafos: ["", ""] },
      servicos: { titulo: "Serviços", subtitulo: "", itens: [{ descricao: "" }] },
      contato: { titulo: "", subtitulo: "" },
      faq: { titulo: "Dúvidas", itens: [{ pergunta: "", resposta: "" }] },
      profissionais: { titulo: "", subtitulo: "" },
    },
  }, 0.6);
  return { aviso: String(json.aviso_limite || ""), copia: json };
}

export async function ajustarBloco(entrada: {
  alvo: "capa" | "sobre" | "servicos";
  instrucao: string;
  nome: string;
  nicho: Nicho;
  cidade?: string;
  bairro?: string;
  atual: unknown;
  servicos?: Array<{ nome: string; descricao?: string }>;
}) {
  const sistema = [
    "Reescreva somente o bloco pedido. Responda só JSON.",
    "Não invente telefone, CNPJ, endereço, preço ou nome de serviço.",
    "Não mude cor, layout, foto nem estrutura.",
    "Se a instrução pedir isso, devolva aviso_limite e mantenha o texto atual o mais próximo possível.",
    "Português do Brasil, frase curta.",
    REGRA_NICHO[entrada.nicho] || "",
  ].join(" ");
  const ctrl = new AbortController();
  const prazo = setTimeout(() => ctrl.abort(), 12000);
  try {
    const json = await completarJson(
      sistema,
      {
        bloco: entrada.alvo,
        instrucao: entrada.instrucao.slice(0, 80),
        nome: entrada.nome,
        cidade: entrada.cidade || "",
        bairro: entrada.bairro || "",
        servicos: entrada.servicos || [],
        texto_atual: entrada.atual,
      },
      0.3,
      ctrl.signal,
    );
    return { aviso: String(json.aviso_limite || ""), copia: json };
  } finally {
    clearTimeout(prazo);
  }
}

export async function executarPedido(entrada: { nicho: Nicho; pedido: string; contexto: unknown }) {
  const sistema = [
    "Você edita o conteúdo e a aparência de um site local já montado. Responda só JSON.",
    "Pode alterar telefone, WhatsApp, e-mail, endereço, horário, textos, serviços (acrescentar, remover, reescrever, mudar preço, tirar todos os preços, sugerir preço), diferenciais, FAQ, tema, fonte, cores, menu e rodapé.",
    "Visual completo: paletaId, tipografiaId, aparencia, estilo, cabecalho, rodapeLayout, logoTamanho, banner, botao, animacao, agendamento, whatsappFlutuante e redes.",
    "Cabeçalho: logo-esquerda, centralizado, logo-slogan, logo-direita, menu-abaixo, compacto.",
    "Rodapé: centralizado, dividido, empilhado, minimo.",
    "Logo: pequeno, medio, grande.",
    "Banner: automatico, solido, degrade. Botão: arredondado, quadrado, pílula, sem-contorno. Animação: suave, media, intensa.",
    "Use só o que o cliente pediu. Não invente telefone, CNPJ nem endereço que ele não escreveu.",
    "Preço sugerido entra como preco_label, por exemplo R$ 45, e o resumo diz que é sugestão.",
    "Não crie página, loja, blog, login, carrinho nem função nova. Se pedirem isso, preencha aviso_estrutura e aplique o resto.",
    "Foto: não invente URL. Preencha midia.foto com slot hero, sobre, galeria ou servico, indice se precisar, e busca em inglês curto. O sistema busca no Unsplash.",
    "Logo da biblioteca: midia.logo com arquivo em dois dígitos, como 03, ou buscar true. Não invente URL.",
    "Paletas: latao-escuro, papel-quente, spa, limão-escuro, marinho, bordô.",
    "Fontes: editorial, luxo, limpo, urbano, suave.",
    "Menu id: inicio, sobre, servicos, profissionais, promocoes, faq, contato. Mínimo 5, máximo 7.",
    "Omita chaves que não mudam. resumo em uma frase, português do Brasil.",
    REGRA_NICHO[entrada.nicho] || "",
  ].join(" ");
  const ctrl = new AbortController();
  const prazo = setTimeout(() => ctrl.abort(), 16000);
  try {
    return await completarJson(
      sistema,
      {
        pedido: entrada.pedido.slice(0, 400),
        nicho: entrada.nicho,
        atual: entrada.contexto,
        formato: {
          resumo: "",
          aviso_estrutura: "",
          abrir: "",
          empresa: { whatsapp: "", email: "", slogan: "", horario_resumo: "", endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" } },
          hero: { titulo: "", subtitulo: "" },
          sobre: { titulo: "", paragrafos: [] },
          contato: { titulo: "", subtitulo: "" },
          faq: { itens: [{ de: "", pergunta: "", resposta: "" }] },
          diferenciais: { atualizar: [{ de: "", titulo: "", descricao: "" }], remover: [], acrescentar: [] },
          servicos: { sem_preco: false, remover: [], atualizar: [{ nome: "", novo_nome: "", descricao: "", preco_label: "", duracao_label: "" }], acrescentar: [] },
          visual: { paletaId: "", tipografiaId: "", cabecalho: "", rodapeLayout: "", logoTamanho: "", banner: "", botao: "", animacao: "", aparencia: "", estilo: "", agendamento: false, cor_accent: "", cor_fundo: "" },
          header: { botao_agendar: "", ocultar: [], mostrar: [], renomear: [{ id: "", label: "" }] },
          rodape: { texto: "", remover: [], acrescentar: [{ label: "", href: "" }] },
          midia: { foto: { slot: "", indice: 0, busca: "" }, logo: { arquivo: "", buscar: false } },
        },
      },
      0.3,
      ctrl.signal,
    );
  } finally {
    clearTimeout(prazo);
  }
}

export async function ajustarCopiaSimulacao(entrada: {
  nicho: Nicho;
  nome: string;
  cidade?: string;
  bairro?: string;
  pedido: string;
  copia: unknown;
  servicos: Array<{ nome: string; preco?: string; duracao?: string; descricao?: string }>;
}) {
  const sistema = `${ESCOPO} ${REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico} O cliente pediu um ajuste. Aplique no JSON atual. Responda só JSON no mesmo formato, com aviso_limite.`;
  const json = await completarJson(
    sistema,
    {
      pedido: entrada.pedido,
      nicho: entrada.nicho,
      nome: entrada.nome,
      cidade: entrada.cidade || "",
      bairro: entrada.bairro || "",
      servicos: entrada.servicos,
      textos_atuais: entrada.copia,
    },
    0.4,
  );
  return { aviso: String(json.aviso_limite || ""), copia: json };
}

async function completarJson(sistema: string, user: unknown, temperature: number, signal?: AbortSignal) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    signal,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature,
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
  return JSON.parse(raw) as Record<string, unknown>;
}
