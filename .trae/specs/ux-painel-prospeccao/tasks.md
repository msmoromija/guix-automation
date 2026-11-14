# Tasks: UX do Painel de Prospecção

Cada tarefa mapeia para um ou mais Critérios de Aceitação (AC) do `spec.md`.

---

## Task 1: Corrigir encoding do template de mensagem no R2

**Prioridade**: high
**Status**: pending
**ACs cobertos**: AC2

**Descrição**: Re-gravar o template de mensagem em `prospeccao/config.json` (R2) com UTF-8 correto, eliminando o mojibake (`Olï¿½` → `Olá`, etc.). Usar um script Node.js (não PowerShell) para garantir encoding UTF-8 na gravação.

**Arquivos**: `scripts/corrigir-template-encoding.mjs` (novo), config do R2.

**Test Requirements**:
- TR1.1 (rule): Após executar o script, `GET /api/painel/prospeccao` retorna o template com acentos corretos (`Olá`, `vocês`, `Ajudamos`, `Gostaria`, `Abraço`).
- TR1.2 (rule): `POST /api/painel/prospeccao/lead` gera uma mensagem sem caracteres `�`.
- TR1.3 (rule): O `wa.me` link contém o texto com acentos corretos.

---

## Task 2: Botão "Abrir WhatsApp" como ação principal na lista

**Prioridade**: high
**Status**: pending
**ACs cobertos**: AC1, AC10, AC11

**Descrição**: Na tabela de resultados, trocar o botão principal "Gerar mensagem" por "Abrir WhatsApp" (verde). Criar uma função `gerarEAbrirWhatsApp(r)` que: (1) gera a mensagem se o lead não tiver `mensagem_gerada`, (2) abre o `wa.me`, (3) marca como enviado via PATCH. Manter "Gerar mensagem" como botão secundário.

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR2.1 (rule): Cada linha da tabela tem um botão verde "Abrir WhatsApp" como ação principal.
- TR2.2 (rule): Clicar abre o `wa.me` e marca o lead como enviado sem chamar `carregarTudo()`.
- TR2.3 (rule): O status do lead na lista atualiza para "Enviado" após o clique.
- TR2.4 (rubric): Fluxo de envio em 1 clique. Escala 0–2, limiar ≥2. Evidência: inspeção do código.

---

## Task 3: Filtros rápidos como botões toggle com contagem

**Prioridade**: high
**Status**: pending
**ACs cobertos**: AC3

**Descrição**: Mover os filtros rápidos ("Só novos", "Com telefone", "Não contatados N dias") da coluna esquerda para o topo da coluna central (acima da tabela), como botões toggle. Cada botão mostra a contagem de leads que se aplicam. Aplicar filtro local sem nova busca.

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR3.1 (rule): Acima da tabela há botões toggle para os 3 filtros rápidos.
- TR3.2 (rule): Cada botão exibe a contagem entre parênteses.
- TR3.3 (rule): Ativar/desativar filtra a lista sem chamar a API de busca.

---

## Task 4: Persistência de nicho e cidade da última busca

**Prioridade**: high
**Status**: pending
**ACs cobertos**: AC4

**Descrição**: No `carregarTudo()`, restaurar o nicho e a cidade da sessão de busca mais recente (já existe lógica parcial com `restauradoRef`). Garantir que os resultados dessa sessão sejam exibidos automaticamente.

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR4.1 (rule): Ao abrir o painel após ter feito buscas, nicho e cidade da sessão mais recente são pré-preenchidos.
- TR4.2 (rule): Os resultados da sessão mais recente são exibidos automaticamente.

---

## Task 5: Status e último contato na lista principal

**Prioridade**: medium
**Status**: pending
**ACs cobertos**: AC5

**Descrição**: Na tabela, adicionar a data do último contato (relativa, ex.: "há 2 dias") para leads com `data_ultimo_contato`. Adicionar destaque visual (borda/fundo) para leads com telefone e status "Novo".

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR5.1 (rule): Leads com `data_ultimo_contato` mostram a data relativa na tabela.
- TR5.2 (rule): Leads com telefone e status "Novo" têm destaque visual diferenciado.

---

## Task 6: Histórico do lead mais acessível com filtro

**Prioridade**: medium
**Status**: pending
**ACs cobertos**: AC6

**Descrição**: Mover o histórico do lead para uma posição mais proeminente no painel lateral (logo após a prévia da mensagem). Adicionar filtros rápidos por tipo de evento (todos / enviado / respondeu / observação / etc.).

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR6.1 (rule): O histórico aparece logo após a prévia da mensagem no painel lateral.
- TR6.2 (rule): Há filtros rápidos por tipo de evento.

---

## Task 7: Atalhos de teclado

**Prioridade**: low
**Status**: pending
**ACs cobertos**: AC7

**Descrição**: `Enter` no campo de cidade dispara a busca. `Ctrl+Enter` com a prévia aberta abre o WhatsApp e marca como enviado.

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR7.1 (rule): Enter no campo de cidade executa a busca.
- TR7.2 (rule): Ctrl+Enter com lead selecionado abre WhatsApp e marca como enviado.

---

## Task 8: Busca local nos resultados

**Prioridade**: low
**Status**: pending
**ACs cobertos**: AC8

**Descrição**: Adicionar um campo de texto acima da tabela que filtra os resultados já carregados por nome/categoria/endereço, sem chamar a API.

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR8.1 (rule): Há um campo de busca acima da tabela.
- TR8.2 (rule): Digitar filtra a lista por nome/categoria/endereço sem requisição à API.

---

## Task 9: Modo compacto

**Prioridade**: low
**Status**: pending
**ACs cobertos**: AC9

**Descrição**: Adicionar um toggle "Modo compacto" que reduz a altura das linhas da tabela (padding menor, fonte menor).

**Arquivos**: `site/app/painel/prospeccao/page.tsx`

**Test Requirements**:
- TR9.1 (rule): Há um toggle "Modo compacto".
- TR9.2 (rule): Ativado, as linhas são mais compactas (menos padding).

---

## Task 10: Verificação final e deploy

**Prioridade**: high
**Status**: pending
**ACs cobertos**: AC1–AC11

**Descrição**: Rodar `tsc --noEmit`, fazer build de produção, deployar na Vercel e verificar os ACs em produção.

**Arquivos**: todos os alterados.

**Test Requirements**:
- TR10.1 (rule): `tsc --noEmit` passa sem erros.
- TR10.2 (rule): `next build` conclui com sucesso.
- TR10.3 (rule): Deploy aplicado em guix.net.br.
- TR10.4 (rule): Verificação manual dos ACs em produção passa.
