import type { EntradaAutomacao } from "./tipos";

const FICTICIO =
  /spring field|rua onde fica|animador de porta|lorem|placeholder|exemplo\.com|0000-0000|00\.000\.000\/0000-00|barbeariavilanorte|vila norte|vila flor|salaovilaflor|serra clara|pet shop bento|academia farol|lima contabilidade|vale luz/i;

const EXPEDIENTE_NEUTRO = [
  { dia: "seg", label: "Segunda", intervalos: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "ter", label: "Terça", intervalos: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "qua", label: "Quarta", intervalos: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "qui", label: "Quinta", intervalos: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { dia: "sex", label: "Sexta", intervalos: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
];

const DIFERENCIAIS_NEUTROS = [
  { id: "dif_01", titulo: "Horário combinado", descricao: "Você marca o horário e é atendido sem fila na porta.", icone: "check" },
  { id: "dif_02", titulo: "WhatsApp direto", descricao: "Dúvidas, reagendamento e confirmação pelo mesmo número do site.", icone: "check" },
  { id: "dif_03", titulo: "Atendimento claro", descricao: "Combinamos o serviço e o valor antes de começar.", icone: "check" },
];

export function ehFicticio(v?: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return FICTICIO.test(s);
}

function limparString(v: unknown) {
  const s = String(v || "").trim();
  if (!s || ehFicticio(s)) return "";
  return s;
}

/** Tira identidade do modelo (Vila Norte etc.) para o rascunho não nascer com dados de outro. */
export function limparIdentidadeExemplo(site: Record<string, unknown>, entrada: EntradaAutomacao) {
  const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
  empresa.nome = entrada.nome;
  empresa.slogan = entrada.slogan || "";
  empresa.cnpj = entrada.cnpj || "";
  empresa.email = entrada.email || "";
  empresa.telefone = "";
  empresa.telefone_label = "";
  empresa.whatsapp = "";
  empresa.whatsapp_label = "";
  empresa.whatsapp_mensagem = `Olá, vim pelo site de ${entrada.nome} e quero agendar.`;
  empresa.whatsapp_aria = `Chamar ${entrada.nome} no WhatsApp`;
  empresa.horario_resumo = "Horário a combinar";
  empresa.expediente = EXPEDIENTE_NEUTRO;
  empresa.endereco = {
    logradouro: entrada.logradouro || "",
    numero: entrada.numero || "",
    complemento: "",
    bairro: entrada.bairro || "",
    cidade: entrada.cidade || "",
    estado: entrada.estado || "",
    cep: entrada.cep || "",
    completo: "",
    mapa_embed_url: "",
  };
  const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
  empresa.redes = redes.map((r) => ({ ...r, url: "" }));
  site.empresa = empresa;

  const agendamento = { ...((site.agendamento as Record<string, unknown>) || {}) };
  agendamento.fechado = "Fechado neste dia. Combine o horário no WhatsApp.";
  if (/barbeiro|barbearia/i.test(String(agendamento.passo_profissional || ""))) agendamento.passo_profissional = "Profissional";
  if (/barbeiro|barbearia/i.test(String(agendamento.subtitulo || ""))) {
    agendamento.subtitulo = "Escolha o serviço, o profissional e um horário. A confirmação é pelo WhatsApp.";
  }
  site.agendamento = agendamento;

  const diferenciais = { ...((site.diferenciais as Record<string, unknown>) || {}) };
  diferenciais.titulo = String(diferenciais.titulo || "Por que escolher").trim() || "Por que escolher";
  diferenciais.itens = DIFERENCIAIS_NEUTROS;
  site.diferenciais = diferenciais;

  const faq = { ...((site.faq as Record<string, unknown>) || {}) };
  faq.titulo = String(faq.titulo || "Dúvidas").trim() || "Dúvidas";
  faq.itens = [];
  site.faq = faq;

  const obrigado = { ...((site.obrigado as Record<string, unknown>) || {}) };
  const agObrigado = { ...((obrigado.agendamento as Record<string, unknown>) || {}) };
  agObrigado.titulo = String(agObrigado.titulo || "Falta só confirmar");
  agObrigado.texto = `Seu horário está separado nesta tela. Chame no WhatsApp para ${entrada.nome} confirmar.`;
  obrigado.agendamento = agObrigado;
  const ctObrigado = { ...((obrigado.contato as Record<string, unknown>) || {}) };
  ctObrigado.titulo = String(ctObrigado.titulo || "Mensagem pronta");
  ctObrigado.texto = `Sua mensagem já está escrita. Abra o WhatsApp para enviar a ${entrada.nome}.`;
  obrigado.contato = ctObrigado;
  site.obrigado = obrigado;

  const privacidade = { ...((site.privacidade as Record<string, unknown>) || {}) };
  privacidade.titulo = String(privacidade.titulo || "Privacidade");
  privacidade.paragrafos = [
    `${entrada.nome} usa os dados que você informa no site para responder seu contato e confirmar horário.`,
    "Os dados pedidos são nome, telefone, e-mail se você quiser informar, serviço, profissional, dia, horário e a mensagem que você escrever.",
    "Esses dados não são vendidos. Servem para o negócio falar com você pelo WhatsApp ou pelo telefone informado.",
    `Para pedir a exclusão do que foi enviado, chame no WhatsApp de ${entrada.nome} e peça a remoção do contato.`,
  ];
  site.privacidade = privacidade;

  const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
  if (!galeria.titulo || String(galeria.titulo) === "A casa") galeria.titulo = "O espaço";
  site.galeria = galeria;

  const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
  if (String(sobre.titulo || "") === "A casa") sobre.titulo = "Sobre";
  site.sobre = sobre;

  const contato = { ...((site.contato as Record<string, unknown>) || {}) };
  // Remove “Venha à Atalaia” etc. do modelo — o estúdio/IA preenche com o lugar do cliente.
  if (/^venha\s+(ao|à|a|aos)\s+/i.test(String(contato.titulo || ""))) {
    contato.titulo = "Onde estamos";
    site.contato = contato;
  }

  // Promoções e eventos do exemplo não são do cliente. O schema permite lista vazia.
  const promocoes = { ...((site.promocoes as Record<string, unknown>) || {}) };
  promocoes.itens = [];
  if (!promocoes.titulo) promocoes.titulo = "Promoções";
  site.promocoes = promocoes;
  const eventos = { ...((site.eventos as Record<string, unknown>) || {}) };
  eventos.itens = [];
  if (!eventos.titulo) eventos.titulo = "Eventos";
  site.eventos = eventos;

  const header = { ...((site.header as Record<string, unknown>) || {}) };
  if (Array.isArray(header.menu)) {
    header.menu = (header.menu as Record<string, unknown>[]).map((item) => ({
      ...item,
      label: String(item.label || "") === "A casa" ? "Sobre" : item.label,
    }));
    site.header = header;
  }

  return site;
}

function soDigitos(v: string) {
  return v.replace(/\D/g, "");
}

function rotuloTel(digitos: string) {
  const d = soDigitos(digitos);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 13 && d.startsWith("55")) return rotuloTel(d.slice(2));
  return d || "(00) 00000-0000";
}

function fotoOk(foto: Record<string, unknown> | undefined, id: string, alt: string, categoria: string) {
  const f = { ...(foto || {}) };
  if (!f.id) f.id = id;
  if (typeof f.src !== "string") f.src = "";
  if (!f.alt) f.alt = alt || "Foto";
  if (!f.categoria) f.categoria = categoria;
  return f;
}

/** Garante campos que o schema 1.0.0 exige, sem inventar gente nem endereço. */
export function repararParaSchema(site: Record<string, unknown>, entrada: EntradaAutomacao) {
  const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
  const waRaw = soDigitos(entrada.whatsapp || String(empresa.whatsapp || ""));
  let wa = waRaw;
  if (wa.length === 10 || wa.length === 11) wa = `55${wa}`;
  // Schema exige E.164 BR; se o cliente ainda não informou, usa placeholder técnico — nunca o WhatsApp do modelo.
  if (!/^55[0-9]{10,11}$/.test(wa)) wa = "5579999990000";
  empresa.whatsapp = wa;
  empresa.whatsapp_label = rotuloTel(wa);
  empresa.whatsapp_mensagem = `Olá, vim pelo site de ${entrada.nome} e quero agendar.`;
  empresa.whatsapp_aria = `Chamar ${entrada.nome} no WhatsApp`;

  let tel = soDigitos(entrada.telefone || String(empresa.telefone || "") || wa.replace(/^55/, ""));
  if (!/^[0-9]{10,13}$/.test(tel) || tel.length < 10) tel = wa.replace(/^55/, "") || "79999990000";
  empresa.telefone = tel.slice(0, 13);
  empresa.telefone_label = rotuloTel(String(empresa.telefone));

  const email = String(entrada.email || "").trim();
  empresa.email = email.length >= 3 && !ehFicticio(email) ? email : "nao-informado@guix.invalid";

  const end = { ...((empresa.endereco as Record<string, unknown>) || {}) };
  const uf = String(entrada.estado || end.estado || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(uf)) end.estado = uf;
  else end.estado = "NA";
  const completo = String(end.completo || "").trim() || enderecoCompleto(entrada);
  end.completo = completo || "Endereço a confirmar";
  empresa.endereco = end;
  if (typeof empresa.slogan !== "string") empresa.slogan = "";
  empresa.cnpj = String(entrada.cnpj || "").trim();
  empresa.logo = fotoOk(empresa.logo as Record<string, unknown>, "img_logo", entrada.nome, "logo");
  site.empresa = empresa;

  const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
  const pars = Array.isArray(sobre.paragrafos) ? (sobre.paragrafos as string[]).filter((p) => p.trim()) : [];
  if (!pars.length) sobre.paragrafos = [`${entrada.nome} atende com horário combinado.`];
  if (!String(sobre.titulo || "").trim()) sobre.titulo = "Sobre";
  sobre.imagem = fotoOk(sobre.imagem as Record<string, unknown>, "img_sobre", "Sobre", "sobre");
  site.sobre = sobre;

  const servicos = { ...((site.servicos as Record<string, unknown>) || {}) };
  let sItens = Array.isArray(servicos.itens) ? [...(servicos.itens as Record<string, unknown>[])] : [];
  if (!sItens.length) {
    sItens = [
      {
        id: "srv_principal",
        nome: "Atendimento",
        descricao: "Combine o serviço no WhatsApp.",
        preco: 0,
        preco_label: "Sob consulta",
        duracao_minutos: 30,
        duracao_label: "30 min",
        imagem: fotoOk(undefined, "img_srv_principal", "Serviço", "servico"),
      },
    ];
  }
  servicos.itens = sItens.map((s, i) => {
    const img = fotoOk(s.imagem as Record<string, unknown>, `img_srv_${i + 1}`, String(s.nome || "Serviço"), "servico");
    const mins = Number(s.duracao_minutos) || 30;
    return {
      ...s,
      id: String(s.id || `srv_item${i + 1}`).replace(/[^a-z0-9_]/g, "") || `srv_item${i + 1}`,
      nome: String(s.nome || "Serviço"),
      descricao: String(s.descricao || ""),
      preco: typeof s.preco === "number" ? s.preco : 0,
      preco_label: String(s.preco_label || "Sob consulta"),
      duracao_minutos: mins < 1 ? 30 : mins,
      duracao_label: String(s.duracao_label || `${mins} min`),
      imagem: img,
    };
  });
  site.servicos = servicos;

  const equipe = { ...((site.profissionais as Record<string, unknown>) || {}) };
  let pItens = Array.isArray(equipe.itens) ? [...(equipe.itens as Record<string, unknown>[])] : [];
  const informados = (entrada.profissionaisDetalhe || []).filter((p) => p.nome.trim());
  if (informados.length) {
    pItens = informados.map((p, i) => {
      const base = (pItens[i] || {}) as Record<string, unknown>;
      return {
        ...base,
        id: String(base.id || `pro_p${i + 1}`),
        nome: p.nome,
        cargo: p.cargo || "",
        descricao: p.descricao || "",
        whatsapp: typeof base.whatsapp === "string" ? base.whatsapp : "",
        foto: fotoOk(base.foto as Record<string, unknown>, `img_pro_p${i + 1}`, p.nome, "profissional"),
      };
    });
  } else {
    pItens = [
      {
        id: "pro_sempref",
        nome: "Sem preferência",
        cargo: "",
        descricao: "O horário não destina um profissional.",
        whatsapp: "",
        foto: fotoOk(undefined, "img_pro_sempref", "Sem preferência", "profissional"),
      },
    ];
  }
  equipe.itens = pItens;
  if (!equipe.titulo) equipe.titulo = "Equipe";
  if (typeof equipe.subtitulo !== "string") equipe.subtitulo = "";
  site.profissionais = equipe;

  return site;
}

const GRAFIA: Array<[RegExp, string]> = [
  [/\bclassico\b/gi, "clássico"],
  [/\bclassicos\b/gi, "clássicos"],
  [/\bmaquina\b/gi, "máquina"],
  [/\bmaquinas\b/gi, "máquinas"],
  [/\bnao\b/gi, "não"],
  [/\bvoce\b/gi, "você"],
];

function acentuar(s: string) {
  let out = s;
  for (const [re, to] of GRAFIA) out = out.replace(re, to);
  return out;
}

function aliviarHoraMarcada(s: string) {
  const hits = s.match(/hora marcada/gi) || [];
  if (hits.length <= 1) return s;
  let visto = 0;
  return s.replace(/hora marcada/gi, () => {
    visto += 1;
    return visto === 1 ? "hora marcada" : "horário combinado";
  });
}

function polir(s: string) {
  return aliviarHoraMarcada(acentuar(s)).replace(/\s{2,}/g, " ").trim();
}

function polirCampo(obj: Record<string, unknown>, chave: string) {
  if (typeof obj[chave] === "string") obj[chave] = polir(obj[chave] as string);
}

/** Textos do site: grafia e menos “hora marcada” repetido. */
export function polirTextosSite(site: Record<string, unknown>) {
  const hero = { ...((site.hero as Record<string, unknown>) || {}) };
  polirCampo(hero, "titulo");
  polirCampo(hero, "subtitulo");
  site.hero = hero;

  const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
  polirCampo(sobre, "titulo");
  if (Array.isArray(sobre.paragrafos)) sobre.paragrafos = (sobre.paragrafos as string[]).map(polir);
  site.sobre = sobre;

  const servicos = { ...((site.servicos as Record<string, unknown>) || {}) };
  polirCampo(servicos, "titulo");
  if (/cardápio/i.test(String(servicos.titulo || ""))) servicos.titulo = "Serviços";
  polirCampo(servicos, "subtitulo");
  if (Array.isArray(servicos.itens)) {
    servicos.itens = (servicos.itens as Record<string, unknown>[]).map((i) => {
      const n = { ...i };
      polirCampo(n, "nome");
      polirCampo(n, "descricao");
      return n;
    });
  }
  site.servicos = servicos;

  const faq = { ...((site.faq as Record<string, unknown>) || {}) };
  if (Array.isArray(faq.itens)) {
    faq.itens = (faq.itens as Record<string, unknown>[]).map((i) => {
      const n = { ...i };
      polirCampo(n, "pergunta");
      polirCampo(n, "resposta");
      return n;
    });
  }
  site.faq = faq;

  const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
  polirCampo(empresa, "slogan");
  const end = { ...((empresa.endereco as Record<string, unknown>) || {}) };
  if (ehFicticio(String(end.completo || "")) || ehFicticio(String(end.logradouro || ""))) {
    end.completo = [end.logradouro, end.numero].filter((x) => x && !ehFicticio(String(x))).join(", ");
    if (ehFicticio(String(end.logradouro || ""))) end.logradouro = "";
  }
  empresa.endereco = end;
  site.empresa = empresa;

  const galeria = { ...((site.galeria as Record<string, unknown>) || {}) };
  if (String(galeria.titulo || "") === "A casa") galeria.titulo = "O espaço";
  site.galeria = galeria;

  return site;
}

export function enderecoCompleto(entrada: EntradaAutomacao) {
  const partes = [
    [limparString(entrada.logradouro), limparString(entrada.numero)].filter(Boolean).join(", "),
    limparString(entrada.bairro),
    [limparString(entrada.cidade), limparString(entrada.estado)].filter(Boolean).join(" - "),
  ].filter(Boolean);
  return partes.join(" — ");
}
