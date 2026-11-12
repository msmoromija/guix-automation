import fs from "fs";

const base = JSON.parse(fs.readFileSync("content/exemplos/dentista.site.json", "utf8"));
const s = JSON.parse(JSON.stringify(base));

s.meta.nicho = "clinica";
s.meta.template_id = "clinica-v1";
Object.assign(s.empresa, {
  nome: "Clínica Horizonte",
  slogan: "Cuidado clínico sem fila na recepção.",
  telefone: "7930000010",
  telefone_label: "(79) 3000-0010",
  whatsapp: "5579999990010",
  whatsapp_label: "(79) 99999-0010",
  whatsapp_mensagem: "Olá, vim pelo site da Clínica Horizonte e quero agendar uma consulta.",
  whatsapp_aria: "Chamar a Clínica Horizonte no WhatsApp",
  email: "contato@clinicahorizonte.com.br",
  horario_resumo: "Segunda a sexta, 8h às 12h e 14h às 18h · Sábado, 8h às 12h",
});
s.empresa.logo.alt = "Clínica Horizonte";
s.empresa.endereco = {
  logradouro: "Avenida Beira Mar",
  numero: "1200",
  complemento: "sala 201",
  bairro: "Treze de Julho",
  cidade: "Aracaju",
  estado: "SE",
  cep: "49020-010",
  completo: "Avenida Beira Mar, 1200, sala 201 — Treze de Julho, Aracaju - SE",
  mapa_embed_url: "",
};
s.empresa.redes[0].url = "https://instagram.com/clinicahorizonte";
s.empresa.expediente = [
  { dia: "seg", label: "Segunda", intervalos: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "ter", label: "Terça", intervalos: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "qua", label: "Quarta", intervalos: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "qui", label: "Quinta", intervalos: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "sex", label: "Sexta", intervalos: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"] },
  { dia: "sab", label: "Sábado", intervalos: ["08:00", "09:00", "10:00", "11:00"] },
];
s.tema = {
  color_primary: "#0F3D5E",
  color_secondary: "#0EA5E9",
  color_accent: "#0EA5E9",
  color_background: "#F3F7FA",
  color_surface: "#FFFFFF",
  color_text: "#0F3D5E",
  color_text_muted: "#5A6F7C",
  font_heading: "Manrope",
  font_body: "Manrope",
  radius: "md",
};
s.seo = {
  title: "Clínica Horizonte | Consulta médica em Treze de Julho, Aracaju",
  description:
    "Agende consulta clínica, retorno, check-up ou avaliação pediátrica na Clínica Horizonte. Horário marcado de segunda a sábado.",
  keywords: ["clínica médica em Aracaju", "consulta marcada", "clínica em Treze de Julho", "agendamento"],
  og_title: "Clínica Horizonte | Médico no horário marcado",
  og_description: "Consulta clínica com horário reservado. Agende pelo site ou chame no WhatsApp.",
  og_image: {
    id: "img_og",
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    alt: "Recepção de clínica médica",
    categoria: "og",
  },
  canonical_url: "",
};
s.header = {
  botao_agendar: "Agendar consulta",
  menu: [
    { id: "inicio", label: "Início", href: "#inicio" },
    { id: "sobre", label: "A clínica", href: "#sobre" },
    { id: "servicos", label: "Consultas", href: "#servicos" },
    { id: "profissionais", label: "Médicos", href: "#profissionais" },
    { id: "promocoes", label: "Condições", href: "#promocoes" },
    { id: "faq", label: "Dúvidas", href: "#faq" },
    { id: "contato", label: "Contato", href: "#contato" },
  ],
};
s.hero = {
  titulo: "O médico te recebe no horário marcado.",
  subtitulo:
    "Clínica geral, retorno, check-up e pediatria em Treze de Julho. Você marca, chega no horário e é atendido na sala reservada.",
  botao_principal: "Agendar consulta",
  botao_secundario: "Chamar no WhatsApp",
  imagem: {
    id: "img_hero",
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80",
    alt: "Recepção clara de uma clínica médica",
    categoria: "hero",
  },
};
s.sobre = {
  titulo: "Clínica com horário reservado",
  paragrafos: [
    "A Horizonte atende com hora marcada, em Treze de Julho. A agenda do site separa o horário da sala — sem fila na recepção.",
    "Os atendimentos da casa são consulta clínica, retorno, check-up, pediatria e avaliação pré-operatória simples.",
    "Cirurgia hospitalar, UTI e exames de imagem complexos ficam fora desta página. Se o caso pedir outro caminho, o médico explica na própria consulta.",
  ],
  imagem: {
    id: "img_sobre",
    src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&q=80",
    alt: "Médico em atendimento na clínica",
    categoria: "sobre",
  },
};
s.servicos = {
  titulo: "Consultas",
  subtitulo: "Cada card é um horário. O preço é da consulta marcada.",
  itens: [
    {
      id: "srv_clinica",
      nome: "Consulta clínica",
      descricao: "Avaliação geral, sintomas do dia a dia e orientação do próximo passo.",
      preco: 180,
      preco_label: "R$ 180",
      duracao_minutos: 40,
      duracao_label: "40 min",
      imagem: {
        id: "img_srv_clinica",
        src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=800&q=80",
        alt: "Consulta clínica",
        categoria: "servico",
      },
    },
    {
      id: "srv_retorno",
      nome: "Retorno",
      descricao: "Revisão do que foi combinado. Só com horário marcado.",
      preco: 100,
      preco_label: "R$ 100",
      duracao_minutos: 20,
      duracao_label: "20 min",
      imagem: {
        id: "img_srv_retorno",
        src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
        alt: "Retorno médico",
        categoria: "servico",
      },
    },
    {
      id: "srv_checkup",
      nome: "Check-up",
      descricao: "Conversa sobre exames de rotina e o que fazer com o resultado.",
      preco: 220,
      preco_label: "R$ 220",
      duracao_minutos: 50,
      duracao_label: "50 min",
      imagem: {
        id: "img_srv_checkup",
        src: "https://images.unsplash.com/photo-1581595220892-b0739db3ea40?auto=format&fit=crop&w=800&q=80",
        alt: "Check-up na clínica",
        categoria: "servico",
      },
    },
    {
      id: "srv_pedia",
      nome: "Consulta pediátrica",
      descricao: "Atendimento infantil com responsável presente.",
      preco: 200,
      preco_label: "R$ 200",
      duracao_minutos: 40,
      duracao_label: "40 min",
      imagem: {
        id: "img_srv_pedia",
        src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=800&q=80",
        alt: "Consulta pediátrica",
        categoria: "servico",
      },
    },
    {
      id: "srv_pre",
      nome: "Avaliação pré-operatória",
      descricao: "Orientação antes de procedimento eletivo. Laudo completo, se existir, é combinado à parte.",
      preco: 250,
      preco_label: "R$ 250",
      duracao_minutos: 40,
      duracao_label: "40 min",
      imagem: {
        id: "img_srv_pre",
        src: "https://images.unsplash.com/photo-1551076805-e1869033fa41?auto=format&fit=crop&w=800&q=80",
        alt: "Avaliação pré-operatória",
        categoria: "servico",
      },
    },
    {
      id: "srv_online",
      nome: "Teleconsulta",
      descricao: "Mesmo horário marcado, por videochamada. O link chega no WhatsApp.",
      preco: 160,
      preco_label: "R$ 160",
      duracao_minutos: 30,
      duracao_label: "30 min",
      imagem: {
        id: "img_srv_online",
        src: "https://images.unsplash.com/photo-1588196740434-33876c8d5a8d?auto=format&fit=crop&w=800&q=80",
        alt: "Teleconsulta",
        categoria: "servico",
      },
    },
  ],
};
s.profissionais = {
  titulo: "Médicos",
  subtitulo: "Escolha com quem prefere ser atendido ou siga sem preferência.",
  itens: [
    {
      id: "pro_helena",
      nome: "Helena Horizonte",
      cargo: "Clínica geral",
      descricao: "Consulta clínica e check-up. Explica o plano antes de pedir exame.",
      whatsapp: "",
      foto: {
        id: "img_pro_helena",
        src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80",
        alt: "Retrato de Helena Horizonte",
        categoria: "profissional",
      },
    },
    {
      id: "pro_rafael",
      nome: "Rafael Costa",
      cargo: "Clínico",
      descricao: "Retorno e avaliação pré-operatória. Prefere agenda da manhã.",
      whatsapp: "",
      foto: {
        id: "img_pro_rafael",
        src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80",
        alt: "Retrato de Rafael Costa",
        categoria: "profissional",
      },
    },
    {
      id: "pro_sofia",
      nome: "Sofia Neri",
      cargo: "Pediatra",
      descricao: "Consulta pediátrica e teleconsulta. Confirma o link no WhatsApp.",
      whatsapp: "",
      foto: {
        id: "img_pro_sofia",
        src: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80",
        alt: "Retrato de Sofia Neri",
        categoria: "profissional",
      },
    },
  ],
};
s.diferenciais = {
  titulo: "Como a consulta funciona",
  itens: [
    { id: "dif_horario", titulo: "Hora marcada", descricao: "A sala fica reservada no horário. Não há fila de espera.", icone: "clock" },
    { id: "dif_plano", titulo: "Plano claro", descricao: "Na consulta, o médico diz o que fazer agora e o que fica para depois.", icone: "clipboard" },
    { id: "dif_online", titulo: "Presencial ou teleconsulta", descricao: "Você escolhe o formato ao marcar. Online recebe o link no WhatsApp.", icone: "message-circle" },
    { id: "dif_cuidado", titulo: "Sem promessa milagrosa", descricao: "A consulta orienta. Resultado depende de cada caso.", icone: "shield" },
  ],
};
s.promocoes = {
  titulo: "Condições",
  itens: [
    {
      id: "prm_novembro",
      titulo: "Consulta clínica de novembro",
      descricao: "A consulta clínica fica por R$ 150 até 30/11/2026. Retorno e check-up mantêm o preço do card.",
      validade: "2026-11-30",
      validade_label: "Até 30/11/2026",
      imagem: {
        id: "img_prm_novembro",
        src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
        alt: "Clínica preparada para consultas",
        categoria: "promocao",
      },
    },
  ],
};
s.eventos = {
  titulo: "Encontros",
  itens: [
    {
      id: "evt_pressao",
      titulo: "Manhã da pressão",
      descricao: "Orientação rápida sobre medição em casa. Caso individual continua na consulta marcada.",
      data: "2026-11-27",
      data_label: "27 de novembro",
      horario: "09:00",
      imagem: {
        id: "img_evt_pressao",
        src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
        alt: "Orientação sobre pressão arterial",
        categoria: "evento",
      },
    },
    {
      id: "evt_pais",
      titulo: "Conversa para pais",
      descricao: "Dúvidas gerais sobre a primeira consulta pediátrica. Sem atendimento clínico nesse horário.",
      data: "2026-12-11",
      data_label: "11 de dezembro",
      horario: "10:00",
      imagem: {
        id: "img_evt_pais",
        src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&q=80",
        alt: "Espaço para conversa com pais",
        categoria: "evento",
      },
    },
  ],
};
s.galeria = {
  titulo: "A clínica",
  itens: [
    { id: "gal_01", legenda: "Recepção", imagem: { id: "img_gal_01", src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80", alt: "Recepção da clínica", categoria: "galeria" } },
    { id: "gal_02", legenda: "Consulta", imagem: { id: "img_gal_02", src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=900&q=80", alt: "Sala de consulta", categoria: "galeria" } },
    { id: "gal_03", legenda: "Atendimento", imagem: { id: "img_gal_03", src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80", alt: "Atendimento médico", categoria: "galeria" } },
    { id: "gal_04", legenda: "Corredor", imagem: { id: "img_gal_04", src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80", alt: "Corredor da clínica", categoria: "galeria" } },
    { id: "gal_05", legenda: "Equipe", imagem: { id: "img_gal_05", src: "https://images.unsplash.com/photo-1551076805-e1869033fa41?auto=format&fit=crop&w=900&q=80", alt: "Equipe da clínica", categoria: "galeria" } },
    { id: "gal_06", legenda: "Ambiente", imagem: { id: "img_gal_06", src: "https://images.unsplash.com/photo-1581595220892-b0739db3ea40?auto=format&fit=crop&w=900&q=80", alt: "Ambiente clínico", categoria: "galeria" } },
  ],
};
s.faq = {
  titulo: "Dúvidas",
  itens: [
    { id: "faq_plano", pergunta: "Vocês aceitam plano de saúde?", resposta: "Esta página de demonstração não lista convênios. Na clínica real, a recepção informa quais planos são aceitos." },
    { id: "faq_preco", pergunta: "O preço do card inclui exame?", resposta: "Não. O preço é só da consulta. Exame, se precisar, é combinado na própria consulta." },
    { id: "faq_crm", pergunta: "Os médicos têm CRM?", resposta: "Sim. O número de cada médico é informado na consulta, não nesta página de demonstração." },
    { id: "faq_urgencia", pergunta: "É pronto-socorro?", resposta: "Não. Atendemos com hora marcada. Urgência hospitalar deve ir ao serviço de emergência." },
    { id: "faq_online", pergunta: "Como funciona a teleconsulta?", resposta: "Você marca o horário no site. O link da videochamada chega no WhatsApp antes do atendimento." },
    { id: "faq_cancelar", pergunta: "Como cancelo uma consulta?", resposta: "Chame no WhatsApp com pelo menos 24 horas de antecedência e peça para liberar o horário." },
  ],
};
s.contato = {
  titulo: "Venha a Treze de Julho",
  subtitulo: "Agende a consulta pelo site ou chame no WhatsApp. O endereço e o horário estão aqui.",
  formulario: s.contato.formulario,
};
s.agendamento = {
  ...s.agendamento,
  titulo: "Agendar consulta",
  subtitulo: "Escolha a consulta, o médico e um horário. A confirmação é feita no WhatsApp.",
  passo_servico: "Consulta",
  passo_profissional: "Médico",
  placeholder_observacao: "Ex.: retorno de hipertensão, leve exames",
  botao_confirmar: "Confirmar pelo WhatsApp",
  fechado: "Fechado neste dia. A clínica atende de segunda a sábado pela manhã.",
  erro_campos: "Preencha consulta, médico, dia, horário, nome e WhatsApp.",
};
s.obrigado = {
  agendamento: {
    titulo: "Falta só confirmar",
    texto: "Sua consulta está separada nesta tela. Chame no WhatsApp para a clínica confirmar.",
  },
  contato: {
    titulo: "Mensagem pronta",
    texto: "Sua mensagem já está escrita. Abra o WhatsApp para enviar à clínica.",
  },
  botao_whatsapp: "Abrir WhatsApp",
  botao_inicio: "Voltar ao início",
};
s.privacidade = {
  titulo: "Privacidade",
  paragrafos: [
    "A Clínica Horizonte usa os dados que você informa no site para responder seu contato e confirmar a consulta.",
    "Os dados pedidos são nome, telefone, e-mail se você quiser informar, serviço, profissional, dia, horário e a mensagem que você escrever.",
    "Esses dados não são vendidos. Servem para a clínica falar com você pelo WhatsApp ou pelo telefone informado.",
    "Para pedir a exclusão do que foi enviado, chame no WhatsApp da clínica e peça a remoção do contato.",
  ],
};
s.rodape = {
  texto: "Clínica Horizonte · Treze de Julho, Aracaju - SE",
  links: [
    { id: "agendar", label: "Agendar consulta", href: "/agendar" },
    { id: "privacidade", label: "Privacidade", href: "/privacidade" },
  ],
};

const json = JSON.stringify(s, null, 2);
fs.writeFileSync("content/exemplos/clinica.site.json", json);
fs.writeFileSync("../exemplos/clinica.site.json", json);
console.log("clinica ok", s.faq.itens.length, "faqs");
