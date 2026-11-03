"use client";

import { useState } from "react";

const perguntas = [
  {
    pergunta: "Quanto tempo leva para ficar pronto?",
    resposta:
      "Até 24 horas depois que as informações do negócio chegam completas. Nome, serviços, horários, contatos e preferências precisam estar claros. Se faltar um dado essencial, o prazo só começa quando ele é enviado — assim a publicação não sai incompleta.",
  },
  {
    pergunta: "Eu preciso saber de tecnologia?",
    resposta:
      "Não. Você envia o que o negócio já sabe: nome, serviços, horários, cores e WhatsApp. O GuiX.net configura domínio, e-mail, site, agenda e integração com WhatsApp. Depois, o painel é feito para mudanças do dia a dia, sem código e sem chamar agência a cada ajuste.",
  },
  {
    pergunta: "O que exatamente entra na entrega?",
    resposta:
      "Domínio próprio, e-mail profissional no mesmo domínio, site responsivo com a cara do seu segmento, agenda online para o cliente marcar sozinho e WhatsApp no número da empresa para confirmações e conversa. Tudo isso entra junto na publicação.",
  },
  {
    pergunta: "Posso mudar textos, horários e serviços depois?",
    resposta:
      "Sim. Depois da publicação o painel fica com você. Dá para alterar horários, serviços, textos e conteúdos sem abrir chamado para uma agência. O site continua no ar enquanto você atualiza o essencial do negócio.",
  },
  {
    pergunta: "O domínio fica no meu nome?",
    resposta:
      "Sim. O domínio é do seu negócio, com o nome que você escolher, dentro das regras de disponibilidade e registro. Não ficamos com um endereço genérico de plataforma: o cliente digita o nome da empresa e chega na página certa.",
  },
  {
    pergunta: "Vocês usam inteligência artificial?",
    resposta:
      "Sim. A IA prepara textos, estrutura, agenda e WhatsApp a partir do que você enviou — é o caminho padrão, mais rápido. Se preferir que a nossa equipe configure sem IA, existe a opção na contratação com taxa de R$ 200,00.",
  },
  {
    pergunta: "Qual a diferença entre Presença Completa, Avançada e Personalizada?",
    resposta:
      "Presença Completa (R$ 499,90): para serviços com modelo padrão — barbearias, salões, estética, pet shops, academias, contabilidade e advocacia. Inclui site, agenda básica, WhatsApp, domínio e e-mail. Presença Avançada (R$ 1.499,90): para negócios médios que precisam de mais estrutura, como imobiliárias, consultórios menores e operações com catálogo ou agenda mais organizada — inclui estrutura própria do segmento. Presença Personalizada (a partir de R$ 2.999,90): para operação mais complexa ou personalização maior — clínicas e consultórios com equipe, imobiliárias com catálogo robusto, escolas, estúdios com múltiplos serviços, empresas com fluxos próprios etc. O valor final depende do nível de personalização necessário.",
  },
  {
    pergunta: "Como eu pago?",
    resposta:
      "PIX, boleto ou cartão em até 12 vezes. O pagamento é processado pelo Asaas. Não inventamos taxa escondida de site: você paga a estrutura uma vez. A opção de configuração pela equipe (+ R$ 200,00) só entra se você escolher na contratação.",
  },
  {
    pergunta: "Tem mensalidade de site?",
    resposta:
      "Não há pagamento mensal. Pague uma vez pelo site e anualmente um valor específico para manter o domínio da página.",
  },
  {
    pergunta: "Quanto tempo o domínio da página fica no ar?",
    resposta:
      "O primeiro ano do domínio já está incluso na compra inicial. Depois, a renovação é anual — o valor do provedor pode sofrer alteração a cada ano. Essa taxa mantém o domínio no ar e é paga direto ao registrador (hoje em torno de R$ 40,00/ano) ou, se preferir, com o time GuiX.net mediante orçamento. Os dados atualizados passam pelo suporte.",
  },
  {
    pergunta: "E se eu já tiver um Instagram ou WhatsApp funcionando?",
    resposta:
      "Melhor ainda. O site e a agenda organizam o que hoje vive só no chat: horário marcado, serviços claros e confirmação no WhatsApp da empresa. O GuiX.net não substitui o atendimento humano — ele tira a bagunça de marcar horário e dá um endereço profissional para o cliente chegar.",
  },
  {
    pergunta: "Posso ver exemplos antes de contratar?",
    resposta:
      "Sim. Na página inicial tem demonstrações públicas de barbearia, salão, estética, pet shop, academia, contabilidade e advocacia. São modelos reais do mesmo sistema, cada um com a cara do segmento — sem compromisso para você olhar.",
  },
  {
    pergunta: "O que acontece depois que eu contrato?",
    resposta:
      "Você envia as informações do negócio. A IA e o sistema configuram a estrutura (ou a equipe, se você escolheu essa opção). Em até 24 horas, com os dados completos, domínio, e-mail, site, agenda e WhatsApp entram no ar. Aí o painel passa a ser seu.",
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
