import { NextRequest, NextResponse } from "next/server";
import { normalizarCopia } from "@/lib/estudio/copia-viva";
import { tituloVenha } from "@/lib/estudio/aplicar";
import { patchRapido, type PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { AVISO_ESTRUTURA, soEstrutura } from "@/lib/estudio/pedido-fechado";
import { resolverMidia } from "@/lib/estudio/resolver-midia";
import { escreverCopiaSimulacao, executarPedido } from "@/lib/media/openai";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";
export const maxDuration = 30;

const NICHOS = new Set(["barbearia", "salao", "estetica", "petshop", "academia", "contabilidade", "advocacia"]);
const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string) {
  const agora = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < agora) {
    hits.set(ip, { n: 1, reset: agora + 60 * 60 * 1000 });
    return true;
  }
  if (cur.n >= 40) return false;
  cur.n += 1;
  return true;
}

function listaServicos(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const item = s as { nome?: string; preco?: string; duracao?: string; descricao?: string };
      return {
        nome: String(item.nome || "").trim(),
        preco: String(item.preco || "").trim(),
        duracao: String(item.duracao || "").trim(),
        descricao: String(item.descricao || "").trim(),
      };
    })
    .filter((s) => s.nome && s.nome !== "Novo serviço")
    .slice(0, 12);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ erro: "Muitos pedidos de texto nesta hora. Edite direto no quadro por enquanto." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const nome = String(body.nome || "").trim();
    const nicho = String(body.nicho || "") as Nicho;
    if (nome.length < 2) return NextResponse.json({ erro: "Informe o nome do negócio." }, { status: 400 });
    if (!NICHOS.has(nicho)) return NextResponse.json({ erro: "Nicho inválido." }, { status: 400 });

    const cidade = String(body.cidade || "").trim();
    const bairro = String(body.bairro || "").trim();
    const servicos = listaServicos(body.servicos);
    if (body.modo === "executar") {
      const pedido = String(body.pedido || "").trim().slice(0, 400);
      if (pedido.length < 3) return NextResponse.json({ aviso: "Escreva o que quer mudar.", patch: null });
      if (soEstrutura(pedido)) return NextResponse.json({ aviso: AVISO_ESTRUTURA, patch: null });
      const rapido = patchRapido(pedido);
      if (rapido) return NextResponse.json({ patch: rapido, aviso: "", resumo: rapido.resumo || "" });
      try {
        const bruto = (await executarPedido({ nicho, pedido, contexto: body.contexto })) as PatchPedido;
        const patch = await resolverMidia(bruto, nicho);
        return NextResponse.json({
          patch,
          resumo: String(patch.resumo || "").slice(0, 220),
          aviso: String(patch.aviso_estrutura || "").replace(/\s+/g, " ").trim().slice(0, 280),
        });
      } catch {
        return NextResponse.json({ patch: null, aviso: "Não consegui aplicar agora. Tente de novo em uma frase." });
      }
    }

    const gerado = await escreverCopiaSimulacao({
            nicho,
            nome,
            cidade,
            bairro,
            slogan: String(body.slogan || "").trim(),
            tom: String(body.tom || "").trim(),
            destaque: String(body.destaque || "").trim(),
            servicos,
            profissionais: Array.isArray(body.profissionais) ? body.profissionais : [],
          });

    const copia = normalizarCopia(gerado.copia);
    if ((bairro || cidade) && copia.contato && !copia.contato.titulo) {
      copia.contato.titulo = tituloVenha(bairro, cidade) || "";
    }
    const aviso = String(gerado.aviso || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);
    return NextResponse.json({ copia, aviso });
  } catch {
    return NextResponse.json(
      { erro: "Não deu para escrever agora. O quadro continua editável.", copia: null, aviso: "" },
      { status: 200 },
    );
  }
}
