const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const base = fs.readFileSync(path.join(root, "prompts/lovable-barbearia.prompt.txt"), "utf8");
const start = base.indexOf("FONTE ÚNICA DE CONTEÚDO");
const end = base.indexOf("CRITÉRIO DE PRONTO");
if (start < 0 || end < 0) throw new Error("Não achei o miolo do prompt da barbearia.");

let shared = base.slice(start, end);
shared = shared.replace(
  "Raio sm significa cantos curtos, em torno de 2px a 4px.",
  "radius none = 0, sm = 2px a 4px, md = 8px, lg = 16px. Use o valor de site.tema.radius."
);

function head({ abertura, nome, proibicoes, visual }) {
  return `Você vai criar um protótipo de site profissional para ${abertura}. Faça tudo nesta resposta. Não divida em etapas, não faça perguntas e não proponha um painel administrativo.

Este projeto é uma vitrine de um sistema que depois será automatizado. A liberdade criativa existe só no desenho visual, dentro da direção indicada abaixo. Estrutura, nomes de arquivo, chaves do JSON, rotas, ordem das seções e atributos de dados são especificação. Desviar isso é erro.

Se alguma ideia visual conflitar com o contrato de dados, o contrato vence.

Não conecte banco, Supabase, autenticação, login, pagamento ou armazenamento externo. Não crie painel, blog, loja, carrinho, área do cliente nem página além das quatro rotas. Não instale biblioteca nova se o starter já resolver o caso. Pode usar React Router se o starter for Vite e ainda não tiver rota. Se o starter for Next.js, use o App Router e não migre para Vite. Não troque de framework.

Não escreva a palavra Guix em lugar nenhum. Este site é ${nome}, não o site da empresa que vende o sistema.

${proibicoes}

Interface em português do Brasil. Identificadores de código em inglês, como estão neste prompt. html lang="pt-BR".

---

DIREÇÃO VISUAL

${visual}

O celular é a tela principal. A demonstração será aberta num telefone.`;
}

function criteria(linhas) {
  return `CRITÉRIO DE PRONTO

${linhas.trim()}
`;
}

const niches = [
  {
    json: "exemplos/petshop.site.json",
    out: "prompts/lovable-petshop.prompt.txt",
    head: head({
      abertura: "um pet shop de banho e tosa",
      nome: "o Pet Shop Bento",
      proibicoes:
        "Não crie clínica veterinária, vacina, remédio, consulta clínica, venda de ração nem catálogo de produtos. O site é só banho, tosa e corte de unhas com hora marcada. Sem desenho infantil e sem mascote cartoon.",
      visual: `Fundo claro, quase areia. Superfície branca. Texto verde bem escuro. Detalhe em terracota e areia dourada. Título com a fonte de heading. Corpo com a fonte de body. Hero com fotografia grande de cachorro e o título sobre a imagem, legível no celular.

O botão principal usa fundo color_accent e texto color_primary. Não use color_background no texto do botão: o fundo da página é claro e o texto sumiria. O botão secundário é transparente, com borda color_secondary e texto color_primary.

Proibido: visual escuro de barbearia, rosa choque, gradiente roxo, ilustração de patinha cartoon, ícone 3D, vídeo, carrossel automático, texto em inglês e lorem ipsum.`,
    }),
    criteria: criteria(`
O projeto abre na home do Pet Shop Bento, em português, sem login.
Existem só as quatro rotas.
site.json conserva as chaves do JSON abaixo.
Trocar um texto no JSON troca a tela.
Não há cor hexadecimal em componente.
O botão principal tem texto escuro sobre o fundo areia.
Agendar a partir de um serviço já traz esse serviço selecionado.
Segunda-feira não oferece horário. Terça-feira oferece os horários do JSON.
Confirmar o agendamento leva a /obrigado e o WhatsApp abre com serviço, data e nome.
A página funciona no celular.
A palavra Guix não aparece.
Não existe vacina, clínica veterinária nem loja de produtos.
`),
  },
  {
    json: "exemplos/academia.site.json",
    out: "prompts/lovable-academia.prompt.txt",
    head: head({
      abertura: "uma academia",
      nome: "a Academia Farol",
      proibicoes:
        "Não prometa perda de peso, não cite quilos, suplemento, anabolizante nem antes e depois. Não crie checkout de plano mensal. A agenda marca avaliação e aula acompanhada, como está no JSON.",
      visual: `Fundo quase preto, superfície grafite azulada, texto claro. O detalhe é um verde-limão pálido, diferente do latão da barbearia. Título condensado com a fonte de heading. Corpo com a fonte de body. Hero com fotografia grande da sala e o título sobre a imagem, legível no celular. Cantos curtos, pouca sombra.

O botão principal usa fundo color_accent e texto color_background. O fundo da página é escuro e o accent é claro, então o texto do botão fica escuro. O botão secundário é transparente, com borda color_secondary e texto color_text.

Proibido: copiar a barbearia latão, gradiente roxo, neon agressivo, ilustração cartoon, ícone 3D, vídeo, carrossel automático, texto em inglês e lorem ipsum.`,
    }),
    criteria: criteria(`
O projeto abre na home da Academia Farol, em português, sem login.
Existem só as quatro rotas.
site.json conserva as chaves do JSON abaixo.
Trocar um texto no JSON troca a tela.
Não há cor hexadecimal em componente.
O botão principal tem texto escuro sobre o fundo verde-limão.
Agendar a partir de um serviço já traz esse serviço selecionado.
Domingo não oferece horário. Segunda-feira oferece os horários do JSON, inclusive 06:00.
Confirmar o agendamento leva a /obrigado e o WhatsApp abre com serviço, data e nome.
A página funciona no celular.
A palavra Guix não aparece.
Não existe promessa de emagrecimento nem loja de suplemento.
`),
  },
  {
    json: "exemplos/contabilidade.site.json",
    out: "prompts/lovable-contabilidade.prompt.txt",
    head: head({
      abertura: "um escritório de contabilidade",
      nome: "a Lima Contabilidade",
      proibicoes:
        "Este escritório é fictício. Não copie outro escritório real. Não prometa redução de imposto, não ofereça venda de nota fiscal e não ensine a pagar menos tributo. A primeira conversa é sem custo, como está no JSON. A inscrição de MEI no governo permanece descrita como gratuita.",
      visual: `Fundo cinza muito claro, quase papel. Superfície branca. Texto azul-marinho. Detalhe bronze discreto. Título com a fonte de heading, serifada. Corpo com a fonte de body. Hero com fotografia de escritório e o título legível no celular. Cantos curtos, pouco enfeite, aparência de escritório e não de aplicativo.

O botão principal usa fundo color_accent e texto color_background. O accent é azul escuro e o background é claro, então o texto do botão fica claro. Não use color_primary no texto desse botão, porque ela é da mesma família do fundo do botão. O botão secundário é transparente, com borda color_secondary e texto color_primary.

Proibido: gradiente roxo, ilustração de moeda cartoon, ícone 3D, vídeo, carrossel automático, texto em inglês e lorem ipsum.`,
    }),
    criteria: criteria(`
O projeto abre na home da Lima Contabilidade, em português, sem login.
Existem só as quatro rotas.
site.json conserva as chaves do JSON abaixo.
Trocar um texto no JSON troca a tela.
Não há cor hexadecimal em componente.
O botão principal tem texto claro sobre o fundo azul escuro.
Agendar a partir de um serviço já traz esse serviço selecionado.
Sábado não oferece horário. Segunda-feira oferece os horários do JSON.
Confirmar o agendamento leva a /obrigado e o WhatsApp abre com serviço, data e nome.
A página funciona no celular.
A palavra Guix não aparece.
Não existe promessa de pagar menos imposto nem venda de nota.
`),
  },
  {
    json: "exemplos/advocacia.site.json",
    out: "prompts/lovable-advocacia.prompt.txt",
    head: head({
      abertura: "um escritório de advocacia",
      nome: "a Vale Luz Advogados",
      proibicoes:
        "Não dê conselho de como ganhar uma causa. Não prometa resultado. Não invente número de OAB. Não crie blog jurídico. A consulta orienta o próximo passo, como está no JSON. O preço do card é só da reunião.",
      visual: `Fundo marfim. Superfície branca. Texto quase preto. Detalhe bordô, usado com parcimônia. Título com a fonte de heading, serifada e sóbria. Corpo com a fonte de body. Cantos retos, porque radius é none. Hero com fotografia de escritório ou estante e o título legível no celular. Muito respiro, pouca sombra.

O botão principal usa fundo color_accent e texto color_background. O accent é bordô escuro e o background é claro, então o texto do botão fica claro. Não use color_primary no texto desse botão. O botão secundário é transparente, com borda color_secondary e texto color_primary.

Proibido: dourado de luxo, gradiente roxo, ilustração de martelo cartoon, ícone 3D, vídeo, carrossel automático, texto em inglês e lorem ipsum.`,
    }),
    criteria: criteria(`
O projeto abre na home da Vale Luz Advogados, em português, sem login.
Existem só as quatro rotas.
site.json conserva as chaves do JSON abaixo.
Trocar um texto no JSON troca a tela.
Não há cor hexadecimal em componente.
O botão principal tem texto claro sobre o fundo bordô.
Agendar a partir de um serviço já traz esse serviço selecionado.
Sábado não oferece horário. Segunda-feira oferece os horários do JSON.
Confirmar o agendamento leva a /obrigado e o WhatsApp abre com serviço, data e nome.
A página funciona no celular.
A palavra Guix não aparece.
Não existe número de OAB inventado nem promessa de ganhar a causa.
`),
  },
];

for (const niche of niches) {
  const json = fs.readFileSync(path.join(root, niche.json), "utf8").trim();
  const out = niche.head + "\n\n---\n\n" + shared + niche.criteria + "\nSITE_JSON_START\n" + json + "\nSITE_JSON_END\n";
  fs.writeFileSync(path.join(root, niche.out), out);
  const embedded = out
    .slice(out.lastIndexOf("SITE_JSON_START") + "SITE_JSON_START".length, out.lastIndexOf("SITE_JSON_END"))
    .trim();
  if (JSON.stringify(JSON.parse(embedded)) !== JSON.stringify(JSON.parse(json))) {
    throw new Error("JSON divergiu em " + niche.out);
  }
  console.log(niche.out, Buffer.byteLength(out));
}
