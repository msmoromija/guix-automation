function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não definida");
  return key;
}

const SISTEMA_GERAR = [
  "Você é redator comercial da Guix (guix.net.br), empresa brasileira de criação e desenvolvimento de sites.",
  "Escreva a seção de elaboração de um ORÇAMENTO COMERCIAL em português do Brasil, claro e profissional.",
  "NÃO invente preços, descontos, prazos em dias, CNPJ, telefone ou dados pessoais que não estejam na mensagem.",
  "NÃO invente funcionalidades que o cliente não pediu; interprete o pedido e organize o escopo de forma estruturada.",
  "Use o formato abaixo (sem markdown, sem cercas de código):",
  "",
  "ORÇAMENTO COMERCIAL",
  "",
  "[Título curto do projeto]",
  "",
  "GUIX.NET.BR – Desenvolvimento de Soluções Digitais",
  "",
  "1. OBJETIVO DO PROJETO",
  "[1–3 parágrafos]",
  "",
  "2. FUNCIONALIDADES DO PORTAL (ou DO SITE)",
  "[Itens numerados; cada um com subtítulo e bullets com hífen]",
  "",
  "3. BENEFÍCIOS DA SOLUÇÃO",
  "[Bullets com hífen]",
  "",
  "Se o cliente pediu site institucional simples, adapte títulos (SITE em vez de PORTAL) sem forçar complexidade.",
  "Responda SOMENTE com o texto da elaboração, pronto para colar no orçamento.",
].join("\n");

const SISTEMA_CORRIGIR = [
  "Você é redator comercial da Guix (guix.net.br).",
  "Revise o texto de elaboração de orçamento conforme a instrução do comercial.",
  "Mantenha português do Brasil, tom profissional e estrutura de ORÇAMENTO COMERCIAL.",
  "NÃO invente preços, descontos ou prazos. NÃO invente escopo que não esteja no texto ou na instrução.",
  "Responda SOMENTE com o texto revisado completo, sem markdown e sem explicações.",
].join(" ");

async function completarTexto(sistema: string, user: string, temperature: number) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature,
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI: ${res.status} ${err.slice(0, 240)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = String(data.choices?.[0]?.message?.content || "").trim();
  if (!raw) throw new Error("OpenAI: resposta vazia");
  return raw.replace(/^```(?:text|markdown)?\s*/i, "").replace(/\s*```$/, "").trim();
}

/** Gera a elaboração comercial a partir da mensagem colada do cliente. */
export async function gerarElaboracaoOrcamento(opts: {
  mensagemCliente: string;
  titulo?: string;
  clienteNome?: string;
}) {
  const mensagem = opts.mensagemCliente.trim();
  if (mensagem.length < 20) throw new Error("Cole a mensagem do cliente (pelo menos 20 caracteres).");
  const user = [
    opts.titulo?.trim() ? `Título do orçamento: ${opts.titulo.trim()}` : "",
    opts.clienteNome?.trim() ? `Cliente / negócio: ${opts.clienteNome.trim()}` : "",
    "",
    "Mensagem do cliente:",
    mensagem.slice(0, 12000),
  ]
    .filter(Boolean)
    .join("\n");
  return completarTexto(SISTEMA_GERAR, user, 0.45);
}

/** Corrige ou ajusta a elaboração já gerada, com pedido do comercial. */
export async function corrigirElaboracaoOrcamento(opts: {
  textoAtual: string;
  instrucao: string;
}) {
  const texto = opts.textoAtual.trim();
  const instrucao = opts.instrucao.trim();
  if (texto.length < 20) throw new Error("Não há texto de elaboração para corrigir.");
  if (instrucao.length < 3) throw new Error("Digite o que deve ser corrigido ou alterado.");
  const user = [
    "Instrução do comercial:",
    instrucao.slice(0, 2000),
    "",
    "Texto atual:",
    texto.slice(0, 14000),
  ].join("\n");
  return completarTexto(SISTEMA_CORRIGIR, user, 0.35);
}
