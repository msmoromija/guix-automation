import type { GeracaoSiteJson } from "@/lib/media/tipos";

export type CopiaViva = {
  hero?: { titulo?: string; subtitulo?: string };
  sobre?: { titulo?: string; paragrafos?: string[] };
  servicos?: { titulo?: string; subtitulo?: string; itens?: { descricao?: string }[] };
  contato?: { titulo?: string; subtitulo?: string };
  faq?: { titulo?: string; itens?: { pergunta?: string; resposta?: string }[] };
  profissionais?: { titulo?: string; subtitulo?: string };
};

function corta(v: unknown, max: number) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function normalizarCopia(raw: unknown): CopiaViva {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const hero = (o.hero || {}) as Record<string, unknown>;
  const sobre = (o.sobre || {}) as Record<string, unknown>;
  const servicos = (o.servicos || {}) as Record<string, unknown>;
  const contato = (o.contato || {}) as Record<string, unknown>;
  const faq = (o.faq || {}) as Record<string, unknown>;
  const pro = (o.profissionais || {}) as Record<string, unknown>;
  const paragrafos = Array.isArray(sobre.paragrafos) ? sobre.paragrafos.map((p) => corta(p, 420)).filter(Boolean).slice(0, 3) : [];
  const itensSrv = Array.isArray(servicos.itens)
    ? servicos.itens.slice(0, 12).map((item) => ({ descricao: corta((item as { descricao?: string })?.descricao, 320) }))
    : [];
  const itensFaq = Array.isArray(faq.itens)
    ? faq.itens
        .slice(0, 10)
        .map((item) => {
          const f = item as { pergunta?: string; resposta?: string };
          return { pergunta: corta(f.pergunta, 140), resposta: corta(f.resposta, 320) };
        })
        .filter((f) => f.pergunta && f.resposta)
    : [];
  return soltarRepeticao({
    hero: { titulo: corta(hero.titulo, 90), subtitulo: corta(hero.subtitulo, 220) },
    sobre: { titulo: corta(sobre.titulo, 80), paragrafos },
    servicos: { titulo: corta(servicos.titulo, 60), subtitulo: corta(servicos.subtitulo, 180), itens: itensSrv },
    contato: { titulo: corta(contato.titulo, 80), subtitulo: corta(contato.subtitulo, 220) },
    faq: { titulo: corta(faq.titulo, 60), itens: itensFaq },
    profissionais: { titulo: corta(pro.titulo, 60), subtitulo: corta(pro.subtitulo, 180) },
  });
}

function chaveTexto(v?: string) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Tira frase repetida entre capa, sobre e serviços. A primeira ocorrência fica. */
export function soltarRepeticao(copia: CopiaViva): CopiaViva {
  const vistos = new Set<string>();
  const guardar = (v?: string) => {
    const k = chaveTexto(v);
    if (!k) return "";
    if (vistos.has(k)) return "";
    vistos.add(k);
    return String(v || "").trim();
  };
  const titulo = guardar(copia.hero?.titulo);
  const subtitulo = guardar(copia.hero?.subtitulo);
  const sobreTitulo = guardar(copia.sobre?.titulo);
  const paragrafos = (copia.sobre?.paragrafos || []).map((p) => guardar(p)).filter(Boolean);
  const srvTitulo = guardar(copia.servicos?.titulo) || copia.servicos?.titulo || "";
  const srvSub = guardar(copia.servicos?.subtitulo);
  const itens = (copia.servicos?.itens || []).map((item) => ({ descricao: guardar(item.descricao) }));
  return {
    ...copia,
    hero: { titulo, subtitulo },
    sobre: { titulo: sobreTitulo || copia.sobre?.titulo, paragrafos: paragrafos.length ? paragrafos : copia.sobre?.paragrafos },
    servicos: { ...copia.servicos, titulo: srvTitulo, subtitulo: srvSub, itens },
  };
}

export function mesclarCopia(base: CopiaViva | null, nova: CopiaViva, travados: Set<string>): CopiaViva {
  const out: CopiaViva = {
    hero: { ...(base?.hero || {}) },
    sobre: { ...(base?.sobre || {}), paragrafos: [...(base?.sobre?.paragrafos || [])] },
    servicos: { ...(base?.servicos || {}), itens: [...(base?.servicos?.itens || [])] },
    contato: { ...(base?.contato || {}) },
    faq: { ...(base?.faq || {}), itens: [...(base?.faq?.itens || [])] },
    profissionais: { ...(base?.profissionais || {}) },
  };
  if (!travados.has("hero.titulo") && nova.hero?.titulo) out.hero!.titulo = nova.hero.titulo;
  if (!travados.has("hero.subtitulo") && nova.hero?.subtitulo) out.hero!.subtitulo = nova.hero.subtitulo;
  if (!travados.has("sobre.titulo") && nova.sobre?.titulo) out.sobre!.titulo = nova.sobre.titulo;
  (nova.sobre?.paragrafos || []).forEach((p, i) => {
    if (!p || travados.has(`sobre.p.${i}`)) return;
    const pars = [...(out.sobre!.paragrafos || [])];
    pars[i] = p;
    out.sobre!.paragrafos = pars;
  });
  if (!travados.has("servicos.titulo") && nova.servicos?.titulo) out.servicos!.titulo = nova.servicos.titulo;
  if (!travados.has("servicos.subtitulo") && nova.servicos?.subtitulo) out.servicos!.subtitulo = nova.servicos.subtitulo;
  (nova.servicos?.itens || []).forEach((item, i) => {
    if (!item.descricao || travados.has(`srv.${i}.descricao`)) return;
    const itens = [...(out.servicos!.itens || [])];
    itens[i] = { ...itens[i], descricao: item.descricao };
    out.servicos!.itens = itens;
  });
  if (!travados.has("contato.titulo") && nova.contato?.titulo) out.contato!.titulo = nova.contato.titulo;
  if (!travados.has("contato.subtitulo") && nova.contato?.subtitulo) out.contato!.subtitulo = nova.contato.subtitulo;
  if (!travados.has("faq.titulo") && nova.faq?.titulo) out.faq!.titulo = nova.faq.titulo;
  (nova.faq?.itens || []).forEach((item, i) => {
    if (travados.has(`faq.${i}.pergunta`) || travados.has(`faq.${i}.resposta`)) return;
    if (!item.pergunta || !item.resposta) return;
    const itens = [...(out.faq!.itens || [])];
    itens[i] = item;
    out.faq!.itens = itens;
  });
  if (!travados.has("equipe.titulo") && nova.profissionais?.titulo) out.profissionais!.titulo = nova.profissionais.titulo;
  if (!travados.has("equipe.subtitulo") && nova.profissionais?.subtitulo) out.profissionais!.subtitulo = nova.profissionais.subtitulo;
  return out;
}

export function definirCampoCopia(copia: CopiaViva | null, campo: string, valor: string): CopiaViva {
  const c: CopiaViva = {
    hero: { ...(copia?.hero || {}) },
    sobre: { ...(copia?.sobre || {}), paragrafos: [...(copia?.sobre?.paragrafos || [])] },
    servicos: { ...(copia?.servicos || {}) },
    contato: { ...(copia?.contato || {}) },
    faq: { ...(copia?.faq || {}), itens: (copia?.faq?.itens || []).map((item) => ({ ...item })) },
    profissionais: { ...(copia?.profissionais || {}) },
  };
  if (campo === "hero.titulo") c.hero!.titulo = valor;
  else if (campo === "hero.subtitulo") c.hero!.subtitulo = valor;
  else if (campo === "sobre.titulo") c.sobre!.titulo = valor;
  else if (campo.startsWith("sobre.p.")) {
    const i = Number(campo.split(".")[2]) || 0;
    const pars = [...(c.sobre!.paragrafos || [])];
    pars[i] = valor;
    c.sobre!.paragrafos = pars;
  } else if (campo === "servicos.titulo") c.servicos!.titulo = valor;
  else if (campo === "servicos.subtitulo") c.servicos!.subtitulo = valor;
  else if (campo === "contato.titulo") c.contato!.titulo = valor;
  else if (campo === "contato.subtitulo") c.contato!.subtitulo = valor;
  else if (campo === "faq.titulo") c.faq!.titulo = valor;
  else if (campo.startsWith("faq.")) {
    const [, indice, chave] = campo.split(".");
    const i = Number(indice) || 0;
    const itens = [...(c.faq!.itens || [])];
    const atual = { ...(itens[i] || {}) };
    if (chave === "pergunta" || chave === "resposta") atual[chave] = valor;
    itens[i] = atual;
    c.faq!.itens = itens;
  } else if (campo === "equipe.titulo") c.profissionais!.titulo = valor;
  else if (campo === "equipe.subtitulo") c.profissionais!.subtitulo = valor;
  return c;
}

export function aplicarCopiaNoSite(site: Record<string, unknown>, copia?: CopiaViva | null) {
  if (!copia) return site;
  if (copia.hero?.titulo || copia.hero?.subtitulo) {
    const hero = { ...((site.hero as Record<string, unknown>) || {}) };
    if (copia.hero.titulo) hero.titulo = copia.hero.titulo;
    if (copia.hero.subtitulo) hero.subtitulo = copia.hero.subtitulo;
    site.hero = hero;
  }
  if (copia.sobre?.titulo || copia.sobre?.paragrafos?.length) {
    const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
    if (copia.sobre.titulo) sobre.titulo = copia.sobre.titulo;
    if (copia.sobre.paragrafos?.length) sobre.paragrafos = copia.sobre.paragrafos;
    site.sobre = sobre;
  }
  if (copia.servicos) {
    const bloco = { ...((site.servicos as Record<string, unknown>) || {}) };
    if (copia.servicos.titulo) bloco.titulo = copia.servicos.titulo;
    if (copia.servicos.subtitulo) bloco.subtitulo = copia.servicos.subtitulo;
    if (copia.servicos.itens?.length && Array.isArray(bloco.itens)) {
      bloco.itens = (bloco.itens as Record<string, unknown>[]).map((item, i) => {
        const desc = copia.servicos?.itens?.[i]?.descricao;
        return desc ? { ...item, descricao: desc } : item;
      });
    }
    site.servicos = bloco;
  }
  if (copia.contato?.titulo || copia.contato?.subtitulo) {
    const contato = { ...((site.contato as Record<string, unknown>) || {}) };
    if (copia.contato.titulo) contato.titulo = copia.contato.titulo;
    if (copia.contato.subtitulo) contato.subtitulo = copia.contato.subtitulo;
    site.contato = contato;
  }
  if (copia.faq?.itens?.length || copia.faq?.titulo) {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    if (copia.faq.titulo) faq.titulo = copia.faq.titulo;
    if (copia.faq.itens?.length) {
      const atuais = Array.isArray(faq.itens) ? (faq.itens as Record<string, unknown>[]) : [];
      faq.itens = copia.faq.itens.map((item, i) => ({
        id: String(atuais[i]?.id || `faq_${String(i + 1).padStart(2, "0")}`),
        pergunta: item.pergunta || "",
        resposta: item.resposta || "",
      }));
    }
    site.faq = faq;
  }
  if (copia.profissionais?.titulo || copia.profissionais?.subtitulo) {
    const bloco = { ...((site.profissionais as Record<string, unknown>) || {}) };
    if (copia.profissionais.titulo) bloco.titulo = copia.profissionais.titulo;
    if (copia.profissionais.subtitulo) bloco.subtitulo = copia.profissionais.subtitulo;
    site.profissionais = bloco;
  }
  return site;
}

/** Edição direta de um campo de texto. Nomes de serviço e de equipe ficam no formulário. */
export function aplicarCampoNoSite(site: Record<string, unknown>, campo: string, valorBruto: string) {
  const valor = corta(valorBruto, 420);
  if (!valor) return site;
  const [a, b, c] = campo.split(".");
  if (a === "nome") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    empresa.nome = valor.slice(0, 80);
    site.empresa = empresa;
  } else if (a === "horario") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    empresa.horario_resumo = valor.slice(0, 160);
    site.empresa = empresa;
  } else if (a === "hero" && (b === "titulo" || b === "subtitulo")) {
    const hero = { ...((site.hero as Record<string, unknown>) || {}) };
    hero[b] = valor;
    site.hero = hero;
  } else if (a === "hero" && b === "botao") {
    const hero = { ...((site.hero as Record<string, unknown>) || {}) };
    hero.botao_principal = valor.slice(0, 48);
    site.hero = hero;
  } else if (a === "hero" && b === "botao2") {
    const hero = { ...((site.hero as Record<string, unknown>) || {}) };
    hero.botao_secundario = valor.slice(0, 48);
    site.hero = hero;
  } else if (a === "header" && b === "botao") {
    const header = { ...((site.header as Record<string, unknown>) || {}) };
    header.botao_agendar = valor.slice(0, 40);
    site.header = header;
  } else if (a === "menu" && c === "label") {
    const header = { ...((site.header as Record<string, unknown>) || {}) };
    const menu = Array.isArray(header.menu) ? [...(header.menu as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (menu[i]) {
      menu[i] = { ...menu[i], label: valor.slice(0, 48) };
      header.menu = menu;
      site.header = header;
    }
  } else if (a === "sobre" && b === "titulo") {
    const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
    sobre.titulo = valor;
    site.sobre = sobre;
  } else if (a === "sobre" && b === "p") {
    const sobre = { ...((site.sobre as Record<string, unknown>) || {}) };
    const pars = Array.isArray(sobre.paragrafos) ? [...(sobre.paragrafos as string[])] : [];
    pars[Number(c) || 0] = valor;
    sobre.paragrafos = pars;
    site.sobre = sobre;
  } else if (a === "servicos" && (b === "titulo" || b === "subtitulo")) {
    const bloco = { ...((site.servicos as Record<string, unknown>) || {}) };
    bloco[b] = valor;
    site.servicos = bloco;
  } else if (a === "srv") {
    const bloco = { ...((site.servicos as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i] && (c === "descricao" || c === "nome" || c === "preco" || c === "duracao")) {
      const item = { ...itens[i] };
      if (c === "descricao") item.descricao = valor;
      if (c === "nome") item.nome = valor;
      if (c === "preco") item.preco_label = valor;
      if (c === "duracao") item.duracao_label = valor;
      itens[i] = item;
      bloco.itens = itens;
      site.servicos = bloco;
    }
  } else if (a === "contato" && (b === "titulo" || b === "subtitulo")) {
    const contato = { ...((site.contato as Record<string, unknown>) || {}) };
    contato[b] = valor;
    site.contato = contato;
  } else if (a === "faq" && b === "titulo") {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    faq.titulo = valor.slice(0, 80);
    site.faq = faq;
  } else if (a === "faq" && b === "limpar") {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    faq.itens = [];
    if (!faq.titulo) faq.titulo = "Dúvidas";
    site.faq = faq;
  } else if (a === "faq" && b === "nova") {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    const itens = Array.isArray(faq.itens) ? [...(faq.itens as Record<string, unknown>[])] : [];
    if (itens.length < 10) {
      const ids = new Set(itens.map((item) => String(item.id || "")));
      let n = itens.length + 1;
      while (ids.has(`faq_extra_${n}`)) n += 1;
      itens.push({
        id: `faq_extra_${n}`,
        pergunta: valor.slice(0, 180) || "Nova pergunta",
        resposta: "Escreva a resposta.",
      });
      if (!faq.titulo) faq.titulo = "Dúvidas";
      faq.itens = itens;
      site.faq = faq;
    }
  } else if (a === "faq") {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    const itens = Array.isArray(faq.itens) ? [...(faq.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (c === "remover" && itens[i]) {
      itens.splice(i, 1);
      faq.itens = itens;
      site.faq = faq;
    } else if (itens[i] && (c === "pergunta" || c === "resposta")) {
      itens[i] = { ...itens[i], [c]: valor };
      faq.itens = itens;
      site.faq = faq;
    }
  } else if (a === "equipe" && (b === "titulo" || b === "subtitulo")) {
    const bloco = { ...((site.profissionais as Record<string, unknown>) || {}) };
    bloco[b] = valor;
    site.profissionais = bloco;
  } else if (a === "pro") {
    const bloco = { ...((site.profissionais as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i] && (c === "nome" || c === "cargo" || c === "descricao")) {
      itens[i] = { ...itens[i], [c]: valor };
      bloco.itens = itens;
      site.profissionais = bloco;
    }
  } else if (a === "telefone") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    const rotulo = valor.slice(0, 24);
    empresa.telefone_label = rotulo;
    empresa.whatsapp_label = rotulo;
    const digitos = valor.replace(/\D/g, "");
    const wa = digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13) ? digitos : digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : "";
    if (wa) {
      empresa.whatsapp = wa;
      empresa.telefone = wa.replace(/^55/, "");
    }
    site.empresa = empresa;
  } else if (a === "endereco") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    const end = { ...((empresa.endereco as Record<string, unknown>) || {}) };
    end.completo = valor.slice(0, 180);
    empresa.endereco = end;
    site.empresa = empresa;
  } else if (a === "dif") {
    const bloco = { ...((site.diferenciais as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i] && (c === "titulo" || c === "descricao")) {
      itens[i] = { ...itens[i], [c]: valor };
      bloco.itens = itens;
      site.diferenciais = bloco;
    }
  } else if (a === "evt") {
    const bloco = { ...((site.eventos as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i] && (c === "titulo" || c === "descricao" || c === "data" || c === "horario")) {
      const item = { ...itens[i] };
      if (c === "titulo") item.titulo = valor;
      if (c === "descricao") item.descricao = valor;
      if (c === "data") item.data_label = valor;
      if (c === "horario") item.horario = /^\d{2}:\d{2}$/.test(valor) ? valor : item.horario;
      itens[i] = item;
      bloco.itens = itens;
      site.eventos = bloco;
    }
  } else if (a === "evento" && b === "novo") {
    const bloco = { ...((site.eventos as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    if (itens.length < 4) {
      const n = itens.length + 1;
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + 7);
      const data = hoje.toISOString().slice(0, 10);
      itens.push({
        id: `evt_extra_${n}`,
        titulo: valor.slice(0, 60),
        descricao: "Conte o que acontece neste dia.",
        data,
        data_label: data,
        horario: "19:00",
        imagem: { id: `img_evt_${n}`, src: "", alt: valor.slice(0, 60), categoria: "evento" },
      });
      if (!bloco.titulo) bloco.titulo = "Agenda";
      bloco.itens = itens;
      site.eventos = bloco;
    }
  } else if (a === "slogan") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    empresa.slogan = valor;
    site.empresa = empresa;
  } else if (a === "diferenciais" && b === "titulo") {
    const bloco = { ...((site.diferenciais as Record<string, unknown>) || {}) };
    bloco.titulo = valor.slice(0, 80);
    site.diferenciais = bloco;
  } else if (a === "eventos" && b === "titulo") {
    const bloco = { ...((site.eventos as Record<string, unknown>) || {}) };
    bloco.titulo = valor.slice(0, 80);
    site.eventos = bloco;
  } else if (a === "galeria" && b === "titulo") {
    const bloco = { ...((site.galeria as Record<string, unknown>) || {}) };
    bloco.titulo = valor.slice(0, 80);
    site.galeria = bloco;
  } else if (a === "gal" && c === "legenda") {
    const bloco = { ...((site.galeria as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i]) {
      itens[i] = { ...itens[i], legenda: valor.slice(0, 80) };
      bloco.itens = itens;
      site.galeria = bloco;
    }
  } else if (a === "promo" && b === "titulo") {
    const bloco = { ...((site.promocoes as Record<string, unknown>) || {}) };
    bloco.titulo = valor.slice(0, 80);
    site.promocoes = bloco;
  } else if (a === "prm") {
    const bloco = { ...((site.promocoes as Record<string, unknown>) || {}) };
    const itens = Array.isArray(bloco.itens) ? [...(bloco.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i] && (c === "titulo" || c === "descricao" || c === "validade")) {
      const item = { ...itens[i] };
      if (c === "titulo") item.titulo = valor.slice(0, 80);
      if (c === "descricao") item.descricao = valor;
      if (c === "validade") item.validade_label = valor.slice(0, 40);
      itens[i] = item;
      bloco.itens = itens;
      site.promocoes = bloco;
    }
  } else if (a === "rodape" && b === "texto") {
    const rodape = { ...((site.rodape as Record<string, unknown>) || {}) };
    rodape.texto = valor.slice(0, 160);
    site.rodape = rodape;
  } else if (a === "rodape" && c === "label") {
    const rodape = { ...((site.rodape as Record<string, unknown>) || {}) };
    const links = Array.isArray(rodape.links) ? [...(rodape.links as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (links[i]) {
      links[i] = { ...links[i], label: valor.slice(0, 48) };
      rodape.links = links;
      site.rodape = rodape;
    }
  } else if (a === "cta" && b === "servico") {
    const bloco = site.agendamento;
    if (bloco && typeof bloco === "object") {
      const ag = { ...(bloco as Record<string, unknown>) };
      ag.botao_confirmar = valor === "Agendar este" ? "Confirmar pelo WhatsApp" : valor.slice(0, 60);
      site.agendamento = ag;
    }
  } else if (a === "cta" && b === "contato") {
    const contato = { ...((site.contato as Record<string, unknown>) || {}) };
    const form = { ...((contato.formulario as Record<string, unknown>) || {}) };
    form.botao = valor === "Chamar no WhatsApp" ? "Enviar pelo WhatsApp" : valor.slice(0, 60);
    contato.formulario = form;
    site.contato = contato;
  } else if (a === "cta" && b === "flutuante") {
    const bloco = site.obrigado;
    if (bloco && typeof bloco === "object") {
      const ok = { ...(bloco as Record<string, unknown>) };
      ok.botao_whatsapp = valor === "WhatsApp" ? "Abrir WhatsApp" : valor.slice(0, 40);
      site.obrigado = ok;
    }
  } else if (a === "rede" && c === "label") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    const redes = Array.isArray(empresa.redes) ? [...(empresa.redes as Record<string, unknown>[])] : [];
    const i = redes.findIndex((r) => r.id === b);
    if (i >= 0) {
      redes[i] = { ...redes[i], label: valor.slice(0, 32) };
      empresa.redes = redes;
      site.empresa = empresa;
    }
  }
  return site;
}

export function copiaParaGeracao(copia: CopiaViva, servicos: { nome: string; descricao?: string }[]): GeracaoSiteJson {
  return {
    hero: { titulo: copia.hero?.titulo || "", subtitulo: copia.hero?.subtitulo || "" },
    sobre: { titulo: copia.sobre?.titulo || "Sobre", paragrafos: copia.sobre?.paragrafos || [] },
    servicos: {
      titulo: copia.servicos?.titulo || "Serviços",
      subtitulo: copia.servicos?.subtitulo || "",
      itens: servicos.map((s, i) => ({
        nome: s.nome,
        descricao: s.descricao || copia.servicos?.itens?.[i]?.descricao || "",
      })),
    },
    faq: {
      titulo: copia.faq?.titulo,
      itens: (copia.faq?.itens || [])
        .filter((f) => f.pergunta && f.resposta)
        .map((f) => ({ pergunta: f.pergunta || "", resposta: f.resposta || "" })),
    },
    contato: { titulo: copia.contato?.titulo, subtitulo: copia.contato?.subtitulo },
    profissionais: { titulo: copia.profissionais?.titulo, subtitulo: copia.profissionais?.subtitulo },
    imagens_sugeridas: [],
  };
}
