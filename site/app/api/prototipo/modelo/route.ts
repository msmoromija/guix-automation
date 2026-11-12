import { NextRequest, NextResponse } from "next/server";
import { carregarExemplo } from "@/lib/automacao/carregar-exemplo";
import { rotacionarFotosDoModelo } from "@/lib/media/escolher-imagens";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const NICHOS: Nicho[] = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "clinica",
  "dentista",
  "psicologia",
  "nutricionista",
  "generico",
];

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("nicho") || "barbearia") as Nicho;
  const nicho = NICHOS.includes(raw) ? raw : "barbearia";
  try {
    const base = await carregarExemplo(nicho);
    // Cada carga do modelo troca as fotos (capa, sobre, serviços e galeria) para
    // a prévia do estúdio não repetir sempre as mesmas imagens do JSON.
    const site = await rotacionarFotosDoModelo(base, nicho);
    return NextResponse.json({ site, nicho });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Modelo não encontrado." },
      { status: 404 },
    );
  }
}
