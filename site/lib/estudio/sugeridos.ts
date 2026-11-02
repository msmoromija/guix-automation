export type ServicoSugerido = { nome: string; preco: string; duracao: string; descricao: string };
export type ProSugerido = { nome: string; cargo: string; descricao: string; fotoSrc: string };

const SERVICOS: Record<string, ServicoSugerido[]> = {
  barbearia: [
    { nome: "Corte masculino", preco: "R$ 50", duracao: "40 min", descricao: "Tesoura ou máquina, do clássico ao degradê." },
    { nome: "Barba", preco: "R$ 35", duracao: "30 min", descricao: "Toalha quente, navalha e alinhamento." },
    { nome: "Corte e barba", preco: "R$ 80", duracao: "1 h 10 min", descricao: "Os dois no mesmo horário, com um barbeiro só." },
  ],
  salao: [
    { nome: "Corte feminino", preco: "R$ 80", duracao: "50 min", descricao: "Tesoura, do repicado ao chanel, com finalização." },
    { nome: "Escova", preco: "R$ 60", duracao: "45 min", descricao: "Lavagem e escova para o compromisso do dia." },
    { nome: "Coloração", preco: "R$ 180", duracao: "2 h", descricao: "Cor inteira com teste de mecha." },
  ],
  estetica: [
    { nome: "Limpeza de pele", preco: "R$ 140", duracao: "1 h", descricao: "Higienização, extração e máscara." },
    { nome: "Massagem relaxante", preco: "R$ 130", duracao: "50 min", descricao: "A sala fica só com você no horário." },
    { nome: "Drenagem linfática", preco: "R$ 120", duracao: "50 min", descricao: "Massagem leve no corpo, ritmo lento." },
  ],
  petshop: [
    { nome: "Banho", preco: "R$ 70", duracao: "45 min", descricao: "Banho e secagem. Avise o porte ao agendar." },
    { nome: "Tosa higiênica", preco: "R$ 60", duracao: "40 min", descricao: "Patas, barriga e higiene, sem mudar o corte." },
    { nome: "Tosa completa", preco: "R$ 110", duracao: "1 h 20 min", descricao: "Corte do corpo no estilo combinado na hora." },
  ],
  academia: [
    { nome: "Avaliação física", preco: "R$ 90", duracao: "50 min", descricao: "Medidas e o primeiro treino da semana." },
    { nome: "Musculação acompanhada", preco: "R$ 70", duracao: "1 h", descricao: "Sessão com professor ao lado." },
    { nome: "Treino de iniciação", preco: "R$ 80", duracao: "1 h", descricao: "Para quem nunca treinou." },
  ],
  contabilidade: [
    { nome: "Abertura de empresa", preco: "R$ 400", duracao: "1 h", descricao: "Orientação e protocolo. Taxa do órgão, se houver, à parte." },
    { nome: "Orientação de MEI", preco: "R$ 150", duracao: "40 min", descricao: "A inscrição no governo é grátis. Aqui explicamos o que muda." },
    { nome: "Imposto de renda", preco: "R$ 280", duracao: "1 h", descricao: "Declaração com os documentos que você já tem." },
  ],
  advocacia: [
    { nome: "Consulta de família", preco: "R$ 250", duracao: "50 min", descricao: "Divórcio, guarda ou pensão. Sala reservada." },
    { nome: "Consulta do consumidor", preco: "R$ 200", duracao: "40 min", descricao: "Compra, serviço ou cobrança. Leve contrato ou protocolo." },
    { nome: "Consulta imobiliária", preco: "R$ 250", duracao: "50 min", descricao: "Aluguel, compra e venda ou distrato." },
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

export function servicosDoNicho(nicho: string): ServicoSugerido[] {
  return (SERVICOS[nicho] || SERVICOS.barbearia).map((s) => ({ ...s }));
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
