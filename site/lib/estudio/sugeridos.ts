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
} as Record<string, string[]>;
export type ProSugerido = { nome: string; cargo: string; descricao: string; fotoSrc: string };

const SERVICOS: Record<string, ServicoSugerido[]> = {
  barbearia: [
    { nome: "Corte masculino", preco: "R$ 50", duracao: "40 min", descricao: "Tesoura ou máquina, do clássico ao degradê.", imagemSrc: "" },
    { nome: "Barba", preco: "R$ 35", duracao: "30 min", descricao: "Toalha quente, navalha e alinhamento.", imagemSrc: "" },
    { nome: "Acabamento", preco: "R$ 25", duracao: "20 min", descricao: "Contorno da barba e da nuca, na tesoura ou na máquina.", imagemSrc: "" },
  ],
  salao: [
    { nome: "Corte feminino", preco: "R$ 80", duracao: "50 min", descricao: "Tesoura, do repicado ao chanel, com finalização.", imagemSrc: "" },
    { nome: "Escova", preco: "R$ 60", duracao: "45 min", descricao: "Lavagem e escova para o compromisso do dia.", imagemSrc: "" },
    { nome: "Coloração", preco: "R$ 180", duracao: "2 h", descricao: "Tintura no tom combinado antes de começar.", imagemSrc: "" },
  ],
  estetica: [
    { nome: "Limpeza de pele", preco: "R$ 140", duracao: "1 h", descricao: "Higienização, extração e máscara.", imagemSrc: "" },
    { nome: "Massagem relaxante", preco: "R$ 130", duracao: "50 min", descricao: "A sala fica só com você no horário.", imagemSrc: "" },
    { nome: "Design de sobrancelha", preco: "R$ 40", duracao: "30 min", descricao: "Mapeamento e pinça no horário reservado.", imagemSrc: "" },
  ],
  petshop: [
    { nome: "Banho", preco: "R$ 70", duracao: "45 min", descricao: "Banho e secagem. Avise o porte ao agendar.", imagemSrc: "" },
    { nome: "Tosa higiênica", preco: "R$ 60", duracao: "40 min", descricao: "Patas, barriga e higiene, sem mudar o corte.", imagemSrc: "" },
    { nome: "Corte de unha", preco: "R$ 25", duracao: "15 min", descricao: "Unhas aparadas. Avise o porte ao agendar.", imagemSrc: "" },
  ],
  academia: [
    { nome: "Avaliação física", preco: "R$ 90", duracao: "50 min", descricao: "Medidas e o primeiro treino da semana.", imagemSrc: "" },
    { nome: "Musculação acompanhada", preco: "R$ 70", duracao: "1 h", descricao: "Sessão com professor ao lado.", imagemSrc: "" },
    { nome: "Funcional", preco: "R$ 60", duracao: "45 min", descricao: "Treino em grupo pequeno, com professor na sala.", imagemSrc: "" },
  ],
  contabilidade: [
    { nome: "Abertura de empresa", preco: "R$ 400", duracao: "1 h", descricao: "Orientação e protocolo. Taxa do órgão, se houver, à parte.", imagemSrc: "" },
    { nome: "Orientação de MEI", preco: "R$ 150", duracao: "40 min", descricao: "A inscrição no governo é grátis. Aqui explicamos o que muda.", imagemSrc: "" },
    { nome: "Imposto de renda", preco: "R$ 200", duracao: "1 h", descricao: "A declaração da pessoa física, com os documentos em mãos.", imagemSrc: "" },
  ],
  advocacia: [
    { nome: "Consulta de família", preco: "R$ 250", duracao: "50 min", descricao: "Divórcio, guarda ou pensão. Sala reservada.", imagemSrc: "" },
    { nome: "Consulta do consumidor", preco: "R$ 200", duracao: "40 min", descricao: "Compra, serviço ou cobrança. Leve contrato ou protocolo.", imagemSrc: "" },
    { nome: "Consulta trabalhista", preco: "R$ 250", duracao: "50 min", descricao: "Rescisão, horas ou verbas. Leve o contrato.", imagemSrc: "" },
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
      slogan: "Consulta com dia e hora",
      destaque: "família, consumidor, trabalhista",
      cargo: "Advogada",
    },
  };
  return dicas[nicho] || dicas.barbearia;
}

export function servicosDoNicho(nicho: string): ServicoSugerido[] {
  const fotos = FOTO[nicho] || FOTO.barbearia;
  return (SERVICOS[nicho] || SERVICOS.barbearia).slice(0, 3).map((s, i) => ({
    ...s,
    imagemSrc: s.imagemSrc || fotos[i] || fotos[0],
  }));
}

export function fotoModelo(nicho: string, indice = 0) {
  const fotos = FOTO[nicho] || FOTO.barbearia;
  return fotos[indice % fotos.length];
}

export function equipeDoNicho(nicho: string): ProSugerido[] {
  return (EQUIPE[nicho] || EQUIPE.barbearia).map((p) => ({ ...p }));
}

export function soDigitosCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

export function formatarCep(v: string) {
  const d = soDigitosCep(v);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
