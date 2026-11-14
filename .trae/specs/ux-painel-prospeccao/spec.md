# Spec: UX do Painel de Prospecção

## Problema

O fluxo atual de prospecção exige muitos cliques: **Buscar → filtrar → gerar mensagem → copiar/abrir WhatsApp → marcar como enviado → anotar observação**. Além disso, há um bug de encoding nos acentos das mensagens (`Olï¿½` em vez de `Olá`), filtros pouco visíveis, e o histórico/status do lead só aparecem dentro do painel lateral.

## Usuários

- Time GuiX (operadores de prospecção) que usam o painel diariamente para buscar leads e enviar mensagens no WhatsApp.

## Objetivos

1. Reduzir o número de cliques para enviar uma mensagem (gerar + abrir WhatsApp + marcar como enviado em uma ação principal).
2. Eliminar o mojibake (acentos quebrados) nas mensagens geradas.
3. Tornar filtros rápidos sempre visíveis, com contagem, e persistir nicho/cidade da última busca.
4. Expor o status e o último contato diretamente na lista principal de leads.
5. Deixar o histórico do lead mais acessível.

## Não-objetivos (fora de escopo)

- Integração de envio pela WhatsApp Cloud API (o envio continua manual via link `wa.me`).
- Aumento de cota da Google Places API.
- Novos nichos ou templates de mensagem.
- Mudanças na autenticação do painel.

## Requisitos Funcionais

### RF1 — Ação principal em 1 clique: "Abrir WhatsApp"

Na lista de resultados, o botão principal de cada lead deve ser **"Abrir WhatsApp"** (cor de destaque, verde WhatsApp). Ao clicar:
1. Gera a mensagem personalizada (POST `/api/painel/prospeccao/lead`) se ainda não gerada.
2. Abre o `wa.me` com o texto preenchido em uma nova aba.
3. Marca o lead como **enviado** (PATCH com `marcar_enviado: true`) usando a conta WhatsApp selecionada.
4. Registra data + conta usada no histórico do lead.
5. Atualiza o estado local da lista (status → enviado, contador da conta) sem recarregar tudo.

O botão secundário **"Gerar mensagem"** continua disponível para quem quer editar antes de enviar (abre a prévia no painel lateral).

### RF2 — Corrigir encoding dos acentos

O template de mensagem armazenado no R2 deve ser re-gravado com UTF-8 correto, de forma que acentos (`á`, `é`, `ã`, `ç`, etc.) apareçam corretamente na prévia, no link `wa.me` e na mensagem enviada.

### RF3 — Filtros rápidos sempre visíveis com contagem

Os filtros rápidos ("Só novos", "Com telefone", "Não contatados N dias") devem aparecer como **botões toggle** sempre visíveis no topo da coluna central (acima da tabela), cada um mostrando a **contagem** de leads que se aplicam. Ex.: `Só novos (12)`.

### RF4 — Persistência de nicho e cidade

Ao carregar o painel, o nicho e a cidade da **última busca realizada** devem ser restaurados automaticamente (a partir das sessões de busca salvas no R2), para o operador não precisar reconfigurar tudo a cada acesso.

### RF5 — Status e último contato na lista principal

A tabela de leads deve mostrar:
- O **status** do lead (já existe, manter).
- Um **badge de "último contato"** com a data relativa (ex.: "há 2 dias") quando `data_ultimo_contato` existir.
- Destaque visual para leads com telefone e status "Novo" (ex.: borda esquerda colorida ou fundo sutil).

### RF6 — Histórico do lead mais acessível

O histórico do lead deve ser exibido de forma proeminente no painel lateral (não enterrado no final), com um **filtro rápido por status** (todos / enviado / respondeu / observação etc.).

### RF7 — Atalhos de teclado

- `Enter` no campo de cidade → dispara a busca.
- Quando um lead está selecionado (prévia aberta), `Ctrl+Enter` → abre o WhatsApp e marca como enviado.

### RF8 — Busca dentro dos resultados atuais

Um campo de texto acima da tabela filtra os resultados **já carregados** por nome/categoria/endereço, sem fazer nova consulta na API.

### RF9 — Modo compacto

Um toggle "Modo compacto" reduz a altura das linhas da tabela para exibir mais leads por tela.

## Requisitos Não-Funcionais

- **RNF1**: Nenhuma operação de envio deve disparar `carregarTudo()` (reload completo de ~500 leads). A UI deve ser atualizada apenas com os dados retornados pelos endpoints.
- **RNF2**: O painel não deve crashar (tela branca) por valores de status/evento desconhecidos.
- **RNF3**: As alterações devem manter compatibilidade com o layout responsivo atual (desktop e mobile).
- **RNF4**: O encoding correto deve valer tanto para o template padrão quanto para templates futuros.

## Restrições e Dependências

- O template de mensagem é armazenado no R2 (`prospeccao/config.json`) e editado via `PATCH /api/painel/prospeccao`.
- O encoding atual está corrompido (mojibake) por uma gravação anterior via PowerShell.
- A lista de leads vem de `GET /api/painel/prospeccao` que retorna `data_ultimo_contato` por lead.
- Os filtros rápidos existem como checkboxes na coluna esquerda; precisam ser promovidos para botões na coluna central.

## Perguntas em aberto

Nenhuma — os requisitos estão claros a partir das recomendações do usuário.

## Critérios de Aceitação

### AC1 (rule) — Botão "Abrir WhatsApp" como ação principal
- Na tabela de resultados, cada linha tem um botão verde "Abrir WhatsApp" como ação principal.
- Clicar nele gera a mensagem (se necessário), abre o `wa.me` e marca o lead como enviado, sem `carregarTudo()`.
- O status do lead na lista atualiza para "Enviado" imediatamente.

### AC2 (rule) — Acentos corretos nas mensagens
- Ao gerar uma mensagem para qualquer lead, o texto contém acentos corretos (`Olá`, `vocês`, `Ajudamos`, `Gostaria`, `Abraço`) sem caracteres `�`.
- O link `wa.me` gerado contém o texto com acentos corretos (URL-encoded UTF-8).

### AC3 (rule) — Filtros rápidos com contagem
- Acima da tabela, há botões toggle para "Só novos", "Com telefone" e "Não contatados N dias".
- Cada botão exibe a contagem de leads correspondente entre parênteses.
- Ativar/desativar filtra a lista sem nova busca na API.

### AC4 (rule) — Persistência de nicho e cidade
- Ao abrir o painel após já ter feito buscas, o nicho e a cidade da sessão mais recente são pré-preenchidos e os resultados dessa sessão são exibidos.

### AC5 (rule) — Último contato e destaque na lista
- A tabela mostra a data do último contato (relativa) para leads com `data_ultimo_contato`.
- Leads com telefone e status "Novo" têm destaque visual diferenciado.

### AC6 (rule) — Histórico acessível com filtro
- O histórico do lead aparece no topo do painel lateral (após a prévia da mensagem) e tem filtros rápidos por tipo de evento.

### AC7 (rule) — Atalhos de teclado
- Pressionar Enter no campo de cidade executa a busca.
- Com a prévia de um lead aberta, Ctrl+Enter abre o WhatsApp e marca como enviado.

### AC8 (rule) — Busca local nos resultados
- Um campo de texto acima da tabela filtra os resultados por nome/categoria/endereço sem chamar a API.

### AC9 (rule) — Modo compacto
- Um toggle reduz a altura das linhas da tabela, exibindo mais leads por tela.

### AC10 (rule) — Sem reload pesado no envio
- Após clicar em "Abrir WhatsApp", nenhuma requisição `GET /api/painel/prospeccao` (carregarTudo) é disparada.

### AC11 (rubric) — Qualidade percebida da UX
- Dimensão: fluidez do fluxo de envio de mensagens.
- Escala: 0–2.
- Âncoras: 0 = ainda exige ≥4 cliques; 1 = reduz para 2 cliques; 2 = fluxo em 1 clique (botão principal).
- Limiar de aprovação: ≥ 2.
- Fonte de evidência: inspeção do código do botão principal e do fluxo `gerarMensagem` → `abrirWhatsApp`.
