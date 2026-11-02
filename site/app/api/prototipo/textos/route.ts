import { NextRequest, NextResponse } from "next/server";
import { normalizarCopia } from "@/lib/estudio/copia-viva";
import { tituloVenha } from "@/lib/estudio/aplicar";
import { patchRapido, type PatchPedido } from "@/lib/estudio/aplicar-pedido";
import { AVISO_ESTRUTURA, soEstrutura } from "@/lib/estudio/pedido-fechado";
import { resolverMidia } from "@/lib/estudio/resolver-midia";
import { escreverCopiaSimulacao, executarPedido } from "@/lib/media/openai";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

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

function falaTexto(pedido: string) {
  return /\b(texto|t[ií]tulos?|subt[ií]tulo|refa[cç]|reescrev|linguajar|tom|animad|cordial|capa|sobre|faq|d[uú]vida|slogan|frase|evento|agenda|vazios?|preench)/i.test(
    pedido,
  );
}

function falaFoto(pedido: string) {
  return /\b(foto|fotos|imagem|imagens|galeria|unsplash|capa|banner|troque as imagens|mude as imagens|midia)\b/i.test(pedido);
}

function patchTemConteudo(patch: PatchPedido | null | undefined) {
  if (!patch || typeof patch !== "object") return false;
  return Boolean(
    patch.resumo ||
      patch.hero ||
      patch.sobre ||
      patch.contato ||
      patch.servicos ||
      patch.faq ||
      patch.eventos ||
      patch.avisos ||
      patch.redes ||
      patch.visual ||
      patch.empresa ||
      patch.diferenciais ||
      patch.header ||
      patch.rodape ||
      patch.profissionais ||
      patch.midia?.foto?.src ||
      (Array.isArray(patch.midia?.fotos) && patch.midia.fotos.some((f) => f?.src || (f as { busca?: string }).busca)) ||
      patch.midia?.logo?.src,
  );
}

function mesclarPatches(a: PatchPedido, b: PatchPedido): PatchPedido {
  const midia = {
    ...(a.midia || {}),
    ...(b.midia || {}),
    foto: b.midia?.foto || a.midia?.foto,
    fotos: [...(Array.isArray(a.midia?.fotos) ? a.midia!.fotos! : []), ...(Array.isArray(b.midia?.fotos) ? b.midia!.fotos! : [])].slice(0, 4),
    logo: b.midia?.logo || a.midia?.logo,
  };
  return {
    ...a,
    ...b,
    resumo: [a.resumo, b.resumo].filter(Boolean).join(" ").slice(0, 220),
    aviso_estrutura: [a.aviso_estrutura, b.aviso_estrutura].filter(Boolean).join(" ").slice(0, 280),
    hero: b.hero || a.hero,
    sobre: b.sobre || a.sobre,
    contato: b.contato || a.contato,
    empresa: { ...(a.empresa || {}), ...(b.empresa || {}) },
    servicos: b.servicos || a.servicos,
    faq: b.faq || a.faq,
    eventos: b.eventos || a.eventos,
    avisos: b.avisos || a.avisos,
    redes: { ...(a.redes || {}), ...(b.redes || {}) },
    profissionais: b.profissionais || a.profissionais,
    diferenciais: b.diferenciais || a.diferenciais,
    visual: { ...(a.visual || {}), ...(b.visual || {}) },
    midia,
    abrir: b.abrir || a.abrir,
  };
}

/** Garante efeito real quando o cliente pede alinhamento do logo (a IA às vezes só muda o resumo). */
function reforcarAlinhamentoLogo(pedido: string, patch: PatchPedido): PatchPedido {
  if (!/\balinh/i.test(pedido)) return patch;
  if (!/\b(logo|marca|slogan|cabe[cç]alho|texto)\b/i.test(pedido)) return patch;
  return {
    ...patch,
    visual: {
      ...(patch.visual || {}),
      logoAlinhamento: "centro",
      cabecalho: patch.visual?.cabecalho || "logo-slogan",
    },
    resumo: patch.resumo?.trim() || "Alinhei o texto do logo ao centro com a marca.",
  };
}

async function montarPatch(nicho: Nicho, pedido: string, contexto: unknown) {
  const composto = falaTexto(pedido) && falaFoto(pedido);
  if (!composto) {
    const bruto = reforcarAlinhamentoLogo(
      pedido,
      (await executarPedido({ nicho, pedido, contexto, timeoutMs: 40000 })) as PatchPedido,
    );
    return resolverMidia(bruto, nicho);
  }

  let textos: PatchPedido = {};
  try {
    textos = (await executarPedido({
      nicho,
      pedido: `${pedido}\n\nNesta resposta: textos, FAQ, eventos, avisos, serviços, equipe, visual se pedido. NÃO preencha midia.`,
      contexto,
      timeoutMs: 28000,
    })) as PatchPedido;
  } catch {
    textos = {};
  }

  let fotos: PatchPedido = {};
  try {
    fotos = (await executarPedido({
      nicho,
      pedido: `Ofício do contexto. Troque as fotos: preencha midia.fotos com hero, sobre e galeria (busca em inglês curto). Sem textos.`,
      contexto,
      timeoutMs: 18000,
    })) as PatchPedido;
  } catch {
    fotos = {};
  }

  const bruto = reforcarAlinhamentoLogo(pedido, mesclarPatches(textos || {}, fotos || {}));
  if (!bruto.resumo) bruto.resumo = "Atualizei o que o motor permite neste pedido.";
  return resolverMidia(bruto, nicho);
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
      const pedido = String(body.pedido || "").trim().slice(0, 900);
      if (pedido.length < 3) return NextResponse.json({ aviso: "Escreva o que quer mudar.", patch: null, via: "nenhum" });
      if (soEstrutura(pedido)) return NextResponse.json({ aviso: AVISO_ESTRUTURA, patch: null, via: "nenhum" });

      // OpenAI primeiro — atalho só se a IA falhar de verdade.
      try {
        let patch = await montarPatch(nicho, pedido, body.contexto);
        if (!patchTemConteudo(patch)) {
          patch = await resolverMidia(
            (await executarPedido({
              nicho,
              pedido: `${pedido}\n\nOBRIGATÓRIO: devolva JSON com as mudanças pedidas agora. Não deixe o patch vazio. Use o formato completo.`,
              contexto: body.contexto,
              timeoutMs: 35000,
            })) as PatchPedido,
            nicho,
          );
        }
        if (patchTemConteudo(patch)) {
          return NextResponse.json({
            patch,
            resumo: String(patch.resumo || "").slice(0, 220),
            aviso: String(patch.aviso_estrutura || "").replace(/\s+/g, " ").trim().slice(0, 280),
            via: "openai",
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const rapido = patchRapido(pedido);
        if (rapido) {
          return NextResponse.json({
            patch: rapido,
            aviso: "OpenAI falhou neste instante; apliquei o atalho local do que deu.",
            resumo: rapido.resumo || "",
            via: "atalho",
          });
        }
        const aviso = /abort/i.test(msg)
          ? "A OpenAI demorou demais. Peça de novo em uma frase."
          : /OPENAI_API_KEY/i.test(msg)
            ? "OPENAI_API_KEY ausente neste ambiente."
            : "Não consegui falar com a OpenAI agora. Tente de novo.";
        return NextResponse.json({ patch: null, aviso, via: "nenhum" });
      }

      const rapido = patchRapido(pedido);
      if (rapido) {
        return NextResponse.json({
          patch: rapido,
          aviso: "A IA não montou o patch; apliquei só o atalho local.",
          resumo: rapido.resumo || "",
          via: "atalho",
        });
      }
      return NextResponse.json({
        patch: null,
        aviso: "A OpenAI respondeu vazia. Peça de novo, bem objetivo.",
        via: "nenhum",
      });
    }

    const gerado = await escreverCopiaSimulacao({
      nicho,
      nome,
      cidade,
      bairro,
      slogan: String(body.slogan || "").trim(),
      tom: String(body.tom || "").trim(),
      destaque: String(body.destaque || "").trim(),
      horario: String(body.horario || "").trim(),
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
    return NextResponse.json({ copia, aviso, via: "openai" });
  } catch {
    return NextResponse.json(
      { erro: "Não deu para escrever agora. O quadro continua editável.", copia: null, aviso: "", via: "nenhum" },
      { status: 200 },
    );
  }
}
