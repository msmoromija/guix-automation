import { htmlCreditoRodape } from "@/lib/media/credito";
import type { CreditoUnsplash } from "@/lib/media/tipos";

/** Rodapé discreto — só fotos com origem Unsplash (API). */
export function CreditosMidia({ creditos }: { creditos: CreditoUnsplash[] }) {
  const html = htmlCreditoRodape(creditos);
  if (!html) return null;
  return (
    <div
      className="mt-4 text-center"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
