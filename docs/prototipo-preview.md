# Rascunho por token (sem página no ar)

Não reservamos subdomínio nem slot de site. O cliente ganha um **token** e um **site.json**. A prévia é montada na hora a partir do arquivo. Isso cria urgência (some em 72h) sem custo de hospedagem por lead.

## Fluxo

1. `/prototipar` gera o JSON (OpenAI + modelo do nicho).
2. Arquivo vai para o R2 em `prototipos/{token}.json` com `expiraEm`.
3. Cliente vê `/visualizar/{token}` — render sob demanda.
4. `/visualizar` pede o token se ele voltar depois.
5. Edita nome/cidade/WhatsApp no próprio rascunho.
6. Contratar publica de verdade (domínio + e-mail).

TTL: `PROTOTIPO_TTL_HORAS` (default **72**).

## Por que não “página salva”

O lead pensa que tem um site dele. Na prática só existe o JSON. Quando o prazo acaba, a prévia some — incentivo a contratar.

PDF com prints fica para depois; o token + prévia já resolve o 500 dos slots no Vercel (`mkdir /var/task/data`).
