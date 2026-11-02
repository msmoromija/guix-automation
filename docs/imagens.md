# Arquitetura de imagens — GuiX

Estratégia híbrida: biblioteca própria no Cloudflare R2 + Unsplash como complemento no painel + upload do cliente com filtro, enquadramento e isolamento.

## Fluxo

1. Fotos padrão vivem no R2 (`imagens/{nicho}/{categoria}/…`) — biblioteca compartilhada por nicho.
2. No painel, o cliente pode trocar por outra da biblioteca, buscar no Unsplash ou fazer upload.
3. Foto escolhida no Unsplash (fluxo do cliente) é baixada, validada, enquadrada e gravada **só** em `clientes/{clienteId}/…`.
4. Upload próprio passa pelo mesmo filtro/enquadramento; se não atender o slot do banner, é **negado**.
5. Atribuição Unsplash fica no objeto (e no rodapé do site do cliente).

## Isolamento entre projetos

| Área | Prefixo | Visibilidade |
| --- | --- | --- |
| Biblioteca GuiX | `imagens/{nicho}/{categoria}/` | Compartilhada (estoque) |
| Inbox do cliente | `clientes/{id}/inbox/{categoria}/` | Só aquele `clienteId` |
| Publicado do cliente | `clientes/{id}/publicado/{categoria}/` | Só aquele `clienteId` |

Regras:

- APIs de upload / Unsplash (POST) / meus-uploads / avaliar exigem `x-painel-token` **e** `x-cliente-id`.
- O `clienteId` do formulário é ignorado no upload — vale só o header.
- `urlPublica()` para chaves `clientes/…` **nunca** usa `R2_PUBLIC_BASE_URL` (evita URL adivinhável no CDN público). Serve via proxy assinado (`exp` + `sig`).
- `GET /api/midia/arquivo/…` em `clientes/…` exige assinatura HMAC válida **ou** painel + mesmo `clienteId`.
- Biblioteca `imagens/…` pode ser pública/cacheável.

## Filtro, enquadramento e aprovação

Slots em `site/lib/media/slots.ts` (ex.: hero 1920×1080, profissional 800×800).

1. **Filtro:** JPG/PNG/WebP, máx. 8 MB (`MIDIA_MAX_BYTES`).
2. **Avaliação:** resolução mínima do slot; sem upscale.
3. **Enquadramento:** Sharp `cover` + `attention` → WebP no tamanho do slot; EXIF removido.
4. **Decisão automática:** `aprovada` ou `negada` (+ `motivo`).
5. **Manual:** `POST /api/midia/avaliar` com `decisao: aprovada|negada` (só no próprio prefixo).

Status fica em **metadados R2** (`status`, `motivo`, `cliente_id`, `categoria`) — fora do schema de site 1.0.0 congelado. O `site.json` continua com `src` / `origem` / `credito`.

## Atribuição

| Origem | Crédito |
| --- | --- |
| Biblioteca própria / upload do cliente | Não |
| Unsplash via API (mesmo após espelhar no R2) | Sim — `Photo by [Nome] on Unsplash` com link ao perfil |

## Pastas no R2 (bucket `guix-imagens`)

```
imagens/
  barbearia/{hero,servico,sobre,profissional,galeria,promocao,evento}/
  salao/…
  …
clientes/{clienteId}/
  inbox/{categoria}/
  publicado/{categoria}/
```

## Variáveis

Ver `site/.env.example`:

| Var | Uso |
| --- | --- |
| `R2_*` / `R2_PUBLIC_BASE_URL` | S3 API + CDN só para biblioteca |
| `UNSPLASH_ACCESS_KEY` | Busca Unsplash |
| `OPENAI_API_KEY` | `gpt-4o-mini` → JSON de textos + tags |
| `PAINEL_MIDIA_TOKEN` | Auth das APIs do painel |
| `MIDIA_SIGNING_SECRET` | HMAC das URLs privadas (fallback: token do painel) |
| `MIDIA_MAX_BYTES` | Limite de upload (default 8 MB) |

## Código

- `site/lib/media/` — R2, Unsplash, OpenAI, slots, validação, crop, isolamento
- `site/app/api/midia/` — `biblioteca`, `unsplash`, `upload`, `meus-uploads`, `avaliar`, `arquivo`
- `site/app/painel/midia/` — UI do painel
- `scripts/seed-r2-pastas.mjs` — marcadores de pasta da biblioteca

## Automação de site

- `POST /api/automacao/gerar-site` — monta `site.json` 1.0.0 (exemplo do nicho + OpenAI + biblioteca; `imagensCliente` opcional e isolada)
- `site/app/painel/automacao/` — UI de geração
- `scripts/gerar-site-cliente.mjs` — CLI contra a API
- Pacote local: `clientes/{id}/config/site.json` (gitignored)
