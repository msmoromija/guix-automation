import type { EntradaAutomacao } from "./tipos";

const FICTICIO =
  /spring field|rua onde fica|animador de porta|lorem|placeholder|exemplo\.com|0000-0000|00\.000\.000\/0000-00|barbeariavilanorte|vila norte|vila flor|salaovilaflor|serra clara|pet shop bento|academia farol|lima contabilidade|vale luz/i;

const EXPEDIENTE_NEUTRO = [
  { dia: "dom", label: "Domingo", intervalos: [] as string[] },
  { dia: "seg", label: "Segunda", intervalos: [] as string[] },
  { dia: "ter", label: "Terça", intervalos: [] as string[] },
  { dia: "qua", label: "Quarta", intervalos: [] as string[] },
  { dia: "qui", label: "Quinta", intervalos: [] as string[] },
  { dia: "sex", label: "Sexta", intervalos: [] as string[] },
  { dia: "sab", label: "Sábado", intervalos: [] as string[] },
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

  // Pessoas e retratos do template são exemplos; nunca os atribua a uma equipe real.
  const equipe = { ...((site.profissionais as Record<string, unknown>) || {}) };
  equipe.titulo = "Quem atende";
  equipe.subtitulo = "Os nomes e as fotos da equipe serão exibidos quando forem informados.";
  equipe.itens = [];
  site.profissionais = equipe;

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

const ORIGENS_OK = new Set(["biblioteca", "unsplash", "upload"]);
const CATS_OK = new Set([
  "logo",
  "hero",
  "sobre",
  "servico",
  "profissional",
  "promocao",
  "evento",
  "galeria",
  "og",
]);
const MENU_IDS = ["inicio", "sobre", "servicos", "profissionais", "promocoes", "faq", "contato"] as const;
const MENU_LABEL: Record<(typeof MENU_IDS)[number], string> = {
  inicio: "Início",
  sobre: "Sobre",
  servicos: "Serviços",
  profissionais: "Equipe",
  promocoes: "Condições",
  faq: "Dúvidas",
  contato: "Contato",
};
const ICONES_OK = new Set([
  "calendar",
  "clock",
  "map-pin",
  "phone",
  "message-circle",
  "scissors",
  "sparkles",
  "star",
  "shield",
  "users",
  "award",
  "heart",
  "leaf",
  "paw-print",
  "scale",
  "dumbbell",
  "home",
  "check",
  "clipboard",
]);

function idComPrefixo(raw: unknown, prefixo: string, fallback: string) {
  const limpo = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (limpo.startsWith(prefixo) && limpo.length > prefixo.length) return limpo;
  const resto = limpo.replace(new RegExp(`^${prefixo}`), "") || fallback.replace(new RegExp(`^${prefixo}`), "");
  return `${prefixo}${resto || "item"}`;
}

function fotoOk(foto: Record<string, unknown> | undefined, id: string, alt: string, categoria: string) {
  const f = { ...(foto || {}) };
  f.id = idComPrefixo(f.id || id, "img_", id);
  if (typeof f.src !== "string") f.src = "";
  if (!String(f.alt || "").trim()) f.alt = alt || "Foto";
  f.categoria = CATS_OK.has(String(f.categoria || "")) ? f.categoria : categoria;
  if (f.origem != null && !ORIGENS_OK.has(String(f.origem))) delete f.origem;
  if (f.origem === "unsplash") {
    const c = f.credito && typeof f.credito === "object" ? (f.credito as Record<string, unknown>) : null;
    const fotografo = String(c?.fotografo || "").trim();
    const perfil = String(c?.perfil_url || "").trim();
    const texto = String(c?.texto || "").trim();
    if (!fotografo || !perfil || !texto) delete f.credito;
  } else if (f.credito) {
    delete f.credito;
  }
  return f;
}

function repararMenu(site: Record<string, unknown>) {
  const header = { ...((site.header as Record<string, unknown>) || {}) };
  if (!String(header.botao_agendar || "").trim()) header.botao_agendar = "Agendar";
  const atuais = Array.isArray(header.menu) ? (header.menu as Record<string, unknown>[]) : [];
  const vistos = new Set<string>();
  const menu: { id: (typeof MENU_IDS)[number]; label: string; href: string }[] = [];
  for (const item of atuais) {
    const id = String(item.id || "");
    if (!(MENU_IDS as readonly string[]).includes(id) || vistos.has(id)) continue;
    vistos.add(id);
    const hrefBruto = String(item.href || `#${id}`).toLowerCase();
    const href = /^#[a-z]+$/.test(hrefBruto) ? hrefBruto : `#${id}`;
    menu.push({
      id: id as (typeof MENU_IDS)[number],
      label: String(item.label || MENU_LABEL[id as (typeof MENU_IDS)[number]] || id).slice(0, 48) || MENU_LABEL[id as (typeof MENU_IDS)[number]],
      href,
    });
  }
  for (const id of MENU_IDS) {
    if (menu.length >= 5) break;
    if (vistos.has(id)) continue;
    menu.push({ id, label: MENU_LABEL[id], href: `#${id}` });
    vistos.add(id);
  }
  header.menu = menu.slice(0, 7);
  site.header = header;
}

function repararImagensNoSite(site: Record<string, unknown>) {
  const hero = { ...((site.hero as Record<string, unknown>) || {}) };
  if (!String(hero.titulo || "").trim()) hero.titulo = "Bem-vindo";
  if (!String(hero.subtitulo || "").trim()) hero.subtitulo = "Atendimento com horário combinado.";
  if (!String(hero.botao_principal || "").trim()) hero.botao_principal = "Agendar";
  if (!String(hero.botao_secundario || "").trim()) hero.botao_secundario = "WhatsApp";
  hero.imagem = fotoOk(hero.imagem as Record<string, unknown>, "img_hero", "Capa", "hero");
  site.hero = hero;

  const seo = { ...((site.seo as Record<string, unknown>) || {}) };
  if (seo.og_image) seo.og_image = fotoOk(seo.og_image as Record<string, unknown>, "img_og", "Preview", "og");
  site.seo = seo;

  for (const blocoNome of ["promocoes", "eventos", "galeria"] as const) {
    const bloco = { ...((site[blocoNome] as Record<string, unknown>) || {}) };
    if (!Array.isArray(bloco.itens)) continue;
    const prefixo = blocoNome === "promocoes" ? "prm_" : blocoNome === "eventos" ? "evt_" : "gal_";
    const cat = blocoNome === "promocoes" ? "promocao" : blocoNome === "eventos" ? "evento" : "galeria";
    bloco.itens = (bloco.itens as Record<string, unknown>[]).map((item, i) => {
      const next: Record<string, unknown> = {
        ...item,
        id: idComPrefixo(item.id, prefixo, `${prefixo}${i + 1}`),
      };
      if (next.imagem) {
        next.imagem = fotoOk(
          next.imagem as Record<string, unknown>,
          `img_${prefixo}${i + 1}`,
          String(next.titulo || next.legenda || cat),
          cat,
        );
      }
      return next;
    });
    site[blocoNome] = bloco;
  }
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
  if (typeof end.logradouro !== "string") end.logradouro = "";
  if (typeof end.numero !== "string") end.numero = "";
  if (typeof end.complemento !== "string") end.complemento = "";
  if (typeof end.bairro !== "string") end.bairro = "";
  if (typeof end.cidade !== "string") end.cidade = String(entrada.cidade || "");
  if (typeof end.cep !== "string") end.cep = "";
  if (typeof end.mapa_embed_url !== "string") end.mapa_embed_url = "";
  const uf = String(entrada.estado || end.estado || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(uf)) end.estado = uf;
  else end.estado = "NA";
  const completo = String(end.completo || "").trim() || enderecoCompleto(entrada);
  end.completo = completo || "Endereço a confirmar";
  empresa.endereco = end;
  if (typeof empresa.slogan !== "string") empresa.slogan = "";
  if (!String(empresa.nome || "").trim()) empresa.nome = entrada.nome;
  if (!String(empresa.horario_resumo || "").trim()) empresa.horario_resumo = "Horário a combinar";
  empresa.cnpj = String(entrada.cnpj || empresa.cnpj || "").trim();
  if (!Array.isArray(empresa.redes)) empresa.redes = [];
  empresa.redes = (empresa.redes as Record<string, unknown>[])
    .filter((r) => ["instagram", "facebook", "tiktok", "youtube"].includes(String(r.id || "")))
    .slice(0, 4)
    .map((r) => ({
      id: String(r.id),
      label: String(r.label || r.id),
      url: String(r.url || ""),
    }));
  if (!Array.isArray(empresa.expediente) || !(empresa.expediente as unknown[]).length) {
    empresa.expediente = EXPEDIENTE_NEUTRO;
  } else {
    empresa.expediente = (empresa.expediente as Record<string, unknown>[])
      .filter((d) => ["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(String(d.dia || "")))
      .slice(0, 7)
      .map((d) => ({
        dia: String(d.dia),
        label: String(d.label || d.dia),
        intervalos: (Array.isArray(d.intervalos) ? (d.intervalos as string[]) : [])
          .filter((h) => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(h))
          .slice(0, 48),
      }))
      .filter((d) => d.intervalos.length);
    if (!(empresa.expediente as unknown[]).length) empresa.expediente = EXPEDIENTE_NEUTRO;
  }
  empresa.logo = fotoOk(empresa.logo as Record<string, unknown>, "img_logo", entrada.nome, "logo");
  site.empresa = empresa;

  const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
  const pars = Array.isArray(sobre.paragrafos) ? (sobre.paragrafos as string[]).filter((p) => p.trim()) : [];
  if (!pars.length) sobre.paragrafos = [`${entrada.nome} atende com horário combinado.`];
  else sobre.paragrafos = pars.slice(0, 3);
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
      id: idComPrefixo(s.id, "srv_", `srv_item${i + 1}`),
      nome: String(s.nome || "Serviço"),
      descricao: String(s.descricao || ""),
      preco: typeof s.preco === "number" && s.preco >= 0 ? s.preco : 0,
      preco_label: String(s.preco_label || "Sob consulta"),
      duracao_minutos: mins < 1 ? 30 : Math.floor(mins),
      duracao_label: String(s.duracao_label || `${mins} min`),
      imagem: img,
    };
  });
  if (typeof servicos.titulo !== "string") servicos.titulo = "Serviços";
  if (typeof servicos.subtitulo !== "string") servicos.subtitulo = "";
  site.servicos = servicos;

  const equipe = { ...((site.profissionais as Record<string, unknown>) || {}) };
  let pItens = Array.isArray(equipe.itens) ? [...(equipe.itens as Record<string, unknown>[])] : [];
  const informados = (entrada.profissionaisDetalhe || []).filter((p) => p.nome.trim());
  if (informados.length) {
    pItens = informados.map((p, i) => {
      const base = (pItens[i] || {}) as Record<string, unknown>;
      let waPro = soDigitos(String(base.whatsapp || ""));
      if (waPro.length === 10 || waPro.length === 11) waPro = `55${waPro}`;
      if (!/^55[0-9]{10,11}$/.test(waPro)) waPro = "";
      return {
        ...base,
        id: idComPrefixo(base.id, "pro_", `pro_p${i + 1}`),
        nome: p.nome,
        cargo: p.cargo || "",
        descricao: p.descricao || "",
        whatsapp: waPro,
        foto: fotoOk(base.foto as Record<string, unknown>, `img_pro_p${i + 1}`, p.nome, "profissional"),
      };
    });
  } else if (!pItens.length) {
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
  } else {
    pItens = pItens.map((base, i) => {
      let waPro = soDigitos(String(base.whatsapp || ""));
      if (waPro.length === 10 || waPro.length === 11) waPro = `55${waPro}`;
      if (!/^55[0-9]{10,11}$/.test(waPro)) waPro = "";
      return {
        ...base,
        id: idComPrefixo(base.id, "pro_", `pro_p${i + 1}`),
        nome: String(base.nome || `Profissional ${i + 1}`),
        cargo: String(base.cargo || ""),
        descricao: String(base.descricao || ""),
        whatsapp: waPro,
        foto: fotoOk(base.foto as Record<string, unknown>, `img_pro_p${i + 1}`, String(base.nome || "Profissional"), "profissional"),
      };
    });
  }
  const chavesEquipe = new Set<string>();
  equipe.itens = pItens.filter((item) => {
    const nome = String(item.nome || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const cargo = String(item.cargo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (!nome || nome === "sem preferencia") return true;
    const chave = `${nome}|${cargo}`;
    if (chavesEquipe.has(chave)) return false;
    chavesEquipe.add(chave);
    return true;
  });
  if (!equipe.titulo) equipe.titulo = "Equipe";
  if (typeof equipe.subtitulo !== "string") equipe.subtitulo = "";
  site.profissionais = equipe;

  const difs = { ...((site.diferenciais as Record<string, unknown>) || {}) };
  let difItens = Array.isArray(difs.itens) ? [...(difs.itens as Record<string, unknown>[])] : [];
  difItens = difItens.map((item, i) => ({
    ...item,
    id: idComPrefixo(item.id, "dif_", `dif_${i + 1}`),
    titulo: String(item.titulo || `Diferencial ${i + 1}`).slice(0, 60) || `Diferencial ${i + 1}`,
    descricao: String(item.descricao || ""),
    icone: ICONES_OK.has(String(item.icone || "")) ? item.icone : "check",
  }));
  while (difItens.length < 3) {
    const n = difItens.length + 1;
    difItens.push({ ...DIFERENCIAIS_NEUTROS[n - 1] });
  }
  difs.itens = difItens.slice(0, 6);
  if (typeof difs.titulo !== "string") difs.titulo = "Por que escolher";
  site.diferenciais = difs;

  const faq = { ...((site.faq as Record<string, unknown>) || {}) };
  if (Array.isArray(faq.itens)) {
    faq.itens = (faq.itens as Record<string, unknown>[])
      .filter((item) => String(item.pergunta || "").trim() && String(item.resposta || "").trim())
      .slice(0, 10)
      .map((item, i) => ({
        id: idComPrefixo(item.id, "faq_", `faq_${String(i + 1).padStart(2, "0")}`),
        pergunta: String(item.pergunta).trim().slice(0, 180),
        resposta: String(item.resposta).trim().slice(0, 400),
      }));
  } else {
    faq.itens = [];
  }
  if (typeof faq.titulo !== "string") faq.titulo = "Dúvidas";
  site.faq = faq;

  repararMenu(site);
  repararImagensNoSite(site);

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
