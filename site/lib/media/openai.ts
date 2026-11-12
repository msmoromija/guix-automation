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
    "Hero: título com promessa concreta do ofício, em 3 a 7 palavras e até 60 caracteres. Subtítulo em uma única frase clara de até 120 caracteres, com no máximo um fato confirmado. Não faça lista de serviços, não empilhe promessas e não repita nome, slogan ou título.",
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
      hero: { titulo: "promessa curta, até 60 caracteres", subtitulo: "uma frase clara, até 120 caracteres" },
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
  "Hero: título com promessa concreta do ofício, em 3 a 7 palavras e até 60 caracteres. Subtítulo em uma única frase clara de até 120 caracteres, com no máximo um fato confirmado. Não faça lista de serviços nem empilhe promessas.",
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
  const sistema = `${ESCOPO} ${REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico} Responda só JSON. Escreva como quem atende no balcão: frase curta, concreta, sem "excelência", "compromisso" ou "qualidade" de enfeite. Nenhuma frase pode se repetir em outro bloco. Cada serviço descreve o que entra nele, com palavras diferentes dos outros. Se não houver horário ou endereço nos dados, não invente. Hero com promessa do ofício, não só o nome. Sobre com 2 parágrafos que não repetem a capa. OBRIGATÓRIO: faq.itens com exatamente 4 perguntas genéricas e úteis deste ofício (preço, horário, agendamento, o que levar), cada resposta com um fato diferente e sem inventar telefone/endereço. contato.titulo: Venha ao/à + bairro, ou Venha a + cidade se não houver bairro.`;
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
      faq: {
        titulo: "Dúvidas",
        itens: [
          { pergunta: "", resposta: "" },
          { pergunta: "", resposta: "" },
          { pergunta: "", resposta: "" },
          { pergunta: "", resposta: "" },
        ],
      },
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
    "Você controla TODO o motor listado em atual.motor.pode: nicho, empresa, hero, sobre, contato, faq, eventos, avisos, servicos, profissionais, diferenciais, visual, marca, header, rodape, redes, midia.",
    "Pedidos compostos: aplique TUDO o que couber no mesmo JSON, inclusive campos de formulário, visual, conteúdo e mídia. Faça uma única proposta integrada, não ignore partes do pedido.",
    "FONTE DOS FATOS: somente dados_fornecidos representa informação confirmada pelo cliente. O texto e os itens do modelo são exemplos ou sugestões, não fatos do negócio. Nunca invente nomes de profissionais, preços, duração, horários, endereço, contatos, especialidades, serviços realmente oferecidos, resultados ou eventos. Quando não houver confirmação, mantenha vazio ou use 'A confirmar'/'Consulte valores' de forma explícita.",
    "CHECKLIST DO SEGMENTO: consulte atual.motor.checklist_nicho e respeite as seções e possibilidades listadas. Elas orientam a estrutura, não confirmam que o negócio oferece cada serviço. Não acrescente itens alheios ao segmento.",
    "TROCAR MODELO / NICHO (ex.: 'é uma nutricionista', 'mude o modelo para clínica', 'troque para pet shop'): escolha o slug em atual.motor.nichos e envie nicho=<slug>. Faça isso sempre que o ofício do negócio mudar, mesmo que o cliente não use a palavra 'modelo'. A base atual já representa o destino: não gere atualizações ou remoções para serviços do nicho anterior. Preserve dados_fornecidos e só altere os blocos solicitados.",
    "AGENDA / GRADE DE HORÁRIOS: empresa.expediente é uma lista por dia da semana: { dia: seg|ter|qua|qui|sex|sab|dom, aberto: booleano, inicio: 'HH:MM', fim: 'HH:MM', pausa: booleano, pausaInicio: 'HH:MM', pausaFim: 'HH:MM' }. Use quando pedirem horário de funcionamento por dia, almoço/pausa ou fechar fim de semana.",
    "CONFIRMAÇÃO DA AGENDA: visual.modoConfirmacaoAgenda = manual | automatico | whatsapp. VISUAL DA AGENDA: visual.duracaoSlotMinutos = 15|20|30|45|60|90|120.",
    "EDIÇÃO GERAL DO VISUAL: fonte em visual.tipografiaId usando exatamente um id de atual.motor.fontes; tipo de cabeçalho em visual.cabecalho usando atual.motor.cabecalhos; layout do rodapé em visual.rodapeLayout usando atual.motor.rodapes. Preencha esses campos quando solicitados; não apenas descreva a mudança no resumo.",
    "CORES DE TEXTO: títulos em visual.cor_titulos; texto principal em visual.cor_texto; texto secundário em visual.cor_texto_suave. Use #RRGGBB. Para 'títulos vermelhos', preencha cor_titulos com #DC2626 (ou vermelho solicitado); preservar as demais cores se não forem pedidas.",
    "FAQ / dúvidas / preencha FAQ: faq.titulo + faq.itens com 3–5 perguntas/respostas reais do ofício.",
    "Eventos / agenda / crie eventos: eventos.titulo + eventos.itens (2–4) com titulo, descricao, data_label, horario HH:MM. Proibido 'Novo evento' vazio.",
    "Avisos / recesso / feriado: avisos.itens com titulo, descricao, data_label.",
    "Campos vazios: leia atual.campos_vazios. Preencha textos e estrutura com conteúdo apropriado ao segmento, mas não transforme valores ausentes em fatos. Não crie equipe, preços, horários, endereço, eventos ou contatos.",
    "Refaça textos / tom (animado, cordial, luxo): hero, sobre (2 parágrafos), descrições de serviços, contato e faq.",
    "Fotos: use midia.fotos com slot e busca em inglês curto (2–4 palavras). Tipos: hero, sobre, galeria, servico, profissional e evento; indice começa em 0. Consulte atual.motor.fotos_disponiveis e gere apenas slots existentes. Se pedirem para trocar todas as fotos/imagens do site, preencha as categorias e o backend expandirá a lista para cada item existente; se pedirem para reforçar/trocar imagens de uma seção, cubra todos os slots dessa seção com buscas distintas. Nunca invente URL. Não associe retratos a nomes, gêneros ou identidades; para fotos de equipe, busque apenas pelo cargo/ambiente, sem nomes.",
    "Telefone/WhatsApp/e-mail/horário/endereço: só se o cliente informar no pedido. Não invente.",
    "Equipe: profissionais.acrescentar ou atualizar. Serviços: servicos.acrescentar ou atualizar.",
    "Ao atualizar um serviço existente, preserve o contexto e preencha em servicos.atualizar pelo menos um campo editável além de nome: novo_nome, descricao, preco_label ou duracao_label. Não diga no resumo que alterou um valor se o campo correspondente não estiver no patch.",
    "Visual: use os ids exatos de atual.motor.paletas, fontes, cabecalhos e rodapes. Redes: objeto redes { instagram, facebook, ... } com URL ou @.",
    "Alinhar logo / texto da marca / centralizar slogan: visual.logoAlinhamento = centro (ou topo/base) e visual.cabecalho = logo-slogan. Não diga que alinhou sem preencher logoAlinhamento.",
    "Formato visual.logoAlinhamento: centro | topo | base.",
    "TEMA/APARÊNCIA (claro, escuro, moderno, luxo, urbano, clássico, suave): use visual.aparencia (claro|escuro|automatico) e visual.estilo (moderno|luxo|urbano|classico|suave). 'escuro'/'noturno' → aparencia escuro; 'claro' → aparencia claro; 'moderno'/'clean' → estilo moderno; 'luxo'/'premium' → estilo luxo. Pode combinar com paletaId, tipografiaId, botao, banner, animacao, cabecalho.",
    "CORES DA MARCA: quando o cliente der uma cor (nome ou hexadecimal), use visual.cor_accent (#RRGGBB, cor de destaque/links/botões) e/ou visual.cor_fundo (#RRGGBB, fundo do site). Converta nomes comuns em hex (ex: preto #111111, branco #ffffff, vermelho #d62828, azul #1d4ed8, verde #16a34a, dourado #c8a24a).",
    "NOME DO PROJETO: para trocar/renomear a empresa use empresa.nome (nome fantasia curto, sem 'Bem-vindo').",
    "MARCA / LOGO: você controla os mesmos recursos do editor. Escolha exatamente um tipo por pedido: marca.tipo=icone + marca.icone de atual.motor.icones_marca; tipo=emblema + marca.emblema de atual.motor.emblemas_marca; tipo=arquivo + marca.arquivo de atual.motor.arquivos_marca; ou tipo=texto + layout=wordmark para marca só tipográfica.",
    "Prefira emblemas_marca quando precisar de um selo vetorial com significado claro, e icones_recomendados_marca para símbolos Lucide do ofício. arquivos_marca contém logos PNG identificados somente por caminho numérico, sem descrição visual: preserve o atual ou use um deles apenas se o cliente pedir logo da biblioteca; nunca invente o que a imagem representa.",
    "Toda escolha de marca pode combinar layout pelo id de atual.motor.layouts_marca, fonteId pelo id de fontes_marca e cores. O catálogo de cores está em atual.motor.cores_marca; cores personalizadas aceitam #RRGGBB. Converta nomes comuns para hex (preto #1A1614, branco #FFFFFF, vermelho #B42318, azul #1A3654, verde #16A34A, dourado #C6A15B). Para voltar a herdar do tema, use 'auto' em corIcone, corNome ou corAcento.",
    "Ao escolher arquivo, emblema ou ícone, sempre preencha tipo e o respectivo ID. Não preencha IDs de tipos concorrentes. Ao alterar apenas layout/fonte/cor, preserve o tipo e símbolo atuais de atual.marca; se estiverem vazios, escolha um tipo e símbolo adequados ao nicho.",
    "Tamanho do logo = visual.logoTamanho (pequeno|medio|grande), que controla a escala no cabeçalho. Não confunda tamanho com layout.",
    "Se o cliente pedir para gerar várias opções/modelos de logo, marque marca.gerarOpcoes=true e descreva a direção criativa no resumo. Para escolher uma única marca, componha diretamente o melhor arranjo em marca.",
    "Se atual.marca.logoPersonalizado=true, o arquivo enviado não pode ser redesenhado com precisão pela IA. Para trocar cor/estilo, escolha um arquivo, emblema ou ícone do catálogo, informe a troca no resumo e nunca diga que editou os pixels do arquivo original.",
    "Você não pode inventar nem acessar arquivos locais do cliente. Só escolha arquivos do catálogo atual.motor.arquivos_marca; para PNG/SVG próprio, explique que o cliente precisa enviar o arquivo pelo controle de upload.",
    "Nunca invente um ID de ícone, emblema, arquivo, paleta, layout ou fonte que não esteja em atual.motor.",
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
      nicho: "slug do modelo (ex: barbearia, salao, estetica, petshop, academia, contabilidade, advocacia, dentista, clinica, psicologia, nutricionista) — só quando trocar o modelo",
      empresa: {
        nome: "",
        whatsapp: "",
        email: "",
        slogan: "",
        horario_resumo: "",
        endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" },
        expediente: [{ dia: "seg", aberto: true, inicio: "09:00", fim: "18:00", pausa: true, pausaInicio: "12:00", pausaFim: "13:00" }],
      },
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
      visual: {
        paletaId: "",
        tipografiaId: "",
        cabecalho: "",
        rodapeLayout: "",
        estilo: "",
        aparencia: "",
        logoTamanho: "",
        logoAlinhamento: "centro",
        banner: "",
        botao: "",
        animacao: "",
        cor_accent: "",
        cor_fundo: "",
        cor_titulos: "",
        cor_texto: "",
        cor_texto_suave: "",
        agendamento: true,
        modoConfirmacaoAgenda: "automatico",
        duracaoSlotMinutos: 30,
      },
      marca: { tipo: "", icone: "", emblema: "", arquivo: "", layout: "", fonteId: "", corIcone: "", corNome: "", corAcento: "", gerarOpcoes: false },
      header: { botao_agendar: "", renomear: [{ id: "", label: "" }] },
      rodape: { texto: "" },
      redes: { instagram: "", facebook: "", tiktok: "" },
      midia: {
        fotos: [
          { slot: "hero", indice: 0, busca: "" },
          { slot: "sobre", indice: 0, busca: "" },
          { slot: "galeria", indice: 0, busca: "" },
          { slot: "galeria", indice: 1, busca: "" },
          { slot: "servico", indice: 0, busca: "" },
          { slot: "profissional", indice: 0, busca: "" },
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

  return umaVez(prim);
}

export async function revisarConteudoFinal(entrada: {
  nicho: Nicho;
  pedido: string;
  fatosConfirmados: unknown;
  site: unknown;
  imagens: Array<{ local: string; url: string; alt: string; contexto: string }>;
  timeoutMs?: number;
}) {
  const sistema = [
    "Você é o revisor final independente de um site comercial local. Leia o site inteiro e responda somente JSON válido.",
    "Compare cada título, parágrafo, serviço, FAQ, equipe, menu, chamada, legenda, texto de rodapé, SEO, endereço, horário e dado de contato com o nicho e os fatos confirmados.",
    "Os fatos_confirmados são a única fonte de verdade sobre este negócio. O site recebido pode conter exemplos, texto antigo ou sugestões não confirmadas. Não trate sugestões de serviços como serviços confirmados.",
    "Detecte conteúdo de outro nicho, nomes de cidade/bairro/endereço não confirmados, preços/horários inventados, promessa clínica ou comercial, descrições contraditórias e títulos/legendas que não combinam com a seção.",
    "Confira as imagens anexadas visualmente contra o nicho, o espaço indicado e a legenda/contexto. Nunca associe retrato de banco de imagens a uma pessoa nomeada. Para foto de equipe nomeada, se não for claramente fornecida pelo cliente, peça confirmação ou remoção. Não deduza identidade de gênero pelo nome; sinalize apenas incompatibilidade visual evidente como 'precisa confirmar', sem rotular a pessoa.",
    "Se uma imagem incompatível tiver legenda ou texto visível que descreva a imagem antiga, corrija também esse texto em correcoes usando o caminho existente (por exemplo, galeria.itens[0].legenda). Não deixe a nova imagem acompanhada de legenda incompatível.",
    "Se houver problema corrigível, sugira uma substituição curta e conservadora em correcoes, sem criar fatos. Não altere nome, endereço, telefone, e-mail, preços, horários, nomes da equipe ou dados confirmados. Para conflito factual que não possa ser resolvido sem o cliente, crie pendencias e não invente a resposta.",
    "Não reescreva conteúdo correto por preferência estilística. Evite correções desnecessárias. Cada correção deve apontar para um caminho existente no site.",
    'Formato obrigatório: {"correcoes":[{"caminho":"hero.titulo","valor":"texto corrigido","motivo":"..."}],"imagens_problematicas":[{"caminho":"profissionais.itens[0].foto","acao":"remover|confirmar|substituir","motivo":"...","confianca":"alta|media"}],"pendencias":[{"caminho":"empresa.endereco.completo","motivo":"..."}],"resumo":"..."}',
    REGRA_NICHO[entrada.nicho] || REGRA_NICHO.generico,
  ].join(" ");

  const ctrl = new AbortController();
  const prazo = setTimeout(() => ctrl.abort(), entrada.timeoutMs || 22000);
  try {
    const conteudo: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: JSON.stringify({
          pedido_original: entrada.pedido.slice(0, 900),
          nicho: entrada.nicho,
          fatos_confirmados: entrada.fatosConfirmados,
          site_final: entrada.site,
          imagens: entrada.imagens.map(({ local, alt, contexto }) => ({ local, alt, contexto })),
        }),
      },
    ];
    for (const imagem of entrada.imagens) {
      conteudo.push({ type: "text", text: `Imagem para revisar: ${imagem.local}` });
      conteudo.push({ type: "image_url", image_url: { url: imagem.url, detail: "low" } });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: ctrl.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sistema },
          { role: "user", content: conteudo },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI revisão: ${res.status} ${err.slice(0, 240)}`);
    }
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI revisão: resposta vazia");
    return JSON.parse(raw) as Record<string, unknown>;
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
