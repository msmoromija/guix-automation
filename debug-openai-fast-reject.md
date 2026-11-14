# Debug Session: openai-fast-reject
- **Status**: [OPEN]
- **Issue**: Pedido de edição no protótipo é exibido como timeout em menos de cinco segundos.
- **Debug Server**: `http://127.0.0.1:7777/event` (Node local)
- **Log File**: `.dbg/trae-debug-log-openai-fast-reject.ndjson`

## Reproduction Steps
1. Abrir o editor do protótipo.
2. Enviar um pedido composto de edição, como trocar o nicho, nome/slogan, imagens e cor dos títulos.
3. Registrar o tempo até a mensagem de erro e a resposta HTTP da rota `/api/prototipo/textos`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O cliente aborta a requisição antes do limite do servidor. | High | Low | Instrumentado; medir duração e sinal de abort no cliente. |
| B | A rota rejeita a requisição rapidamente por validação, rate limit ou autenticação. | Medium | Low | Instrumentado; registrar entrada, rate limit e erro externo. |
| C | A OpenAI falha rapidamente por credencial/modelo/formato, mas o erro é traduzido para timeout. | High | Medium | Instrumentado; registrar duração, status e classe da falha sem dados sensíveis. |
| D | O cliente mapeia qualquer erro HTTP/resposta vazia para a mensagem de timeout. | High | Low | Instrumentado; comparar status e texto retornado à mensagem renderizada. |
| E | A resolução da marca ou aplicação do patch lança exceção e cai no mesmo timeout genérico. | Medium | Low | Instrumentado; registrar etapa e classe do erro no cliente. |

## Log Evidence
Instrumentação temporária adicionada em `EstudioForm.tsx` e `route.ts`. O coletor está ativo e o arquivo NDJSON foi limpo para a reprodução.

## Verification Conclusion
Aguardando uma reprodução do pedido que falha em menos de cinco segundos no editor local instrumentado.
