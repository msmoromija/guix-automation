"use client";

import { fonteCss, tintaClara, uriMarca, type SpecLogo } from "@/lib/estudio/logo-spec";

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
  if (spec.arquivo) {
    const inverter = tintaClara(tinta);
    return (
      <span className={`inline-flex h-full min-w-0 items-center gap-3 ${className || ""}`} style={{ color: tinta }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spec.arquivo}
          alt=""
          className="h-full w-auto max-h-full shrink-0 object-contain"
          style={{ filter: inverter ? "brightness(0) invert(1)" : undefined }}
        />
        <span className="min-w-0 leading-tight">
          <strong className="block truncate font-semibold" style={{ fontFamily: fonteCss(spec.fonteId) }}>
            {nome}
          </strong>
          {slogan ? (
            <span className="mt-0.5 block truncate text-[11px] font-normal opacity-70" style={{ color: acento }}>
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
