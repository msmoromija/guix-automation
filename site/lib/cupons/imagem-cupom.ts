import { formatarReais } from "@/lib/dinheiro";

export type DadosImagemCupom = {
  codigo: string;
  tipo: "fixo" | "percentual";
  valorCentavos: number;
  percentual: number;
  validoAte?: string | null;
};

/** Gera PNG do cupom no browser (para WhatsApp / download). */
export async function gerarImagemCupomPng(dados: DadosImagemCupom): Promise<Blob> {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0F172A");
  grad.addColorStop(0.55, "#1E293B");
  grad.addColorStop(1, "#EA580C");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.12, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.1, h * 0.88, 280, 0, Math.PI * 2);
  ctx.fill();

  const cardX = 72;
  const cardY = 180;
  const cardW = w - 144;
  const cardH = h - 360;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = "#FFF7ED";
  ctx.fill();

  ctx.fillStyle = "#EA580C";
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.fillText("GUIX.NET", cardX + 56, cardY + 72);

  ctx.fillStyle = "#0F172A";
  ctx.font = "700 54px system-ui, sans-serif";
  ctx.fillText("Cupom de desconto", cardX + 56, cardY + 150);

  const beneficio =
    dados.tipo === "percentual"
      ? `${dados.percentual}% OFF`
      : formatarReais(dados.valorCentavos).replace(/\s/g, " ");

  ctx.fillStyle = "#EA580C";
  ctx.font = "800 120px system-ui, sans-serif";
  ctx.fillText(beneficio, cardX + 56, cardY + 320);

  ctx.fillStyle = "#64748B";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText("Use este código em Quero meu site", cardX + 56, cardY + 400);

  roundRect(ctx, cardX + 56, cardY + 450, cardW - 112, 140, 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#FDBA74";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.font = "800 64px ui-monospace, monospace";
  const codigo = dados.codigo.toUpperCase();
  const cw = ctx.measureText(codigo).width;
  ctx.fillText(codigo, cardX + 56 + (cardW - 112 - cw) / 2, cardY + 540);

  ctx.fillStyle = "#475569";
  ctx.font = "500 28px system-ui, sans-serif";
  const linhas = [
    "1. Abra guix.net.br/contratar",
    "2. Digite o código em Cupom de desconto",
    "3. Clique em Aplicar e gere o pagamento",
  ];
  linhas.forEach((linha, i) => {
    ctx.fillText(linha, cardX + 56, cardY + 660 + i * 48);
  });

  if (dados.validoAte) {
    ctx.fillStyle = "#94A3B8";
    ctx.font = "500 24px system-ui, sans-serif";
    ctx.fillText(
      `Válido até ${new Date(dados.validoAte).toLocaleDateString("pt-BR")}`,
      cardX + 56,
      cardY + cardH - 48,
    );
  }

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("guix.net.br", 72, h - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Falha ao gerar imagem"));
      else resolve(blob);
    }, "image/png");
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
