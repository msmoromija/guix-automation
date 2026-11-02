/** PDF mínimo 1.4 sem dependências — extrato do protótipo. */

function escPdf(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function montarExtratoPdf(opts: {
  nome: string;
  token: string;
  nicho: string;
  status: string;
  aprovadoEm?: string;
  prazoIntegracao?: string;
  slogan?: string;
  contaUrl: string;
}) {
  const linhas = [
    "GuiX — Extrato do prototipo",
    "",
    opts.nome.slice(0, 60),
    opts.slogan ? opts.slogan.slice(0, 70) : "",
    "",
    `Token: ${opts.token}`,
    `Nicho: ${opts.nicho}`,
    `Status: ${opts.status}`,
    opts.aprovadoEm ? `Aprovado: ${opts.aprovadoEm}` : "",
    opts.prazoIntegracao ? `Prazo integracao GuiX: ${opts.prazoIntegracao}` : "",
    "",
    "Area do cliente:",
    opts.contaUrl.slice(0, 90),
    "",
    "guix.net.br",
  ].filter((l) => l !== undefined);

  const contentLines: string[] = ["BT", "/F1 11 Tf", "50 780 Td", "14 TL"];
  let first = true;
  for (const linha of linhas) {
    const t = escPdf(linha || " ");
    if (first) {
      contentLines.push(`(${t}) Tj`);
      first = false;
    } else {
      contentLines.push("T*");
      contentLines.push(`(${t}) Tj`);
    }
  }
  contentLines.push("ET");
  const stream = contentLines.join("\n");
  const streamBuf = Buffer.from(stream, "utf8");

  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
  );
  objects.push(`4 0 obj<< /Length ${streamBuf.length} >>stream\n${stream}\nendstream\nendobj\n`);
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
