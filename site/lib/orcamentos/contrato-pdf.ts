/** PDF 1.4 do contrato de orçamento — timbre GuiX, Helvetica, assinatura do contratante. */

function escPdf(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Normaliza para Helvetica Type1 (ASCII + Latin comum sem glifos quebrados). */
export function textoPdfSeguro(s: string) {
  return s
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u202f\u2007\u2009\u200a\u200b\ufeff]/g, " ")
    .replace(/[–—―]/g, "-")
    .replace(/[·•∙⋅]/g, "-")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/…/g, "...")
    .replace(/€/g, "EUR")
    .replace(/™/g, "(TM)")
    .replace(/®/g, "(R)")
    .replace(/°/g, "o")
    .replace(/±/g, "+/-")
    .replace(/×/g, "x")
    .replace(/÷/g, "/")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/→|←|↔/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n\t]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function quebrarLinha(linha: string, max: number): string[] {
  const t = linha || " ";
  if (t.length <= max) return [t];
  const out: string[] = [];
  let rest = t;
  while (rest.length > max) {
    let corte = rest.lastIndexOf(" ", max);
    if (corte < Math.floor(max * 0.45)) corte = max;
    out.push(rest.slice(0, corte).trimEnd());
    rest = rest.slice(corte).trimStart();
  }
  if (rest) out.push(rest);
  return out;
}

function reaisAscii(centavos: number) {
  const n = (centavos / 100).toFixed(2).replace(".", ",");
  const [int, dec] = n.split(",");
  const comPontos = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${comPontos},${dec}`;
}

type Opts = {
  titulo: string;
  id: string;
  texto: string;
  clienteNome?: string;
  valorCentavos?: number;
  descontoCentavos?: number;
  totalCentavos?: number;
  prazo?: string;
};

type Bloco =
  | { tipo: "espaco"; h: number }
  | { tipo: "linha"; texto: string; fonte: "F1" | "F2"; size: number; leading: number }
  | { tipo: "regua" }
  | { tipo: "assinatura"; cliente: string };

function montarBlocos(opts: Opts): Bloco[] {
  const cliente = textoPdfSeguro(opts.clienteNome || "Contratante").slice(0, 80) || "Contratante";
  const titulo = textoPdfSeguro(opts.titulo || "Orcamento personalizado").slice(0, 90);
  const prazo = textoPdfSeguro(opts.prazo || "conforme oferta").slice(0, 60);
  const corpo: Bloco[] = [];
  for (const l of textoPdfSeguro(opts.texto).split("\n")) {
    const linha = l.trimEnd();
    if (!linha.trim()) {
      corpo.push({ tipo: "espaco", h: 8 });
      continue;
    }
    const isTituloSecao =
      /^(\d+\.\s|[A-Z0-9][A-Z0-9 \-/]{8,}$|TERMOS E |CRIACAO |GUIX|ORCAMENTO COMERCIAL|DADOS DESTE|ACEITACAO)/.test(
        linha.trim(),
      );
    const fonte: "F1" | "F2" = isTituloSecao ? "F2" : "F1";
    const size = isTituloSecao ? 10 : 9;
    const leading = isTituloSecao ? 13 : 12;
    for (const t of quebrarLinha(linha, isTituloSecao ? 82 : 92)) {
      corpo.push({ tipo: "linha", texto: t, fonte, size, leading });
    }
  }

  const resumo: Bloco[] = [
    { tipo: "linha", texto: "DOCUMENTO TECNICO-COMERCIAL", fonte: "F2", size: 9, leading: 12 },
    { tipo: "linha", texto: "Contrato de prestacao de servicos - criacao e desenvolvimento de sites", fonte: "F1", size: 9, leading: 12 },
    { tipo: "espaco", h: 6 },
    { tipo: "linha", texto: `Titulo: ${titulo}`, fonte: "F1", size: 9, leading: 12 },
    { tipo: "linha", texto: `Orcamento: ${opts.id}`, fonte: "F1", size: 9, leading: 12 },
    { tipo: "linha", texto: `Contratante: ${cliente}`, fonte: "F1", size: 9, leading: 12 },
    { tipo: "linha", texto: `Prazo comercial: ${prazo}`, fonte: "F1", size: 9, leading: 12 },
  ];
  if (typeof opts.valorCentavos === "number") {
    resumo.push({
      tipo: "linha",
      texto: `Valor padrao: ${reaisAscii(opts.valorCentavos)}${
        opts.descontoCentavos ? ` | Desconto: ${reaisAscii(opts.descontoCentavos)}` : ""
      } | Total: ${reaisAscii(opts.totalCentavos ?? opts.valorCentavos)}`,
      fonte: "F2",
      size: 9,
      leading: 12,
    });
  }
  resumo.push({ tipo: "espaco", h: 8 }, { tipo: "regua" }, { tipo: "espaco", h: 8 });

  const assinatura: Bloco[] = [
    { tipo: "espaco", h: 14 },
    { tipo: "regua" },
    { tipo: "espaco", h: 10 },
    { tipo: "linha", texto: "14. ASSINATURA DO CONTRATANTE", fonte: "F2", size: 10, leading: 13 },
    { tipo: "espaco", h: 6 },
    {
      tipo: "linha",
      texto: "Ao assinar, o contratante declara ter lido e aceito integralmente este contrato e o orcamento.",
      fonte: "F1",
      size: 9,
      leading: 12,
    },
    { tipo: "espaco", h: 16 },
    { tipo: "assinatura", cliente },
  ];

  return [...resumo, ...corpo, ...assinatura];
}

function alturaBloco(b: Bloco): number {
  if (b.tipo === "espaco") return b.h;
  if (b.tipo === "regua") return 10;
  if (b.tipo === "assinatura") return 118;
  return b.leading;
}

function streamAssinatura(cliente: string): string[] {
  const nome = escPdf(cliente);
  return [
    "0.15 w 0.12 0.16 0.22 RG",
    "48 0 m 280 0 l S",
    "315 0 m 547 0 l S",
    "0 0 0 rg",
    "BT",
    "/F1 8 Tf",
    "48 -12 Td",
    `(Assinatura do contratante) Tj`,
    "267 0 Td",
    `(Local e data) Tj`,
    "ET",
    "0.15 w 0.12 0.16 0.22 RG",
    "48 -48 m 280 -48 l S",
    "315 -48 m 547 -48 l S",
    "0 0 0 rg",
    "BT",
    "/F1 8 Tf",
    "48 -60 Td",
    `(Nome completo / razao social) Tj`,
    "267 0 Td",
    `(CPF ou CNPJ) Tj`,
    "ET",
    "BT",
    "/F2 9 Tf",
    "48 -86 Td",
    `(Contratante: ${nome}) Tj`,
    "ET",
    "BT",
    "/F1 8 Tf",
    "48 -102 Td",
    "(GuiX.net - guix.net.br - atendimento@guix.net.br) Tj",
    "ET",
  ];
}

function streamCabecalho(): string[] {
  return [
    "0.12 0.16 0.22 rg",
    "0 792 595 50 re f",
    "0.97 0.45 0.09 rg",
    "0 790 595 3 re f",
    "1 1 1 rg",
    "BT",
    "/F2 16 Tf",
    "48 812 Td",
    "(GuiX.net) Tj",
    "ET",
    "BT",
    "/F1 9 Tf",
    "48 798 Td",
    "(Criacao e desenvolvimento de sites profissionais) Tj",
    "ET",
    "BT",
    "/F1 8 Tf",
    "400 812 Td",
    "(guix.net.br) Tj",
    "ET",
    "0 0 0 rg",
  ];
}

function streamRodape(pagina: number, total: number): string[] {
  return [
    "0.97 0.45 0.09 rg",
    "48 36 499 1.2 re f",
    "0.35 0.4 0.48 rg",
    "BT",
    "/F1 8 Tf",
    "48 22 Td",
    "(GuiX.net - documento tecnico-comercial - guix.net.br) Tj",
    "ET",
    "BT",
    "/F1 8 Tf",
    "480 22 Td",
    `(Pag. ${pagina}/${total}) Tj`,
    "ET",
    "0 0 0 rg",
  ];
}

export function montarContratoPdf(opts: Opts) {
  const blocos = montarBlocos(opts);
  const topY = 772;
  const bottomY = 56;
  const usable = topY - bottomY;

  type Pagina = { cmds: string[]; y: number };
  const paginas: Pagina[] = [{ cmds: [], y: topY }];

  function paginaAtual() {
    return paginas[paginas.length - 1];
  }

  function novaPagina() {
    paginas.push({ cmds: [], y: topY });
  }

  function garantirEspaco(h: number) {
    if (paginaAtual().y - h < bottomY) novaPagina();
  }

  for (const b of blocos) {
    const h = alturaBloco(b);
    garantirEspaco(h);
    const p = paginaAtual();

    if (b.tipo === "espaco") {
      p.y -= b.h;
      continue;
    }
    if (b.tipo === "regua") {
      p.cmds.push("0.85 0.88 0.92 rg", `48 ${p.y - 3} 499 0.8 re f`, "0 0 0 rg");
      p.y -= 10;
      continue;
    }
    if (b.tipo === "assinatura") {
      p.cmds.push(`q 1 0 0 1 0 ${p.y} cm`, ...streamAssinatura(b.cliente), "Q");
      p.y -= 118;
      continue;
    }

    p.cmds.push(
      "BT",
      `/${b.fonte} ${b.size} Tf`,
      `48 ${p.y - b.size} Td`,
      `(${escPdf(b.texto)}) Tj`,
      "ET",
    );
    p.y -= b.leading;
  }

  const totalPaginas = paginas.length;
  const pageObjs: Array<{ pageId: number; contentId: number; stream: string }> = [];
  let nextId = 3;
  const pageKids: string[] = [];

  for (let i = 0; i < paginas.length; i++) {
    const body = paginas[i].cmds.join("\n");
    const stream = [...streamCabecalho(), body, ...streamRodape(i + 1, totalPaginas)].join("\n");
    const pageId = nextId++;
    const contentId = nextId++;
    pageObjs.push({ pageId, contentId, stream });
    pageKids.push(`${pageId} 0 R`);
  }

  const fontRegular = nextId++;
  const fontBold = nextId++;

  const objects = new Map<number, string>();
  objects.set(1, "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.set(2, `2 0 obj<< /Type /Pages /Kids [${pageKids.join(" ")}] /Count ${pageObjs.length} >>endobj\n`);

  for (const p of pageObjs) {
    objects.set(
      p.pageId,
      `${p.pageId} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${p.contentId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>endobj\n`,
    );
    const streamBuf = Buffer.from(p.stream, "latin1");
    objects.set(
      p.contentId,
      `${p.contentId} 0 obj<< /Length ${streamBuf.length} >>stream\n${p.stream}\nendstream\nendobj\n`,
    );
  }
  objects.set(fontRegular, `${fontRegular} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n`);
  objects.set(fontBold, `${fontBold} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id <= fontBold; id++) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += objects.get(id) || `${id} 0 obj<<>>endobj\n`;
  }
  const xrefPos = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${fontBold + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${fontBold + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}
