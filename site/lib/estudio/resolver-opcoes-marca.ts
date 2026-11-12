import type { PatchPedido } from "@/lib/estudio/aplicar-pedido";
import type { SpecLogo } from "@/lib/estudio/logo-spec";

export async function resolverOpcoesMarca(
  patch: PatchPedido,
  entrada: {
    nome: string;
    nicho: string;
    pedido: string;
    evitar?: SpecLogo[];
    atual?: Partial<SpecLogo>;
  },
): Promise<{ patch: PatchPedido; aviso?: string }> {
  if (!patch.marca?.gerarOpcoes) return { patch };

  const atual = entrada.atual;
  const evitar = [
    ...(entrada.evitar || []),
    ...(atual
      ? [
          {
            id: atual.id || "marca-atual",
            origem: atual.origem || "biblioteca",
            icone: atual.icone || "",
            emblema: atual.emblema,
            arquivo: atual.arquivo,
            layout: atual.layout || "lado",
            fonteId: atual.fonteId || "system",
            corIcone: atual.corIcone,
            corNome: atual.corNome,
            corAcento: atual.corAcento,
          } as SpecLogo,
        ]
      : []),
  ].slice(0, 40);

  try {
    const res = await fetch("/api/prototipo/marca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: entrada.nome,
        nicho: entrada.nicho,
        pedido: entrada.pedido,
        evitar,
      }),
    });
    const data = (await res.json()) as { propostas?: SpecLogo[]; erro?: string };
    const proposta = data.propostas?.[0];
    if (!res.ok || !proposta) throw new Error(data.erro || "Não foi possível gerar as opções de marca.");

    const tipo = proposta.arquivo ? "arquivo" : proposta.emblema ? "emblema" : proposta.icone ? "icone" : "texto";
    return {
      patch: {
        ...patch,
        marca: {
          ...patch.marca,
          tipo,
          icone: proposta.icone || "",
          emblema: proposta.emblema || "",
          arquivo: proposta.arquivo || "",
          layout: proposta.layout,
          fonteId: proposta.fonteId,
          corIcone: proposta.corIcone || "",
          corNome: proposta.corNome || "auto",
          corAcento: proposta.corAcento || "",
          gerarOpcoes: true,
        },
      },
    };
  } catch (error) {
    return {
      patch: { ...patch, marca: { ...patch.marca, gerarOpcoes: false } },
      aviso: error instanceof Error ? error.message : "Não foi possível gerar as opções de marca.",
    };
  }
}
