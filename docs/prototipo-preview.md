# Protótipo pré-pagamento e slots de preview

Fluxo de venda: o cliente **vê o modelo → escolhe → prototipa grátis → baixa `site.json` → contrata**.

## URLs

| Rota | Função |
| --- | --- |
| `/exemplos/{nicho}` | Modelo com barra GuiX (Usar / Contratar) + iframe da casa |
| `/casas/{nicho}/` | Demo estática + barra flutuante `_guix-barra.js` |
| `/prototipar?nicho=` | Formulário grátis (nome, cidade, WhatsApp) |
| `/p/{id}?t=` | Vitrine ao vivo do `site.json` + download + contratar |
| `/conta/{id}?t=` | Área do cliente (preview, JSON, mídia, contratar) |
| `GET /api/prototipo/{id}/site.json?t=` | Download do `site.json` |

## Slots

- Padrão: **20** slots (`PREVIEW_MAX_SLOTS`), TTL **7 dias** (`PREVIEW_TTL_DIAS`).
- Path atual: `/p/{id}` (funciona já). Subdomínio `*.preview.guix.net.br` entra quando o DNS estiver pronto — mesmo `id`/token.
- Registry em `site/data/previews/registry.json` + espelho R2 `sistema/previews/registry.json`.
- Slot cheio: remove o protótipo mais antigo (status `prototipo`).

## APIs

- `POST /api/prototipo/criar` — público, rate limit 5/h por IP
- `GET /api/prototipo/{id}?t=` — metadados
- `GET /api/prototipo/{id}/site.json?t=` — download

Geração reutiliza `gerarSiteCliente` (OpenAI + exemplo do nicho + biblioteca).
