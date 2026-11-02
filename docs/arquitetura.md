# Arquitetura dos templates

Contrato congelado na versão **1.0.0**. Todo nicho usa este formato. Barbearia, salão e estética mudam conteúdo, fotos e pele visual. A estrutura de arquivos, as rotas, as seções, os nomes dos campos e os atributos de automação permanecem os mesmos.

Os três prompts para colar no Lovable são `prompts/lovable-barbearia.prompt.txt`, `prompts/lovable-salao.prompt.txt` e `prompts/lovable-estetica.prompt.txt`. O conteúdo de cada um está em `exemplos/`. Guix, a marca do site de venda, fica descrita em `docs/guix.md` e só é montada depois que esses protótipos entrarem em `prototipos/`.

## Decisão

O Lovable, nesta etapa, prototipa a vitrine e o fluxo de agendamento. Ele não cria o sistema operacional do negócio.

O arquivo `site.json` é o produto configurável. O painel administrativo, quando existir, só edita esse JSON. A implantação futura só troca esse JSON e os arquivos de imagem. Por isso o protótipo já nasce lendo uma única fonte, em vez de espalhar textos pelo JSX.

Um projeto Lovable equivale a um nicho. Misturar barbearia e salão no mesmo projeto quebra a comparação entre peles e gasta crédito refazendo layout.

## O que o protótipo entrega

- Site público em português, com a ordem de seções fixa.
- Tema aplicado por variáveis CSS lidas do JSON.
- Agenda em uma página, com horários vindos do expediente.
- Confirmação pelo WhatsApp, com a mensagem montada no navegador.
- Formulário de contato que também abre o WhatsApp.
- Página de privacidade com texto vindo do JSON.
- Quatro rotas, e só essas.

A confirmação pelo WhatsApp é o comportamento de venda desta versão. O dono da barbearia vê o horário escolhido e a mensagem pronta. Não há banco, login nem painel.

## O que fica fora

Estes itens entram depois, fora do Lovable:

- Painel administrativo.
- Supabase, autenticação e banco.
- Domínio, DNS, e-mail corporativo, Vercel, Resend e Zoho.
- Biblioteca de imagens no Cloudflare R2 e escolha de fotos por IA.
- Provisionamento (`deploy-client`).
- Pagamento.
- Blog, páginas extras e seções novas.

Se o Lovable oferecer conectar banco ou login, a resposta é recusar. Esses cinco créditos servem para a vitrine obedecer ao contrato.

## Rotas

| Rota | Função |
| --- | --- |
| `/` | Home com todas as seções |
| `/agendar` | Escolha de serviço, profissional, dia e horário |
| `/privacidade` | Texto de privacidade |
| `/obrigado` | Confirmação visual antes de abrir o WhatsApp |

A home também responde às âncoras `#inicio`, `#sobre`, `#servicos`, `#profissionais`, `#diferenciais`, `#promocoes`, `#eventos`, `#galeria`, `#faq` e `#contato`.

`/agendar` aceita `?servico=srv_corte` e `?profissional=pro_caio` para já marcar a escolha feita num card.

## Ordem das seções

1. Cabeçalho
2. Hero (`id="inicio"`)
3. Sobre
4. Serviços
5. Profissionais
6. Diferenciais
7. Promoções
8. Eventos
9. Galeria
10. FAQ
11. Contato
12. Rodapé

O menu do cabeçalho não lista as onze seções. Ele lista só: início, sobre, serviços, profissionais, promoções, dúvidas e contato. Diferenciais, eventos e galeria aparecem na rolagem. Um menu com tudo vira uma barra ilegível no celular, que é onde a venda acontece.

Promoções, eventos e galeria somem da página quando `itens` vier vazio. As outras seções da home permanecem. Assim um nicho sem evento não ganha uma seção nova nem um buraco com título vazio.

## Contrato de dados

A fonte da verdade é `src/content/site.json`, no formato de `exemplos/barbearia.site.json` e validado por `schema/site.schema.json`. Os tipos estão em `schema/site.types.ts`.

Telefone, WhatsApp, e-mail, endereço, redes e expediente existem uma vez, em `empresa`. A seção de contato só guarda título e rótulos do formulário. O rodapé lê `empresa` para nome, CNPJ, telefone e redes. Isso evita o mesmo número escrito em três campos que depois divergem.

Cada item repetível tem `id` estável:

| Coleção | Prefixo | Exemplo |
| --- | --- | --- |
| Serviço | `srv_` | `srv_corte` |
| Profissional | `pro_` | `pro_caio` |
| Diferencial | `dif_` | `dif_horario` |
| Promoção | `prm_` | `prm_terca` |
| Evento | `evt_` | `evt_classica` |
| Foto da galeria | `gal_` | `gal_01` |
| Pergunta | `faq_` | `faq_agendar` |
| Imagem | `img_` | `img_hero` |

Preço e duração têm número e rótulo. A tela mostra `preco_label` e `duracao_label`. O número fica para a automação futura filtrar e recalcular o rótulo.

WhatsApp da empresa guarda só dígitos, com DDI 55. O rótulo com parênteses é outro campo. Profissional com `whatsapp` vazio usa o número da empresa.

Imagem é sempre um objeto `{ id, src, alt, categoria }`. No protótipo, `src` pode ser uma URL. Na implantação, `src` passa a ser um caminho de arquivo (`assets/img_hero.jpg`). O componente usa `src` como vier, sem assumir Unsplash.

`alt` nunca fica vazio. Logo sem `src` vira o nome da empresa em texto, sem imagem quebrada. Mapa sem `mapa_embed_url` não renderiza iframe.

## Atributos para a automação

O visual pode mudar. Estes atributos não.

| Atributo | Uso |
| --- | --- |
| `data-section` | `header`, `hero`, `sobre`, `servicos`, `profissionais`, `diferenciais`, `promocoes`, `eventos`, `galeria`, `faq`, `contato`, `rodape` |
| `data-field` | Caminho do texto, como `hero.titulo` ou `empresa.nome` |
| `data-component` | `card_servico`, `card_profissional`, `card_diferencial`, `card_promocao`, `card_evento`, `card_galeria`, `item_faq` |
| `data-item-id` | O `id` do item |
| `data-action` | `agendar`, `whatsapp`, `enviar_contato`, `confirmar_agendamento` |

Os `name` dos campos de formulário também ficam fixos: `servico_id`, `profissional_id`, `data`, `horario`, `nome`, `telefone`, `email`, `observacao`, `mensagem`.

A opção “sem preferência” usa o id constante `qualquer`. Ela não entra na lista de profissionais, porque profissional tem foto e cargo.

## Tema

O JSON define sete cores, duas fontes e um raio. `src/theme/applyTheme.ts` copia isso para variáveis no `documentElement` antes do primeiro render:

- `--color-primary`
- `--color-secondary`
- `--color-accent`
- `--color-background`
- `--color-surface`
- `--color-text`
- `--color-text-muted`
- `--font-heading`
- `--font-body`
- `--radius`

Componente não contém hex. Borda usa token existente ou `color-mix` desses tokens. Na barbearia, o botão principal usa fundo `color_accent` e texto `color_background`, porque o fundo da página é escuro. No salão e na estética o fundo é claro, então o texto do botão principal usa `color_primary`. Botão secundário é transparente, com borda `color_secondary`.

As duas cores a mais em relação ao rascunho anterior (`color_surface` e `color_text_muted`) existem para cartão e texto secundário não inventarem hex no meio do componente.

Fontes vêm do Google Fonts, somente as duas famílias citadas em `tema`.

Ícones de diferenciais saem de uma lista fechada, mapeada num único arquivo para os ícones do Lucide. Nome desconhecido cai em `star`.

## Agenda e contato

A agenda é um formulário único, não um assistente de cinco telas. A ordem dos grupos é serviço, profissional, dia, horário, dados.

O dia é um `input type="date"`. O valor `YYYY-MM-DD` vira data local com `new Date(ano, mês - 1, dia)`, para o fuso não empurrar o dia para trás. O dia da semana consulta `empresa.expediente`. Dia ausente mostra `agendamento.fechado` e não lista horários. Dia presente lista `intervalos` daquele dia. Não há horário ocupado fictício.

O envio não grava em servidor. Ele guarda o pedido em `sessionStorage`, na chave `presenca.lead`, navega para `/obrigado` e o botão abre `https://wa.me/{digitos}?text=...`.

Mensagem de agendamento:

```text
Olá, quero agendar: {serviço} com {profissional ou "sem preferência"} em {dd/mm/aaaa} às {hh:mm}. Meu nome é {nome}. WhatsApp: {telefone}. {observação se houver}
```

Mensagem de contato:

```text
Olá, meu nome é {nome}. WhatsApp: {telefone}. {mensagem}
```

Botões genéricos de WhatsApp, como o do hero e o flutuante, usam `empresa.whatsapp_mensagem`.

O botão flutuante fica fixo no canto inferior direito, com `aria-label` vindo de `empresa.whatsapp_aria`, sem cobrir o menu.

## Pele da barbearia

Esta direção vale só para `barbearia-v1`. O próximo nicho troca este bloco e o JSON, e mantém o resto.

Fundo quase preto, superfície grafite, texto marfim, detalhe latão. Título condensado, corpo limpo. Hero com foto grande e título por cima, ocupando a primeira tela no celular. Pouca sombra, borda fina, cantos curtos. Sem gradiente roxo, sem ilustração de aplicativo, sem ícone 3D, sem vídeo.

A interface inteira cabe no celular, porque a demonstração de venda abre no telefone da barbearia.

## O que cada nicho muda

| Nicho | `template_id` | Quando | Pele | Voz |
| --- | --- | --- | --- | --- |
| Barbearia | `barbearia-v1` | agora | escuro, editorial, latão | frases curtas e concretas |
| Salão de beleza | `salao-v1` | depois que a barbearia passar no checklist | claro, quente, elegante | acolhedor, sem diminutivo forçado |
| Estética | `estetica-v1` | em seguida | muito claro, bastante respiro | calmo, específico, sem promessa médica |
| Pet shop | `petshop-v1` | pronto para colar | claro, areia e verde escuro | concreto, sem clínica veterinária |
| Academia | `academia-v1` | pronto para colar | escuro, com verde-limão pálido | aula e avaliação, sem promessa de emagrecimento |
| Contabilidade | `contabilidade-v1` | pronto para colar | papel, azul-marinho | reunião marcada, sem promessa fiscal |
| Advocacia | `advocacia-v1` | pronto para colar | marfim, bordô, cantos retos | consulta, sem promessa de resultado |

Pacote de salão é um item de `servicos`, com preço e duração. Antes e depois de estética é item de `galeria`. Nenhum dos dois ganha seção ou entidade nova.

Clínica médica fica fora deste template. O ticket e a expectativa de páginas, especialidades e responsabilidade são outros. Estética permanece no contrato. Imobiliária também fica fora: lista de imóveis não cabe em serviço com duração.

A demonstração de contabilidade é o escritório fictício Lima. Ela não copia o cliente real que já usa o sistema. Advocacia não publica número de OAB.

## Ajustes em relação ao prompt anterior

O rascunho longo de campos soltos (`hero_titulo`, `contato_telefone`) foi substituído por este JSON aninhado. Os caminhos `data-field` seguem o aninhamento (`hero.titulo`).

Eventos entrou na ordem, entre promoções e galeria, porque já faz parte da oferta vendida. Incluir agora custa uma seção. Incluir depois de doze templates custa uma migração.

A agenda deixou de ser só um botão. Sem a página `/agendar`, a demonstração mostra um site e não o produto.

O painel não entra no protótipo. Com cinco créditos, um painel falso criaria outra estrutura de campos.

## Pacote futuro de implantação

Quando a automação existir, o ZIP usa este mesmo JSON:

```text
cliente.zip
  config/site.json
  assets/img_hero.jpg
  assets/img_logo.png
```

O comando de preview e o comando de deploy leem `schema_version`. Versão diferente interrompe o processo em vez de publicar um template pela metade. Enquanto a versão for `1.0.0`, barbearia, salão e estética continuam compatíveis.

## Árvore que o Lovable deve gerar

```text
src/content/site.json
src/content/site.types.ts
src/theme/applyTheme.ts
src/lib/whatsapp.ts
src/lib/expediente.ts
src/lib/lead.ts
src/components/Header.tsx
src/components/HeroSection.tsx
src/components/SobreSection.tsx
src/components/ServicosSection.tsx
src/components/ProfissionaisSection.tsx
src/components/DiferenciaisSection.tsx
src/components/PromocoesSection.tsx
src/components/EventosSection.tsx
src/components/GaleriaSection.tsx
src/components/FaqSection.tsx
src/components/ContatoSection.tsx
src/components/Rodape.tsx
src/components/WhatsappFlutuante.tsx
src/components/Seo.tsx
src/pages/HomePage.tsx
src/pages/AgendarPage.tsx
src/pages/PrivacidadePage.tsx
src/pages/ObrigadoPage.tsx
```

A home só compõe essas seções, nesta ordem. Texto de marketing mora no JSON.

O starter do Lovable manda na ferramenta de build. Se vier Vite, as rotas usam React Router. Se vier Next.js, as mesmas quatro rotas usam o App Router. Não vale migrar de um framework para o outro.

## Checklist depois do download

Abrir o projeto e conferir, nesta ordem:

1. `src/content/site.json` tem `schema_version` `1.0.0` e as mesmas chaves do exemplo. Chave renomeada é defeito, mesmo com a tela bonita.
2. Alterar `hero.titulo` no JSON muda o hero sem editar componente.
3. Não existe hex de cor dentro de componente.
4. As rotas são só `/`, `/agendar`, `/privacidade` e `/obrigado`.
5. A home mostra as seções na ordem definida, e o menu não inventa item.
6. Card de serviço abre `/agendar` com o serviço marcado.
7. Um dia que não está em `empresa.expediente` mostra o texto de fechado e nenhum horário. Na barbearia e na estética, segunda é fechada. No salão, segunda abre e domingo fecha.
8. Um dia presente no expediente lista só os intervalos daquele dia.
9. Confirmar grava `presenca.lead` e abre WhatsApp com serviço, dia e nome.
10. Contato faz o mesmo com a mensagem livre.
11. Logo vazio mostra o nome, mapa vazio não mostra iframe, rede com URL vazia não aparece.
12. A tela não contém lorem, inglês de interface, “líder de mercado”, login, painel ou chamada de banco.
13. No celular, o hero cabe na primeira tela, o menu abre, e o botão de WhatsApp não tampa o conteúdo principal.

Se a estrutura estiver certa e o visual estiver cru, o ajuste é local, neste repositório. Se as chaves tiverem sido rebatizadas, o protótipo não serve de matriz e o caminho é gerar de novo com o mesmo prompt, não remendar doze nomes à mão.

## Ordem daqui para frente

A barbearia já está numa conta do Lovable e parou por falta de crédito. Quando o crédito voltar, use Retomar nesse mesmo projeto. Não comece a barbearia de novo em outra conta.

Cada conta gratuita recebe um nicho, num projeto vazio. Cole o arquivo inteiro uma vez. Recuse banco, login e Supabase. Confira se o final da colagem ainda tem `SITE_JSON_END`.

1. Salão: `prompts/lovable-salao.prompt.txt`
2. Estética: `prompts/lovable-estetica.prompt.txt`
3. Pet shop: `prompts/lovable-petshop.prompt.txt`
4. Academia: `prompts/lovable-academia.prompt.txt`
5. Contabilidade: `prompts/lovable-contabilidade.prompt.txt`
6. Advocacia: `prompts/lovable-advocacia.prompt.txt`

Quando cada um terminar, baixe o código para a pasta correspondente em `prototipos/`. O site de venda da Guix continua neste repositório, e não vira um projeto do Lovable. Clínica médica e imobiliária não entram nesta leva.
