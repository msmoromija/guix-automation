export type ServicoSugerido = { nome: string; preco: string; duracao: string; descricao: string; imagemSrc: string };

const FOTO = {
  barbearia: [
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  salao: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  estetica: [
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  petshop: [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  academia: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  contabilidade: [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  advocacia: [
    "https://images.unsplash.com/photo-1589216532372-1c2a367900d9?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  dentista: [
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  clinica: [
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  psicologia: [
    "https://images.unsplash.com/photo-1758273240331-745ccab011a2?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  nutricionista: [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&h=560&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&h=560&q=80",
  ],
  generico: [],
} as Record<string, string[]>;
export type ProSugerido = { nome: string; cargo: string; descricao: string; fotoSrc: string };

const SERVICOS: Record<string, ServicoSugerido[]> = {
  barbearia: [
    { nome: "Corte masculino", preco: "R$ 50", duracao: "40 min", descricao: "Tesoura ou máquina, do clássico ao degradê.", imagemSrc: "" },
    { nome: "Barba", preco: "R$ 35", duracao: "30 min", descricao: "Toalha quente, navalha e alinhamento.", imagemSrc: "" },
    { nome: "Acabamento", preco: "R$ 25", duracao: "20 min", descricao: "Contorno da barba e da nuca, na tesoura ou na máquina.", imagemSrc: "" },
    { nome: "Pigmentação da barba", preco: "R$ 45", duracao: "40 min", descricao: "Pigmentação e acabamento, conforme avaliação do profissional.", imagemSrc: "" },
  ],
  salao: [
    { nome: "Corte feminino", preco: "R$ 80", duracao: "50 min", descricao: "Tesoura, do repicado ao chanel, com finalização.", imagemSrc: "" },
    { nome: "Escova", preco: "R$ 60", duracao: "45 min", descricao: "Lavagem e escova para o compromisso do dia.", imagemSrc: "" },
    { nome: "Coloração", preco: "R$ 180", duracao: "2 h", descricao: "Tintura no tom combinado antes de começar.", imagemSrc: "" },
    { nome: "Hidratação capilar", preco: "R$ 100", duracao: "50 min", descricao: "Tratamento capilar ajustado ao serviço escolhido.", imagemSrc: "" },
  ],
  estetica: [
    { nome: "Limpeza de pele", preco: "R$ 140", duracao: "1 h", descricao: "Higienização, extração e máscara.", imagemSrc: "" },
    { nome: "Massagem relaxante", preco: "R$ 130", duracao: "50 min", descricao: "A sala fica só com você no horário.", imagemSrc: "" },
    { nome: "Design de sobrancelha", preco: "R$ 40", duracao: "30 min", descricao: "Mapeamento e pinça no horário reservado.", imagemSrc: "" },
    { nome: "Drenagem linfática", preco: "R$ 150", duracao: "1 h", descricao: "Sessão com técnica e indicação confirmadas pelo profissional.", imagemSrc: "" },
  ],
  petshop: [
    { nome: "Banho", preco: "R$ 70", duracao: "45 min", descricao: "Banho e secagem. Avise o porte ao agendar.", imagemSrc: "" },
    { nome: "Tosa higiênica", preco: "R$ 60", duracao: "40 min", descricao: "Patas, barriga e higiene, sem mudar o corte.", imagemSrc: "" },
    { nome: "Corte de unha", preco: "R$ 25", duracao: "15 min", descricao: "Unhas aparadas. Avise o porte ao agendar.", imagemSrc: "" },
    { nome: "Hidratação da pelagem", preco: "R$ 45", duracao: "30 min", descricao: "Cuidado complementar conforme tipo de pelagem e porte.", imagemSrc: "" },
  ],
  academia: [
    { nome: "Avaliação física", preco: "R$ 90", duracao: "50 min", descricao: "Medidas e o primeiro treino da semana.", imagemSrc: "" },
    { nome: "Musculação acompanhada", preco: "R$ 70", duracao: "1 h", descricao: "Sessão com professor ao lado.", imagemSrc: "" },
    { nome: "Funcional", preco: "R$ 60", duracao: "45 min", descricao: "Treino em grupo pequeno, com professor na sala.", imagemSrc: "" },
    { nome: "Treino personalizado", preco: "R$ 100", duracao: "1 h", descricao: "Sessão individual com plano definido pelo profissional.", imagemSrc: "" },
  ],
  contabilidade: [
    { nome: "Abertura de empresa", preco: "R$ 400", duracao: "1 h", descricao: "Orientação e protocolo. Taxa do órgão, se houver, à parte.", imagemSrc: "" },
    { nome: "Orientação de MEI", preco: "R$ 150", duracao: "40 min", descricao: "A inscrição no governo é grátis. Aqui explicamos o que muda.", imagemSrc: "" },
    { nome: "Imposto de renda", preco: "R$ 200", duracao: "1 h", descricao: "A declaração da pessoa física, com os documentos em mãos.", imagemSrc: "" },
    { nome: "Regularização de MEI", preco: "R$ 180", duracao: "50 min", descricao: "Análise da situação e orientação dos próximos passos.", imagemSrc: "" },
  ],
  advocacia: [
    { nome: "Consulta de família", preco: "R$ 250", duracao: "50 min", descricao: "Divórcio, guarda ou pensão. Sala reservada.", imagemSrc: "" },
    { nome: "Consulta do consumidor", preco: "R$ 200", duracao: "40 min", descricao: "Compra, serviço ou cobrança. Leve contrato ou protocolo.", imagemSrc: "" },
    { nome: "Consulta trabalhista", preco: "R$ 250", duracao: "50 min", descricao: "Rescisão, horas ou verbas. Leve o contrato.", imagemSrc: "" },
    { nome: "Consulta previdenciária", preco: "R$ 250", duracao: "50 min", descricao: "Orientação inicial conforme os documentos do caso.", imagemSrc: "" },
  ],
  dentista: [
    { nome: "Consulta de avaliação", preco: "R$ 120", duracao: "40 min", descricao: "Exame clínico e plano do que precisa ser feito.", imagemSrc: "" },
    { nome: "Limpeza", preco: "R$ 180", duracao: "50 min", descricao: "Profilaxia com remoção de placa e polimento.", imagemSrc: "" },
    { nome: "Restauração", preco: "R$ 250", duracao: "1 h", descricao: "Restauração em resina. O dente é combinado na consulta.", imagemSrc: "" },
    { nome: "Clareamento dental", preco: "R$ 500", duracao: "1 h", descricao: "Procedimento e indicação definidos após avaliação odontológica.", imagemSrc: "" },
  ],
  clinica: [
    { nome: "Consulta clínica", preco: "R$ 180", duracao: "40 min", descricao: "Avaliação geral e orientação do próximo passo.", imagemSrc: "" },
    { nome: "Retorno", preco: "R$ 100", duracao: "20 min", descricao: "Revisão do que foi combinado. Horário marcado.", imagemSrc: "" },
    { nome: "Check-up", preco: "R$ 220", duracao: "50 min", descricao: "Conversa sobre exames de rotina e resultados.", imagemSrc: "" },
    { nome: "Consulta pediátrica", preco: "R$ 200", duracao: "40 min", descricao: "Atendimento infantil, conforme a faixa etária e a especialidade.", imagemSrc: "" },
  ],
  psicologia: [
    { nome: "Sessão individual", preco: "R$ 180", duracao: "50 min", descricao: "Conversa reservada com a psicóloga. Sala só sua no horário.", imagemSrc: "" },
    { nome: "Primeira conversa", preco: "R$ 150", duracao: "50 min", descricao: "Para conhecer o consultório e alinhar o que traz você.", imagemSrc: "" },
    { nome: "Sessão de casal", preco: "R$ 220", duracao: "1 h", descricao: "Atendimento a duas pessoas no mesmo horário.", imagemSrc: "" },
    { nome: "Orientação profissional", preco: "R$ 180", duracao: "50 min", descricao: "Atendimento a combinar com a psicóloga responsável.", imagemSrc: "" },
  ],
  nutricionista: [
    { nome: "Avaliação nutricional", preco: "R$ 160", duracao: "50 min", descricao: "Conversa sobre rotina, medidas e o primeiro plano.", imagemSrc: "" },
    { nome: "Plano alimentar", preco: "R$ 220", duracao: "1 h", descricao: "Cardápio da semana alinhado ao que você já come.", imagemSrc: "" },
    { nome: "Reconsulta", preco: "R$ 120", duracao: "40 min", descricao: "Ajuste do plano e dúvidas da semana.", imagemSrc: "" },
    { nome: "Acompanhamento esportivo", preco: "R$ 180", duracao: "50 min", descricao: "Orientação nutricional conforme objetivo e avaliação profissional.", imagemSrc: "" },
  ],
  generico: [
    { nome: "Atendimento", preco: "", duracao: "", descricao: "Consulte o negócio para confirmar os detalhes.", imagemSrc: "" },
    { nome: "Orientação", preco: "", duracao: "", descricao: "Consulte o negócio para confirmar a disponibilidade.", imagemSrc: "" },
    { nome: "Serviço sob consulta", preco: "", duracao: "", descricao: "As opções dependem do que o negócio oferece.", imagemSrc: "" },
    { nome: "Outro serviço", preco: "", duracao: "", descricao: "Adicione uma opção oferecida pelo negócio.", imagemSrc: "" },
  ],
};

const EQUIPE: Record<string, ProSugerido[]> = {
  barbearia: [
    { nome: "Caio Mendes", cargo: "Barbeiro", descricao: "Fade e tesoura.", fotoSrc: "" },
    { nome: "Diego Alves", cargo: "Barbeiro", descricao: "Barba com navalha.", fotoSrc: "" },
  ],
  salao: [
    { nome: "Marina Costa", cargo: "Cabeleireira", descricao: "Corte e cor.", fotoSrc: "" },
    { nome: "Lívia Ramos", cargo: "Cabeleireira", descricao: "Escova e finalização.", fotoSrc: "" },
  ],
  estetica: [
    { nome: "Helena Prado", cargo: "Esteticista", descricao: "Pele e limpeza.", fotoSrc: "" },
    { nome: "Paula Neri", cargo: "Massoterapeuta", descricao: "Massagem e drenagem.", fotoSrc: "" },
  ],
  petshop: [
    { nome: "Bruno Pires", cargo: "Tosador", descricao: "Banho e tosa.", fotoSrc: "" },
    { nome: "Carla Mota", cargo: "Atendimento", descricao: "Recepção e agendamento.", fotoSrc: "" },
  ],
  academia: [
    { nome: "Rafael Lima", cargo: "Professor", descricao: "Musculação.", fotoSrc: "" },
    { nome: "Júlia Castro", cargo: "Professora", descricao: "Avaliação e iniciação.", fotoSrc: "" },
  ],
  contabilidade: [
    { nome: "André Lima", cargo: "Contador", descricao: "Abertura e imposto.", fotoSrc: "" },
    { nome: "Sofia Martins", cargo: "Analista", descricao: "Folha e MEI.", fotoSrc: "" },
  ],
  advocacia: [
    { nome: "Clara Vale", cargo: "Advogada", descricao: "Família e consumidor.", fotoSrc: "" },
    { nome: "Eduardo Luz", cargo: "Advogado", descricao: "Imobiliário.", fotoSrc: "" },
  ],
  dentista: [
    { nome: "Marina Costa", cargo: "Dentista", descricao: "Avaliação e limpeza.", fotoSrc: "" },
    { nome: "Pedro Clara", cargo: "Dentista", descricao: "Restauração e urgência.", fotoSrc: "" },
  ],
  clinica: [
    { nome: "Helena Horizonte", cargo: "Clínica geral", descricao: "Consulta e check-up.", fotoSrc: "" },
    { nome: "Rafael Costa", cargo: "Clínico", descricao: "Retorno e pré-operatório.", fotoSrc: "" },
  ],
  psicologia: [
    { nome: "Ana Serena", cargo: "Psicóloga", descricao: "Individual e adolescente.", fotoSrc: "" },
    { nome: "Bruno Vale", cargo: "Psicólogo", descricao: "Individual e casal.", fotoSrc: "" },
  ],
  nutricionista: [
    { nome: "Lara Farol", cargo: "Nutricionista", descricao: "Avaliação e plano.", fotoSrc: "" },
    { nome: "Tiago Verde", cargo: "Nutricionista", descricao: "Esportiva e reconsulta.", fotoSrc: "" },
  ],
  generico: [],
};

export function dicasDoNicho(nicho: string) {
  const dicas: Record<string, { nome: string; slogan: string; destaque: string; cargo: string }> = {
    barbearia: {
      nome: "Paulinho Barbearia",
      slogan: "Estilo, tradição e confiança em cada corte",
      destaque: "corte na tesoura, navalha, ambiente reservado",
      cargo: "Barbeiro",
    },
    salao: {
      nome: "Studio Ana",
      slogan: "Você mais confiante",
      destaque: "corte, cor, unhas, horário reservado",
      cargo: "Cabeleireira",
    },
    estetica: {
      nome: "Estúdio Clara",
      slogan: "A sala fica só sua no horário",
      destaque: "limpeza de pele, massagem, sobrancelha",
      cargo: "Esteticista",
    },
    petshop: {
      nome: "Banho e Tosa Bento",
      slogan: "Banho e tosa com porte e horário",
      destaque: "banho, tosa, corte de unha",
      cargo: "Tosador",
    },
    academia: {
      nome: "Academia Farol",
      slogan: "Treino com professor na agenda",
      destaque: "avaliação, musculação, funcional",
      cargo: "Professor",
    },
    contabilidade: {
      nome: "Lima Contabilidade",
      slogan: "A reunião com o contador tem hora",
      destaque: "abertura, MEI, imposto de renda",
      cargo: "Contador",
    },
    advocacia: {
      nome: "Vale Luz Advogados",
      slogan: "Primeiro a gente ouve o seu caso",
      destaque: "família, consumidor, trabalhista",
      cargo: "Advogada",
    },
    dentista: {
      nome: "Consultório Costa Clara",
      slogan: "Seu sorriso, no horário que você escolhe",
      destaque: "avaliação, limpeza, restauração, urgência",
      cargo: "Dentista",
    },
    clinica: {
      nome: "Clínica Horizonte",
      slogan: "O médico te recebe no horário marcado",
      destaque: "clínica geral, retorno, check-up, pediatria",
      cargo: "Clínica geral",
    },
    psicologia: {
      nome: "Consultório Serena Vale",
      slogan: "Um horário só seu para conversar",
      destaque: "individual, casal, adolescente, primeira conversa",
      cargo: "Psicóloga",
    },
    nutricionista: {
      nome: "Consultório Nutri Farol",
      slogan: "Comer melhor começa numa conversa",
      destaque: "avaliação, plano alimentar, reconsulta",
      cargo: "Nutricionista",
    },
    generico: {
      nome: "Seu negócio",
      slogan: "Informações claras sobre os serviços",
      destaque: "atendimento sob consulta",
      cargo: "Profissional",
    },
  };
  return dicas[nicho] || dicas.generico;
}

export function servicosDoNicho(nicho: string): ServicoSugerido[] {
  const fotos = FOTO[nicho] || FOTO.generico;
  return (SERVICOS[nicho] || SERVICOS.generico).slice(0, 6).map((s, i) => ({
    ...s,
    imagemSrc: s.imagemSrc || fotos[i] || fotos[0],
  }));
}

export function fotoModelo(nicho: string, indice = 0) {
  const fotos = FOTO[nicho] || FOTO.generico;
  return fotos.length ? fotos[indice % fotos.length] : "";
}

export function equipeDoNicho(nicho: string): ProSugerido[] {
  return (EQUIPE[nicho] || EQUIPE.generico).map((p) => ({ ...p }));
}

export function soDigitosCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

export function formatarCep(v: string) {
  const d = soDigitosCep(v);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
