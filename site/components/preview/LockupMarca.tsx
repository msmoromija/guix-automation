"use client";

import { fonteCss, hexOk, tintaClara, uriMarca, type SpecLogo } from "@/lib/estudio/logo-spec";

function IconeArquivo({ src, cor, className }: { src: string; cor: string; className?: string }) {
  return (
    <span
      role="img"
      aria-hidden
      className={`inline-block shrink-0 ${className || ""}`}
      style={{
        backgroundColor: cor,
        aspectRatio: "1 / 1",
        minWidth: "2.5rem",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function LockupMarca({
  spec,
  nome,
  slogan,
  tinta,
  acento,
  className,
}: {
  spec: SpecLogo;
  nome: string;
  slogan?: string;
  tinta: string;
  acento: string;
  className?: string;
}) {
  const tintaNome = hexOk(spec.corNome) ? spec.corNome! : tinta;
  const tintaAcento = hexOk(spec.corAcento) ? spec.corAcento! : acento;
  const tintaIcone = hexOk(spec.corIcone) ? spec.corIcone! : tintaAcento;

  if (spec.arquivo) {
    const usarMascara = hexOk(tintaIcone);
    const inverter = !usarMascara && tintaClara(tinta);
    return (
      <span className={`inline-flex h-full min-w-0 items-center gap-3 ${className || ""}`} style={{ color: tintaNome }}>
        {usarMascara ? (
          <IconeArquivo src={spec.arquivo} cor={tintaIcone} className="h-full aspect-square" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={spec.arquivo}
            alt=""
            className="h-full w-auto max-h-full shrink-0 object-contain"
            style={{ filter: inverter ? "brightness(0) invert(1)" : undefined }}
          />
        )}
        <span className="min-w-0 leading-tight">
          <strong className="block truncate font-semibold" style={{ fontFamily: fonteCss(spec.fonteId), color: tintaNome }}>
            {nome}
          </strong>
          {slogan ? (
            <span className="mt-0.5 block truncate text-[11px] font-normal" style={{ color: tintaAcento }}>
              {slogan}
            </span>
          ) : null}
        </span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={uriMarca(spec, { nome, slogan, tinta, acento })} alt="" className={className} />
  );
}
