"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AprovarPrototipo } from "@/components/conta/AprovarPrototipo";
import { KitImpressao } from "@/components/conta/KitImpressao";
import { PainelPosPago } from "@/components/conta/PainelPosPago";
import { InstrucoesUso } from "@/components/InstrucoesUso";
import { ehPosPagamento, rotuloStatusCliente } from "@/lib/cliente/jornada";

type Dados = {
  id: string;
  nicho: string;
  nome: string;
  status: string;
  expiraEm: string;
  downloadUrl: string;
  completoUrl?: string;
  pacoteZipUrl?: string;
  demoUrl: string;
  contratarUrl: string;
  previewUrl: string;
  extratoUrl?: string;
  agendarUrl?: string;
  logoUrl?: string;
  aprovadoEm?: string;
  prazoIntegracao?: string;
  cidade?: string;
  whatsapp?: string;
  resumo: { empresa?: string; heroTitulo?: string; slogan?: string };
};

function Copiar({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
      onClick={() => {
        void navigator.clipboard.writeText(valor).then(() => {
          setOk(true);
          window.setTimeout(() => setOk(false), 1600);
        });
      }}
    >
      {ok ? "Copiado" : rotulo}
    </button>
  );
}

function Conta() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const token = sp.get("t") || "";
  const novo = sp.get("novo") === "1";
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState("");

  useEffect(() => {
    setOrigem(window.location.origin);
  }, []);

  useEffect(() => {
    if (!params.id || !token) {
      setErro("Acesso sem token. Use o link completo do protótipo.");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/prototipo/${params.id}?t=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Acesso negado");
        return;
      }
      setDados(json);
    })();
  }, [params.id, token]);

  if (erro) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">Área do cliente</h1>
        <p className="mt-3 text-muted">{erro}</p>
      </main>
    );
  }

  if (!dados) {
    return <main className="px-5 py-16 text-sm text-muted">Abrindo sua área…</main>;
  }

  const previewPath = dados.previewUrl || `/visualizar/${dados.id}`;
  const contaPath = `/conta/${dados.id}?t=${encodeURIComponent(token)}`;
  const previewAbs = origem ? `${origem}${previewPath}` : previewPath;
  const contaAbs = origem ? `${origem}${contaPath}` : contaPath;
  const agendaUrl = `/conta/${dados.id}/agenda?t=${encodeURIComponent(token)}`;
  const adminUrl = `/conta/${dados.id}/admin?t=${encodeURIComponent(token)}`;
  const extratoUrl = dados.extratoUrl || `/conta/${dados.id}/extrato?t=${encodeURIComponent(token)}`;
  const agendarAbsoluto = `${origem}${dados.agendarUrl || `${previewPath}#agendar`}`;
  const jaAprovado =
    dados.status === "aprovado" ||
    dados.status === "pago" ||
    dados.status === "em_integracao" ||
    dados.status === "publicado" ||
    Boolean(dados.aprovadoEm);
  const posPago = ehPosPagamento(dados.status);
  const nomeNegocio = dados.resumo.empresa || dados.nome;

  const mensagemWa = [
    `Olá! Segue o protótipo do site de ${nomeNegocio}.`,
    ``,
    `Ver o site: ${previewAbs}`,
    `Área do cliente (guarde este link): ${contaAbs}`,
    `Token: ${dados.id}`,
    ``,
    `Válido até ${new Date(dados.expiraEm).toLocaleDateString("pt-BR")}.`,
  ].join("\n");
  const waShare = `https://wa.me/?text=${encodeURIComponent(mensagemWa)}`;

  const cardsPre = [
    {
      titulo: "1 · Ver o site (quem agenda)",
      texto: "Abra o protótipo e role até Agenda — é ali que o cliente do serviço marca dia e horário.",
      href: `${previewPath}#agendar`,
      cta: "Abrir agenda no site",
    },
    {
      titulo: "2 · Comprar / publicar",
      texto: "PIX, boleto ou cartão. O pagamento libera domínio, e-mail e publicação.",
      href: dados.contratarUrl,
      cta: "Ir para a contratação",
      destaque: true,
    },
    {
      titulo: "Horários e confirmações (dono)",
      texto: "Defina expediente, vagas e como você confirma — painel, automático ou WhatsApp.",
      href: agendaUrl,
      cta: "Gerenciar agenda",
    },
    {
      titulo: "Administrador do site",
      texto: "Equipe, avisos, serviços, FAQ, endereço e redes — sem IA.",
      href: adminUrl,
      cta: "Abrir controle",
    },
    {
      titulo: "Extrato PDF",
      texto: "Cartão do protótipo com token e prazo de integração GuiX.",
      href: extratoUrl,
      cta: "Abrir extrato",
    },
  ];

  const cardsPos = [
    {
      titulo: "Horários e confirmações",
      texto: "Expediente, vagas e como você confirma os pedidos.",
      href: agendaUrl,
      cta: "Gerenciar agenda",
    },
    {
      titulo: "Textos, equipe e serviços",
      texto: "Ajuste o que aparece no site enquanto publicamos.",
      href: adminUrl,
      cta: "Abrir controle",
    },
    {
      titulo: "Ver o site",
      texto: "Prévia atual — o endereço definitivo chega quando estiver no ar.",
      href: previewPath,
      cta: "Abrir site",
    },
    {
      titulo: "Extrato / comprovante",
      texto: "PDF com token e resumo do pedido.",
      href: extratoUrl,
      cta: "Abrir extrato",
    },
  ];

  const cards = posPago ? cardsPos : cardsPre;

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">ÁREA DO CLIENTE</p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{nomeNegocio}</h1>
      <p className="mt-2 text-muted">
        {rotuloStatusCliente(dados.status)} · {dados.nicho}
        {!posPago ? (
          <>
            {" "}
            · teste válido até {new Date(dados.expiraEm).toLocaleDateString("pt-BR")}
          </>
        ) : null}
        {dados.prazoIntegracao && posPago && dados.status !== "publicado" ? (
          <>
            {" "}
            · meta {new Date(dados.prazoIntegracao).toLocaleString("pt-BR")}
          </>
        ) : null}
      </p>

      {posPago ? (
        <PainelPosPago
          status={dados.status}
          nomeNegocio={nomeNegocio}
          token={dados.id}
          previewHref={previewPath}
          agendaHref={agendaUrl}
          adminHref={adminUrl}
          prazoIntegracao={dados.prazoIntegracao}
        />
      ) : (
        <section
          className={`mt-8 rounded-2xl border px-5 py-5 sm:px-6 ${
            novo ? "border-emerald-300 bg-emerald-50" : "border-line bg-white"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {novo ? "Protótipo salvo" : "Seus links e o token"}
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-ink">
            {novo ? "Pronto — guarde o token e envie o link" : "Acesso do protótipo"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Seu rascunho foi salvo. Guarde o <strong>código de acesso</strong> e o <strong>link do site</strong> — sem
            eles o teste não abre de novo.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-line/80 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Código de acesso</p>
              <p className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-ink">{dados.id}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Copiar valor={dados.id} rotulo="Copiar código" />
              </div>
            </div>

            <div className="rounded-xl border border-line/80 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Link do site (enviar ao cliente)</p>
              <p className="mt-1 break-all text-sm text-ink">{previewAbs}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Copiar valor={previewAbs} rotulo="Copiar link do site" />
                <Link href={previewPath} className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                  Abrir site
                </Link>
                <a
                  href={waShare}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#128C7E]"
                >
                  Enviar no WhatsApp
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-line/80 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Link desta área (guarde)</p>
              <p className="mt-1 break-all text-sm text-ink">{contaAbs}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Copiar valor={contaAbs} rotulo="Copiar link da área" />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={dados.contratarUrl}
              className="inline-flex items-center justify-center rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-300"
            >
              Quero comprar e publicar
            </Link>
            <Link
              href={previewPath}
              className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              Ver o site antes
            </Link>
          </div>

          <ol className="mt-5 space-y-1.5 text-sm leading-6 text-slate-700">
            <li>
              <strong>1.</strong> Abra o site de teste e confira a agenda.
            </li>
            <li>
              <strong>2.</strong> Envie o link do site (ou o WhatsApp) para quem agenda com você.
            </li>
            <li>
              <strong>3.</strong> Quando fechar, clique em <strong>Quero comprar e publicar</strong>.
            </li>
          </ol>
        </section>
      )}

      {!posPago ? (
        <div className="mt-8">
          <AprovarPrototipo
            token={dados.id}
            nome={nomeNegocio}
            emailInicial={undefined}
            telefoneInicial={dados.whatsapp}
            jaAprovado={jaAprovado}
            prazoIntegracao={dados.prazoIntegracao}
            contratarUrl={dados.contratarUrl}
            extratoUrl={extratoUrl}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {origem && !posPago ? (
          <KitImpressao nome={nomeNegocio} agendarUrl={agendarAbsoluto} logoUrl={dados.logoUrl} />
        ) : null}
        {cards.map((c) => (
          <article
            key={c.titulo}
            className={`rounded-2xl border p-5 ${
              "destaque" in c && c.destaque ? "border-orange-300 bg-orange-50" : "border-line bg-white"
            }`}
          >
            <h2 className="font-semibold">{c.titulo}</h2>
            <p className="mt-2 text-sm text-muted">{c.texto}</p>
            <Link href={c.href} className="mt-4 inline-flex text-sm font-semibold text-accent underline">
              {c.cta}
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">E-mail profissional</p>
        <h2 className="mt-2 font-semibold">Até 5 caixas Zoho no seu domínio</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          O e-mail profissional inclui até 5 caixas no domínio do negócio, em endereços como{" "}
          <span className="font-mono text-ink">contato@</span> e{" "}
          <span className="font-mono text-ink">financeiro@</span>. A equipe GuiX configura as contas na publicação e
          envia os acessos; no primeiro login o Zoho pede a troca da senha provisória.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Para usar, entre em{" "}
          <a
            href="https://mail.zoho.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent underline"
          >
            mail.zoho.com
          </a>{" "}
          (ou no app Zoho Mail) com o endereço criado. Precisa de outra caixa ou de acesso como administrador? Fale com
          o time GuiX.
        </p>
      </section>

      {!posPago ? (
        <div className="mt-10">
          <InstrucoesUso compacto titulo="Lembrete: do token ao domínio" mostrarAtalhos={false} />
          <p className="mt-3 text-xs text-muted">
            Guarde o token e o link desta área.{" "}
            <Link href="/#faq" className="font-semibold text-accent underline">
              Ver FAQ
            </Link>
          </p>
        </div>
      ) : (
        <p className="mt-10 text-xs text-muted">
          Precisa reabrir este painel depois? Guarde o link desta página. Dúvidas: use o WhatsApp no bloco acima.
        </p>
      )}
    </main>
  );
}

export default function ContaPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Abrindo…</main>}>
      <Conta />
    </Suspense>
  );
}
