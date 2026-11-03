"use client";

import { useState } from "react";
import { textoComoComprarFaq, textoComoGerarFaq, textoTokenFaq } from "@/lib/instrucoes-uso";

const perguntas = [
  {
    pergunta: "Como eu gero o site de teste?",
    resposta: textoComoGerarFaq,
  },
  {
    pergunta: "O que é o código de acesso e onde eu acho?",
    resposta: textoTokenFaq,
  },
  {
    pergunta: "Como compro o site com domínio?",
    resposta: textoComoComprarFaq,
  },
  {
    pergunta: "Qual a diferença entre o site de teste e o site publicado?",
    resposta:
      "O site de teste é o rascunho que você monta de graça: serve para ver o visual e enviar o link, e vale cerca de 3 dias. O site publicado só existe depois da contratação — aí entram domínio próprio, e-mail profissional e a página no ar de verdade, em até 24 horas com os dados completos.",
  },
  {
    pergunta: "Quanto tempo leva para ficar pronto?",
    resposta:
      "O protótipo de teste sai na hora em que você clica em Salvar. A publicação com domínio leva até 24 horas depois que as informações do negócio chegam completas (nome, serviços, horários, contatos). Se faltar um dado essencial, o prazo só começa quando ele é enviado.",
  },
  {
    pergunta: "Eu preciso saber de tecnologia?",
    resposta:
      "Não. Você preenche o que o negócio já sabe: nome, serviços, horários, cores e WhatsApp. O GuiX.net configura domínio, e-mail, site, agenda e WhatsApp. Depois, o painel é para o dia a dia, sem código e sem chamar agência a cada ajuste.",
  },
  {
    pergunta: "O que exatamente entra na entrega?",
    resposta:
      "Na compra: domínio próprio, e-mail profissional no mesmo domínio, site responsivo, agenda online e WhatsApp no número da empresa. Tudo isso entra junto na publicação — não só o visual do site.",
  },
  {
    pergunta: "Posso mudar textos, horários e serviços depois?",
    resposta:
      "Sim. Depois da publicação o painel fica com você. Dá para alterar horários, serviços e textos sem abrir chamado. No protótipo de teste também dá para ajustar (até o limite de pedidos) antes de comprar.",
  },
  {
    pergunta: "O domínio fica no meu nome?",
    resposta:
      "Sim. O domínio é do seu negócio, com o nome que você escolher, dentro das regras de disponibilidade e registro. Não ficamos com um endereço genérico de plataforma.",
  },
  {
    pergunta: "Vocês usam inteligência artificial?",
    resposta:
      "Sim. A IA prepara textos e estrutura a partir do que você digitou no estúdio — caminho padrão, mais rápido. Se preferir configuração pela equipe sem IA, existe a opção na contratação (+ R$ 200,00).",
  },
  {
    pergunta: "Qual a diferença entre Presença Completa, Avançada e Personalizada?",
    resposta:
      "Presença Completa (R$ 499,90): modelo padrão — barbearias, salões, estética, pet shops, academias, contabilidade e advocacia. Presença Avançada (R$ 1.499,90): negócios médios com mais estrutura (imobiliárias, consultórios menores, catálogo ou agenda mais organizada). Presença Personalizada (a partir de R$ 2.999,90): operação complexa ou sob medida; o valor final depende da personalização.",
  },
  {
    pergunta: "Como eu pago?",
    resposta:
      "PIX, boleto ou cartão em até 12 vezes, processado pelo Asaas. Você paga a estrutura uma vez. A configuração pela equipe (+ R$ 200,00) só entra se você escolher na contratação.",
  },
  {
    pergunta: "Tem mensalidade de site?",
    resposta:
      "Não há mensalidade de site. Pague uma vez pela estrutura. Depois, a renovação anual do domínio é à parte (primeiro ano já incluso na compra).",
  },
  {
    pergunta: "Quanto tempo o domínio da página fica no ar?",
    resposta:
      "O primeiro ano do domínio já está incluso na compra. Depois, a renovação é anual — o valor do provedor pode mudar. Hoje costuma ficar em torno de R$ 40,00/ano no registrador, ou com o time GuiX.net mediante orçamento.",
  },
  {
    pergunta: "E se eu já tiver um Instagram ou WhatsApp funcionando?",
    resposta:
      "Melhor ainda. O site e a agenda organizam o que hoje vive só no chat: horário marcado, serviços claros e confirmação no WhatsApp da empresa.",
  },
  {
    pergunta: "Posso ver exemplos antes de contratar?",
    resposta:
      "Sim. Na página inicial há demonstrações dos modelos padrão (barbearia, salão, estética, pet shop, academia, contabilidade e advocacia). Em Clientes e nos preços você vê casos reais por faixa: MEI em Dia (Presença Avançada, R$ 1.499,90) e MOROX (Presença Personalizada, a partir de R$ 2.999,90). Também dá para montar seu próprio teste em Prototipar, sem pagar.",
  },
  {
    pergunta: "O que acontece depois que eu contrato?",
    resposta:
      "Com o pagamento confirmado e os dados completos, em até 24 horas domínio, e-mail, site, agenda e WhatsApp entram no ar. O painel passa a ser seu. Se você já tinha um site de teste salvo, usamos esse rascunho na publicação.",
  },
];

export function Faq() {
  const [aberta, setAberta] = useState(0);

  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      {perguntas.map((item, indice) => {
        const abertaAgora = aberta === indice;
        return (
          <div key={item.pergunta} className={indice > 0 ? "border-t border-line" : undefined}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition hover:bg-[#F8FAFC] sm:px-8 sm:py-6"
              aria-expanded={abertaAgora}
              onClick={() => setAberta(abertaAgora ? -1 : indice)}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <span className="mt-2 block text-base font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-lg">
                  {item.pergunta}
                </span>
              </span>
              <span
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-medium transition ${
                  abertaAgora ? "border-accent bg-accent text-white" : "border-line bg-white text-accent"
                }`}
                aria-hidden="true"
              >
                {abertaAgora ? "–" : "+"}
              </span>
            </button>
            {abertaAgora ? (
              <p className="max-w-4xl px-6 pb-6 text-[15px] leading-7 text-slate-600 sm:px-8 sm:pb-7">{item.resposta}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
