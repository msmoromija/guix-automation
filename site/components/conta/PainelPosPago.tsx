"use client";

import Link from "next/link";
import {
  checklistDadosPublicacao,
  mensagemWaDadosPendentes,
  rotuloStatusCliente,
  timelinePublicacao,
} from "@/lib/cliente/jornada";

export function PainelPosPago({
  status,
  nomeNegocio,
  token,
  previewHref,
  agendaHref,
  adminHref,
  prazoIntegracao,
}: {
  status: string;
  nomeNegocio: string;
  token: string;
  previewHref: string;
  agendaHref: string;
  adminHref: string;
  prazoIntegracao?: string;
}) {
  const timeline = timelinePublicacao(status);
  const checklist = checklistDadosPublicacao();
  const wa = mensagemWaDadosPendentes({ nomeNegocio, token });
  const publicado = status === "publicado";

  return (
    <section className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-5 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
        {publicado ? "Site em publicação / no ar" : "Pós-pagamento"}
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-ink">
        {publicado ? "Seu site está no ar (ou quase)" : "Recebemos seu pagamento"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Situação agora: <strong>{rotuloStatusCliente(status)}</strong>
        {prazoIntegracao && !publicado ? (
          <>
            {" "}
            · meta de integração até {new Date(prazoIntegracao).toLocaleString("pt-BR")}
          </>
        ) : null}
        . O prazo de <strong>até 24 horas</strong> começa quando os dados abaixo estiverem confirmados.
      </p>

      <ol className="mt-6 space-y-3">
        {timeline.map((passo) => (
          <li key={passo.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                passo.estado === "feito"
                  ? "bg-emerald-600 text-white"
                  : passo.estado === "atual"
                    ? "bg-orange-400 text-slate-950"
                    : "bg-white text-muted border border-line"
              }`}
              aria-hidden
            >
              {passo.estado === "feito" ? "✓" : passo.estado === "atual" ? "•" : ""}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{passo.titulo}</p>
              <p className="text-sm text-slate-600">{passo.detalhe}</p>
            </div>
          </li>
        ))}
      </ol>

      {!publicado ? (
        <div className="mt-6 rounded-xl border border-emerald-200/80 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            Confirme estes dados (acelera as 24h)
          </p>
          <ul className="mt-3 space-y-2.5">
            {checklist.map((item) => (
              <li key={item.id} className="text-sm leading-6 text-slate-700">
                <strong className="text-ink">{item.titulo}.</strong> {item.detalhe}
              </li>
            ))}
          </ul>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            Enviar dados no WhatsApp
          </a>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={previewHref}
          className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Ver o site
        </Link>
        <Link
          href={agendaHref}
          className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink"
        >
          Minha agenda
        </Link>
        <Link
          href={adminHref}
          className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink"
        >
          Ajustar textos e equipe
        </Link>
      </div>
    </section>
  );
}
