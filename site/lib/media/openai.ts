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
  horario?: string;
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
    "FAQ: 4 perguntas específicas deste negócio. Só fale de preço, endereço ou horário se esses dados existirem no pedido. Nunca invente valor, rua ou horário.",
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
    horario: entrada.horario || "",
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
  horario?: string;
  servicos: Array<{ nome: string; preco?: string; duracao?: string; descricao?: string }>;
  profissionais?: Array<{ nome: string; cargo?: string; descricao?: string }>;
}) {
  const sistema = `${ESCOPO} ${REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico} Responda só JSON. Escreva como quem atende no balcão: frase curta, concreta, sem "excelência", "compromisso" ou "qualidade" de enfeite. Nenhuma frase pode se repetir em outro bloco. Cada serviço descreve o que entra nele, com palavras diferentes dos outros. Se não houver horário ou endereço nos dados, não invente. Hero com promessa do ofício, não só o nome. Sobre com 2 parágrafos que não repetem a capa. FAQ com 4 perguntas deste negócio, cada resposta com um fato diferente. contato.titulo: Venha ao/à + bairro, ou Venha a + cidade se não houver bairro.`;
  const json = await completarJson(sistema, {
    nicho: entrada.nicho,
    nome: entrada.nome,
    slogan: entrada.slogan || "",
    cidade: entrada.cidade || "",
    bairro: entrada.bairro || "",
    tom: entrada.tom || "",
    destaque: entrada.destaque || "",
    horario: entrada.horario || "",
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

export async function executarPedido(entrada: {
  nicho: Nicho;
  pedido: string;
  contexto: unknown;
  /** Timeout por tentativa (ms). Em pedidos compostos use ~22000. */
  timeoutMs?: number;
}) {
  const sistema = [
    "Você é o operador do motor GuiX: o chat manda, você aplica no site. Responda SÓ JSON válido do patch.",
    "REGRA DE OURO: nunca devolva patch vazio se o pedido pedir qualquer mudança. Sempre preencha resumo com o que fez.",
    "Você controla TODO o motor listado em atual.motor.pode: empresa, hero, sobre, contato, faq, eventos, avisos, servicos, profissionais, diferenciais, visual, header, rodape, redes, midia.",
    "Pedidos compostos: aplique TUDO o que couber no mesmo JSON (textos + FAQ + eventos + visual + serviços).",
    "FAQ / dúvidas / preencha FAQ: faq.titulo + faq.itens com 3–5 perguntas/respostas reais do ofício.",
    "Eventos / agenda / crie eventos: eventos.titulo + eventos.itens (2–4) com titulo, descricao, data_label, horario HH:MM. Proibido 'Novo evento' vazio.",
    "Avisos / recesso / feriado: avisos.itens com titulo, descricao, data_label.",
    "Campos vazios: leia atual.campos_vazios e preencha cada um de fato.",
    "Refaça textos / tom (animado, cordial, luxo): hero, sobre (2 parágrafos), descrições de serviços, contato e faq.",
    "Fotos: midia.fotos com slot hero/sobre/galeria e busca em inglês curto. Sem URL inventada.",
    "Telefone/WhatsApp/e-mail/horário/endereço: só se o cliente informar no pedido. Não invente.",
    "Equipe: profissionais.acrescentar ou atualizar. Serviços: servicos.acrescentar ou atualizar.",
    "Visual: use atual.motor.paletas, fontes e cabecalhos. Redes: objeto redes { instagram, facebook, ... } com URL ou @.",
    "Tela nova, loja, blog, login: aviso_estrutura e ainda assim aplique o restante do pedido.",
    "Português do Brasil. Seja decisivo: prefira preencher a omitir.",
    REGRA_NICHO[entrada.nicho] || "",
  ].join(" ");

  const user = {
    pedido: entrada.pedido.slice(0, 900),
    nicho: entrada.nicho,
    atual: entrada.contexto,
    formato: {
      resumo: "O que foi aplicado neste patch",
      aviso_estrutura: "",
      abrir: "",
      empresa: { whatsapp: "", email: "", slogan: "", horario_resumo: "", endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" } },
      hero: { titulo: "", subtitulo: "" },
      sobre: { titulo: "", paragrafos: ["", ""] },
      contato: { titulo: "", subtitulo: "" },
      faq: { titulo: "Dúvidas", itens: [{ pergunta: "", resposta: "" }] },
      eventos: { titulo: "Agenda", itens: [{ titulo: "", descricao: "", data_label: "", horario: "19:00" }] },
      avisos: { itens: [{ titulo: "", descricao: "", data_label: "" }] },
      servicos: {
        acrescentar: [{ nome: "", descricao: "", preco_label: "", duracao_label: "" }],
        atualizar: [{ nome: "", descricao: "", preco_label: "", duracao_label: "" }],
      },
      profissionais: {
        acrescentar: [{ nome: "", cargo: "", descricao: "" }],
        atualizar: [{ nome: "", novo_nome: "", cargo: "", descricao: "" }],
      },
      diferenciais: { acrescentar: [{ titulo: "", descricao: "" }], atualizar: [{ de: "", titulo: "", descricao: "" }] },
      visual: { paletaId: "", tipografiaId: "", cabecalho: "", estilo: "", logoTamanho: "", banner: "", botao: "", animacao: "", agendamento: true },
      header: { botao_agendar: "", renomear: [{ id: "", label: "" }] },
      rodape: { texto: "" },
      redes: { instagram: "", facebook: "", tiktok: "" },
      midia: {
        fotos: [
          { slot: "hero", indice: 0, busca: "" },
          { slot: "sobre", indice: 0, busca: "" },
          { slot: "galeria", indice: 0, busca: "" },
        ],
      },
    },
  };

  const prim = entrada.timeoutMs || 35000;
  async function umaVez(ms: number) {
    const ctrl = new AbortController();
    const prazo = setTimeout(() => ctrl.abort(), ms);
    try {
      return await completarJson(sistema, user, 0.4, ctrl.signal);
    } finally {
      clearTimeout(prazo);
    }
  }

  try {
    return await umaVez(prim);
  } catch {
    return await umaVez(Math.min(20000, prim));
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
