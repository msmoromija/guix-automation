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
        .slice(0, 6)
        .map((item) => {
          const f = item as { pergunta?: string; resposta?: string };
          return { pergunta: corta(f.pergunta, 140), resposta: corta(f.resposta, 320) };
        })
        .filter((f) => f.pergunta && f.resposta)
    : [];
  return {
    hero: { titulo: corta(hero.titulo, 90), subtitulo: corta(hero.subtitulo, 220) },
    sobre: { titulo: corta(sobre.titulo, 80), paragrafos },
    servicos: { titulo: corta(servicos.titulo, 60), subtitulo: corta(servicos.subtitulo, 180), itens: itensSrv },
    contato: { titulo: corta(contato.titulo, 80), subtitulo: corta(contato.subtitulo, 220) },
    faq: { titulo: corta(faq.titulo, 60), itens: itensFaq },
    profissionais: { titulo: corta(pro.titulo, 60), subtitulo: corta(pro.subtitulo, 180) },
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
  if (a === "hero" && (b === "titulo" || b === "subtitulo")) {
    const hero = { ...((site.hero as Record<string, unknown>) || {}) };
    hero[b] = valor;
    site.hero = hero;
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
    faq.titulo = valor;
    site.faq = faq;
  } else if (a === "faq") {
    const faq = { ...((site.faq as Record<string, unknown>) || {}) };
    const itens = Array.isArray(faq.itens) ? [...(faq.itens as Record<string, unknown>[])] : [];
    const i = Number(b) || 0;
    if (itens[i] && (c === "pergunta" || c === "resposta")) {
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
  } else if (a === "slogan") {
    const empresa = { ...((site.empresa as Record<string, unknown>) || {}) };
    empresa.slogan = valor;
    site.empresa = empresa;
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
