const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const base = fs.readFileSync(path.join(root, "prompts/lovable-barbearia.prompt.txt"), "utf8");
const start = base.indexOf("FONTE ÚNICA DE CONTEÚDO");
const end = base.indexOf("CRITÉRIO DE PRONTO");
if (start < 0 || end < 0) {
  throw new Error("Não achei o miolo do prompt da barbearia.");
}

let shared = base.slice(start, end);
shared = shared.replace(
  "Raio sm significa cantos curtos, em torno de 2px a 4px.",
  "radius none = 0, sm = 2px a 4px, md = 8px, lg = 16px. Use o valor de site.tema.radius."
);

const niches = [
  {
    json: "exemplos/salao.site.json",
    out: "prompts/lovable-salao.prompt.txt",
    head: `Você vai criar um protótipo de site profissional para um salão de beleza. Faça tudo nesta resposta. Não divida em etapas, não faça perguntas e não proponha um painel administrativo.

Este projeto é uma vitrine de um sistema que depois será automatizado. A liberdade criativa existe só no desenho visual, dentro da direção indicada abaixo. Estrutura, nomes de arquivo, chaves do JSON, rotas, ordem das seções e atributos de dados são especificação. Desviar isso é erro.

Se alguma ideia visual conflitar com o contrato de dados, o contrato vence.

Não conecte banco, Supabase, autenticação, login, pagamento ou armazenamento externo. Não crie painel, blog, loja, área do cliente nem página além das quatro rotas. Não instale biblioteca nova se o starter já resolver o caso. Pode usar React Router se o starter for Vite e ainda não tiver rota. Se o starter for Next.js, use o App Router e não migre para Vite. Não troque de framework.

Não escreva a palavra Guix em lugar nenhum. Este site é o Salão Vila Flor, não o site da empresa que vende o sistema.

Interface em português do Brasil. Identificadores de código em inglês, como estão neste prompt. html lang="pt-BR".

---

DIREÇÃO VISUAL, SOMENTE DESTE SALÃO

Fundo claro e quente, quase linho. Superfície branca. Texto marrom escuro. Detalhe em terracota e areia. Título com a fonte de heading, serifada e elegante. Corpo com a fonte de body. Hero com fotografia grande e o título sobre a imagem, legível no celular sem rolagem longa. Muito respiro, pouca sombra, borda fina.

O botão principal usa fundo color_accent e texto color_primary. Não use color_background no texto do botão: o fundo da página é claro e o texto sumiria. O botão secundário é transparente, com borda color_secondary e texto color_primary.

Proibido: visual escuro de barbearia, gradiente roxo, visual de software genérico, ilustração cartoon, ícone 3D, vídeo, carrossel automático, texto em inglês, lorem ipsum e frase vazia do tipo "líder de mercado", "excelência" ou "tradição e modernidade".

O celular é a tela principal. A demonstração será aberta num telefone.`,
    criteria: `CRITÉRIO DE PRONTO

O projeto abre na home do Salão Vila Flor, em português, sem login.
Existem só as quatro rotas.
site.json conserva as chaves do JSON abaixo.
Trocar um texto no JSON troca a tela.
Não há cor hexadecimal em componente.
O botão principal tem texto escuro sobre o fundo areia.
Agendar a partir de um serviço já traz esse serviço selecionado.
Domingo não oferece horário. Segunda-feira oferece os horários do JSON.
Confirmar o agendamento leva a /obrigado e o WhatsApp abre com serviço, data e nome.
A página funciona no celular.
A palavra Guix não aparece.
`,
  },
  {
    json: "exemplos/estetica.site.json",
    out: "prompts/lovable-estetica.prompt.txt",
    head: `Você vai criar um protótipo de site profissional para um estúdio de estética. Faça tudo nesta resposta. Não divida em etapas, não faça perguntas e não proponha um painel administrativo.

Este projeto é uma vitrine de um sistema que depois será automatizado. A liberdade criativa existe só no desenho visual, dentro da direção indicada abaixo. Estrutura, nomes de arquivo, chaves do JSON, rotas, ordem das seções e atributos de dados são especificação. Desviar isso é erro.

Se alguma ideia visual conflitar com o contrato de dados, o contrato vence.

Não conecte banco, Supabase, autenticação, login, pagamento ou armazenamento externo. Não crie painel, blog, loja, área do cliente nem página além das quatro rotas. Não instale biblioteca nova se o starter já resolver o caso. Pode usar React Router se o starter for Vite e ainda não tiver rota. Se o starter for Next.js, use o App Router e não migre para Vite. Não troque de framework.

Não escreva a palavra Guix em lugar nenhum. Este site é o Estúdio Serra Clara, não o site da empresa que vende o sistema.

Não crie seção de antes e depois. Não cite procedimento médico. Não use as palavras botox, preenchimento, harmonização, diagnóstico ou dermatologista. As profissionais são esteticistas e massoterapeuta.

Interface em português do Brasil. Identificadores de código em inglês, como estão neste prompt. html lang="pt-BR".

---

DIREÇÃO VISUAL, SOMENTE DESTE ESTÚDIO

Fundo muito claro, levemente esverdeado, com bastante área em branco. Superfície branca. Texto verde bem escuro. Detalhe em sálvia e areia. Título com a fonte de heading. Corpo com a fonte de body. Hero com fotografia grande, silenciosa, e o título sobre a imagem, legível no celular. Cantos médios, pouca sombra, muito respiro entre as seções.

O botão principal usa fundo color_accent e texto color_primary. Não use color_background no texto do botão: o fundo da página é claro e o texto sumiria. O botão secundário é transparente, com borda color_secondary e texto color_primary.

Proibido: visual escuro de barbearia, rosa choque, gradiente roxo, visual de software genérico, ilustração cartoon, ícone 3D, vídeo, carrossel automático, texto em inglês, lorem ipsum e frase vazia do tipo "líder de mercado", "excelência", "rejuvenescimento garantido" ou "resultado clínico".

O celular é a tela principal. A demonstração será aberta num telefone.`,
    criteria: `CRITÉRIO DE PRONTO

O projeto abre na home do Estúdio Serra Clara, em português, sem login.
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
Não existe menção a botox, preenchimento ou procedimento médico.
`,
  },
];

for (const niche of niches) {
  const json = fs.readFileSync(path.join(root, niche.json), "utf8").trim();
  const out =
    niche.head +
    "\n\n---\n\n" +
    shared +
    niche.criteria +
    "\nSITE_JSON_START\n" +
    json +
    "\nSITE_JSON_END\n";
  const outPath = path.join(root, niche.out);
  fs.writeFileSync(outPath, out);
  const embedded = out
    .slice(out.lastIndexOf("SITE_JSON_START") + "SITE_JSON_START".length, out.lastIndexOf("SITE_JSON_END"))
    .trim();
  if (JSON.stringify(JSON.parse(embedded)) !== JSON.stringify(JSON.parse(json))) {
    throw new Error("JSON divergiu em " + niche.out);
  }
  console.log(niche.out, Buffer.byteLength(out));
}
