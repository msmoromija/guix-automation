# Avaliação das demos no Lovable

Olhado em 1º de novembro de 2026, com o que cada conta conseguiu publicar antes de acabar o crédito. O conteúdo pedido está nas sete. O que falha é acabamento visual e, num caso, a leitura da grade de horários.

| Demo | Endereço | O que ficou | O que fazer |
| --- | --- | --- | --- |
| Barbearia Vila Norte | https://screenshot-to-scene-7801.lovable.app | Hero legível, menu, botão dourado com texto escuro, seções na ordem | Guardar. Várias fotos de estoque não carregam. Não reabrir no Lovable. |
| Salão Vila Flor | https://screenshot-snap-replica-62.lovable.app | Pele clara coerente, menu, serviços e equipe | Guardar. A linha pequena sobre a foto quase some. Não reabrir. |
| Pet Shop Bento | https://bento-banho-com-hora-marcada.lovable.app | Hero claro, botões fora da foto, texto de porte e a recusa de atendimento veterinário | Guardar. É uma das melhores. Não reabrir. |
| Estúdio Serra Clara | https://pixel-perfect-picture-0305.lovable.app | Hero bom, serviços de estética presentes | Falta o cabeçalho com o menu. Corrigir com o prompt curto. |
| Academia Farol | https://pixel-perfect-picture-playback-165.lovable.app | Texto e serviços certos | Título e botões pretos em cima da foto escura. A grade virou "06:00–20:00", apagando o intervalo do meio do dia. Corrigir. |
| Lima Contabilidade | https://pixel-perfect-picture-0480.lovable.app | Textos e preços certos, inclusive MEI gratuito no governo | Sem menu. Botão de WhatsApp quase invisível. Faixa preta vazia debaixo do hero. Corrigir. |
| Vale Luz Advogados | https://screenshot-to-scene-5075.lovable.app | Textos certos, sem promessa de causa | Sem menu. Título preto sobre estante escura. Botões ilegíveis. Corrigir. |

## O que não vale a pena

Reenviar o prompt inteiro. O miolo já está nas páginas. Outro prompt longo gasta o crédito reescrevendo o que funciona e pode piorar a barbearia, o salão e o pet shop.

Corrigir daqui também não dá ainda: o código desses projetos não está em `prototipos/`. Sem o download, o ajuste visual continua no Lovable.

## Prompt corretivo

Um só, em `prompts/correcao-visual.prompt.txt`. Colar apenas nestes quatro, quando a conta tiver crédito de novo:

- Estúdio Serra Clara
- Academia Farol
- Lima Contabilidade
- Vale Luz Advogados

Barbearia, salão e pet shop não recebem esse prompt.

## O limite do contrato atual

A padronização segurou o nome dos campos, e isso continua certo. Ela também obrigou clínica, dentista e imobiliária a fingirem que são uma barbearia: um card de serviço, um profissional e um horário. Isso corta o que esses negócios vendem.

O próximo passo de produto está em `docs/modulos-nicho.md`. Clínica, dentista e imobiliária entram como módulos em cima do mesmo núcleo, não como mais três prompts iguais no Lovable. Lista de imóveis, convênio, CRM, CRO e CRECI não cabem em cinco créditos de um gerador de página.
