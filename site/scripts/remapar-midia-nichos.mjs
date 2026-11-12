import fs from "fs";
import path from "path";

const u = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Cada id aparece no máximo 1x por nicho. Preferência: pessoas > procedimento > ambiente. */
const MAPAS = {
  dentista: {
    og: { id: "1606811841689-23dfddce3e95", alt: "Dentista atendendo paciente", w: 1200 },
    hero: { id: "1606811841689-23dfddce3e95", alt: "Dentista atendendo paciente na cadeira", w: 1600 },
    sobre: { id: "1588776814546-1ffcf47267a5", alt: "Dentista analisando radiografia com o paciente", w: 1200 },
    servicos: [
      { id: "1666214280557-f1b5022eb634", alt: "Consulta de avaliação entre dentista e paciente" },
      { id: "1609840114035-3c981b782dfe", alt: "Cuidados de higiene bucal e alinhadores" },
      { id: "1629909613654-28e377c37b09", alt: "Consultório preparado para restauração" },
      { id: "1571772996211-2f02c9727629", alt: "Sorriso claro após clareamento supervisionado" },
      { id: "1598256989800-fe5f95da9787", alt: "Sala pronta para urgência odontológica" },
      { id: "1579684385127-1ef15d508118", alt: "Retorno de acompanhamento com a equipe" },
    ],
    profissionais: [
      { id: "1559839734-2b71ea197ec2", alt: "Retrato de Marina Costa" },
      { id: "1622253692010-333f2da6031d", alt: "Retrato de Pedro Clara" },
      { id: "1594824476967-48c8b964273f", alt: "Retrato de Helena Ramos" },
    ],
    promo: { id: "1537368910025-700350fe46c7", alt: "Equipe preparada para limpeza de novembro", w: 1200 },
    eventos: [
      { id: "1582750433449-648ed127bb54", alt: "Profissional em manhã de higiene bucal", w: 1200 },
      { id: "1519494026892-80bbd2d6fd0d", alt: "Recepção preparada para visita infantil", w: 1200 },
    ],
    galeria: [
      { id: "1516549655169-df83a0774514", alt: "Corredor claro do consultório" },
      { id: "1576091160399-112ba8d25d1d", alt: "Detalhe do atendimento clínico" },
      { id: "1576091160550-2173dba999ef", alt: "Instrumentos e mesa de trabalho" },
      { id: "1631217868264-e5b90bb7e133", alt: "Conversa de orientação no consultório" },
      { id: "1527689368864-3a821dbccc34", alt: "Atendimento por videochamada" },
      { id: "1631815588090-d4bfec5b1ccb", alt: "Atendimento cuidadoso com criança" },
    ],
  },
  clinica: {
    og: { id: "1519494026892-80bbd2d6fd0d", alt: "Recepção de clínica médica", w: 1200 },
    hero: { id: "1519494026892-80bbd2d6fd0d", alt: "Recepção clara de uma clínica médica", w: 1600 },
    sobre: { id: "1666214280557-f1b5022eb634", alt: "Médico em atendimento na clínica", w: 1200 },
    servicos: [
      { id: "1579684385127-1ef15d508118", alt: "Consulta clínica com o médico" },
      { id: "1631217868264-e5b90bb7e133", alt: "Retorno médico com conversa clara" },
      { id: "1576091160399-112ba8d25d1d", alt: "Check-up com avaliação clínica" },
      { id: "1631815588090-d4bfec5b1ccb", alt: "Consulta pediátrica acolhedora" },
      { id: "1537368910025-700350fe46c7", alt: "Avaliação pré-operatória com a equipe" },
      { id: "1527689368864-3a821dbccc34", alt: "Teleconsulta pelo computador" },
    ],
    profissionais: [
      { id: "1559839734-2b71ea197ec2", alt: "Retrato de Helena Horizonte" },
      { id: "1622253692010-333f2da6031d", alt: "Retrato de Rafael Costa" },
      { id: "1594824476967-48c8b964273f", alt: "Retrato de Sofia Neri" },
    ],
    promo: { id: "1582750433449-648ed127bb54", alt: "Clínica preparada para consultas", w: 1200 },
    eventos: [
      { id: "1576091160550-2173dba999ef", alt: "Orientação sobre pressão arterial", w: 1200 },
      { id: "1600880292203-757bb62b4baf", alt: "Espaço para conversa com pais", w: 1200 },
    ],
    galeria: [
      { id: "1516549655169-df83a0774514", alt: "Corredor da clínica" },
      { id: "1606811841689-23dfddce3e95", alt: "Atendimento clínico de perto" },
      { id: "1556761175-b413da4baf72", alt: "Equipe em reunião rápida" },
      { id: "1522071820081-009f0129c71c", alt: "Conversa em equipe" },
      { id: "1600880292089-90a7e086ee0c", alt: "Ambiente de trabalho da clínica" },
      { id: "1552664730-d307ca884978", alt: "Sala de orientação" },
    ],
  },
  psicologia: {
    og: { id: "1758273240331-745ccab011a2", alt: "Sessão de psicologia no divã", w: 1200 },
    hero: { id: "1758273240331-745ccab011a2", alt: "Sessão de psicologia: paciente no divã e terapeuta anotando", w: 1600 },
    sobre: { id: "1573497019940-1c28c88b4f3e", alt: "Psicóloga em atendimento", w: 1200 },
    servicos: [
      { id: "1551836022-d5d88e9218df", alt: "Sessão individual em conversa" },
      { id: "1521737604893-d14cc237f11d", alt: "Primeira conversa no consultório" },
      { id: "1600880292203-757bb62b4baf", alt: "Sessão de casal em diálogo" },
      { id: "1522202176988-66273c2fd55f", alt: "Espaço para adolescente" },
      { id: "1573496359142-b8d87734a5a2", alt: "Retorno breve com a profissional" },
      { id: "1527689368864-3a821dbccc34", alt: "Sessão online por videochamada" },
    ],
    profissionais: [
      { id: "1580489944761-15a19d654956", alt: "Retrato de Ana Serena" },
      { id: "1507003211169-0a1dd7228f2d", alt: "Retrato de Bruno Vale" },
      { id: "1494790108377-be9c29b29330", alt: "Retrato de Lia Campos" },
    ],
    promo: { id: "1438761681033-6461ffad8d80", alt: "Consultório preparado para primeira conversa", w: 1200 },
    eventos: [
      { id: "1556761175-5973dc0f32e7", alt: "Roda sobre rotina e sono", w: 1200 },
      { id: "1522071820081-009f0129c71c", alt: "Conversa para pais", w: 1200 },
    ],
    galeria: [
      { id: "1552664730-d307ca884978", alt: "Conversa acolhedora no consultório" },
      { id: "1517245386807-bb43f82c33c4", alt: "Espaço de diálogo em grupo" },
      { id: "1573164713714-d95e436ab8d6", alt: "Profissional ouvindo com atenção" },
      { id: "1600880292089-90a7e086ee0c", alt: "Ambiente claro do consultório" },
      { id: "1544005313-94ddf0286df2", alt: "Retrato acolhedor no atendimento" },
      { id: "1531123897727-8f129e1688ce", alt: "Sorriso tranquilo na recepção" },
    ],
  },
  nutricionista: {
    og: { id: "1490645935967-10de6ba17061", alt: "Alimentos frescos sobre a mesa", w: 1200 },
    hero: { id: "1490645935967-10de6ba17061", alt: "Mesa com alimentos saudáveis", w: 1600 },
    sobre: { id: "1512621776951-a57141f2eefd", alt: "Prato com vegetais frescos", w: 1200 },
    servicos: [
      { id: "1551836022-d5d88e9218df", alt: "Avaliação nutricional em conversa" },
      { id: "1498837167922-ddd27525d352", alt: "Alimentos para montar o plano" },
      { id: "1546069901-ba9599a7e63c", alt: "Reconsulta com ajuste do plano" },
      { id: "1504674900247-0877df9cc836", alt: "Orientação alimentar para treino" },
      { id: "1556910103-1c02745aae4d", alt: "Consulta familiar na cozinha" },
      { id: "1527689368864-3a821dbccc34", alt: "Consulta online de nutrição" },
    ],
    profissionais: [
      { id: "1594824476967-48c8b964273f", alt: "Retrato de Lara Farol" },
      { id: "1622253692010-333f2da6031d", alt: "Retrato de Tiago Verde" },
      { id: "1559839734-2b71ea197ec2", alt: "Retrato de Nina Costa" },
    ],
    promo: { id: "1573496359142-b8d87734a5a2", alt: "Consultório preparado para avaliação", w: 1200 },
    eventos: [
      { id: "1515377905703-c4788e51af15", alt: "Manhã da feira com vegetais", w: 1200 },
      { id: "1600880292203-757bb62b4baf", alt: "Oficina de marmita em grupo", w: 1200 },
    ],
    galeria: [
      { id: "1573497019940-1c28c88b4f3e", alt: "Nutricionista em atendimento" },
      { id: "1521737604893-d14cc237f11d", alt: "Conversa sobre rotina alimentar" },
      { id: "1522202176988-66273c2fd55f", alt: "Equipe em orientação" },
      { id: "1556761175-b413da4baf72", alt: "Reunião rápida sobre o plano" },
      { id: "1438761681033-6461ffad8d80", alt: "Paciente sorrindo na consulta" },
      { id: "1494790108377-be9c29b29330", alt: "Profissional acolhedora" },
    ],
  },
  advocacia: {
    og: { id: "1521587760476-6c12a4b040da", alt: "Estante de livros jurídicos", w: 1200 },
    hero: { id: "1521587760476-6c12a4b040da", alt: "Estante de livros em um escritório", w: 1600 },
    sobre: { id: "1551836022-d5d88e9218df", alt: "Advogada em conversa com cliente", w: 1200 },
    servicos: [
      { id: "1600880292203-757bb62b4baf", alt: "Consulta inicial em diálogo" },
      { id: "1454165804606-c3d57bc86b40", alt: "Consulta trabalhista com documentos" },
      { id: "1522071820081-009f0129c71c", alt: "Consulta de família" },
      { id: "1552664730-d307ca884978", alt: "Consulta do consumidor" },
      { id: "1517245386807-bb43f82c33c4", alt: "Consulta imobiliária" },
      { id: "1450101499163-c8848c66ca85", alt: "Análise de contrato sobre a mesa" },
    ],
    profissionais: [
      { id: "1573497019940-1c28c88b4f3e", alt: "Retrato de Lorena Vale" },
      { id: "1560250097-0b93528c311a", alt: "Retrato de Paulo Luz" },
      { id: "1494790108377-be9c29b29330", alt: "Retrato de Sofia Andrade" },
    ],
    promo: { id: "1573496359142-b8d87734a5a2", alt: "Escritório preparado para consultas", w: 1200 },
    eventos: [
      { id: "1556761175-5973dc0f32e7", alt: "Conversa sobre contrato de aluguel", w: 1200 },
      { id: "1600880292089-90a7e086ee0c", alt: "Manhã do consumidor", w: 1200 },
    ],
    galeria: [
      { id: "1505664194779-8beaceb93744", alt: "Livros e mesa de leitura" },
      { id: "1589829545856-d10d557cf95f", alt: "Fachada clássica do escritório" },
      { id: "1560518883-ce09059eeffa", alt: "Aperto de mãos após a conversa" },
      { id: "1522202176988-66273c2fd55f", alt: "Equipe em alinhamento" },
      { id: "1521737604893-d14cc237f11d", alt: "Reunião no escritório" },
      { id: "1472099645785-5658abf4ff4e", alt: "Advogado em atendimento" },
    ],
  },
};

function assertUnique(nicho, mapa) {
  const ids = [];
  const push = (x) => ids.push(x.id);
  // hero e og podem compartilhar (mesmo slot visual de capa) — contamos uma vez
  push(mapa.hero);
  push(mapa.sobre);
  mapa.servicos.forEach(push);
  mapa.profissionais.forEach(push);
  push(mapa.promo);
  mapa.eventos.forEach(push);
  mapa.galeria.forEach(push);
  const set = new Set(ids);
  if (set.size !== ids.length) {
    const counts = {};
    for (const id of ids) counts[id] = (counts[id] || 0) + 1;
    const dups = Object.entries(counts).filter(([, c]) => c > 1);
    throw new Error(`${nicho} dups: ${JSON.stringify(dups)}`);
  }
}

function aplicar(file, mapa) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  if (j.seo?.og_image) {
    j.seo.og_image.src = u(mapa.og.id, mapa.og.w || 1200);
    j.seo.og_image.alt = mapa.og.alt;
  }
  if (j.hero?.imagem) {
    j.hero.imagem.src = u(mapa.hero.id, mapa.hero.w || 1600);
    j.hero.imagem.alt = mapa.hero.alt;
  }
  if (j.sobre?.imagem) {
    j.sobre.imagem.src = u(mapa.sobre.id, mapa.sobre.w || 1200);
    j.sobre.imagem.alt = mapa.sobre.alt;
  }
  (j.servicos?.itens || []).forEach((it, i) => {
    const m = mapa.servicos[i];
    if (!m || !it.imagem) return;
    it.imagem.src = u(m.id, 800);
    it.imagem.alt = m.alt;
  });
  (j.profissionais?.itens || []).forEach((it, i) => {
    const m = mapa.profissionais[i];
    if (!m || !it.foto) return;
    it.foto.src = u(m.id, 800);
    it.foto.alt = m.alt;
  });
  if (j.promocoes?.itens?.[0]?.imagem) {
    j.promocoes.itens[0].imagem.src = u(mapa.promo.id, mapa.promo.w || 1200);
    j.promocoes.itens[0].imagem.alt = mapa.promo.alt;
  }
  (j.eventos?.itens || []).forEach((it, i) => {
    const m = mapa.eventos[i];
    if (!m || !it.imagem) return;
    it.imagem.src = u(m.id, m.w || 1200);
    it.imagem.alt = m.alt;
  });
  (j.galeria?.itens || []).forEach((it, i) => {
    const m = mapa.galeria[i];
    if (!m || !it.imagem) return;
    it.imagem.src = u(m.id, 900);
    it.imagem.alt = m.alt;
    if (it.legenda && /odontol|dentista|cadeira odont/i.test(it.legenda)) {
      it.legenda = m.alt.split(" ").slice(0, 3).join(" ");
    }
  });
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
}

const roots = [
  "C:/Dev/guix-automation/site/content/exemplos",
  "C:/Dev/guix-automation/exemplos",
];

for (const [nicho, mapa] of Object.entries(MAPAS)) {
  assertUnique(nicho, mapa);
  for (const root of roots) {
    const file = path.join(root, `${nicho}.site.json`);
    if (!fs.existsSync(file)) continue;
    aplicar(file, mapa);
    console.log("ok", file);
  }
}

// prototipo advocacia
const proto = "C:/Dev/guix-automation/prototipos/advocacia/src/content/site.json";
if (fs.existsSync(proto)) {
  aplicar(proto, MAPAS.advocacia);
  console.log("ok", proto);
}

console.log("done");
