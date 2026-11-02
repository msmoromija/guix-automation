import { NextRequest, NextResponse } from "next/server";
import { carregarExemplo } from "@/lib/automacao/carregar-exemplo";
import type { Nicho } from "@/lib/media/tipos";

export const runtime = "nodejs";

const NICHOS: Nicho[] = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "clinica",
  "generico",
];

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("nicho") || "barbearia") as Nicho;
  const nicho = NICHOS.includes(raw) ? raw : "barbearia";
  try {
    const site = await carregarExemplo(nicho);
    return NextResponse.json({ site, nicho });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Modelo não encontrado." },
      { status: 404 },
    );
  }
}
