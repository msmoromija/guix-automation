# E-mails profissionais — avanço e handoff

Status do projeto **provisionador automático de e-mails profissionais** (Vercel + DNS + Zoho Mail), no painel `/painel/emails`. Documento de retomada: registra o que está em produção, a decisão de arquitetura pendente e o próximo passo planejado. Complementa [emails.md](./emails.md) (referência do módulo).

Última atualização: 2026-11-06 · estado: **pausado (standby)** aguardando decisão de arquitetura multi-tenant.

---

## 1. Objetivo

Transformar `/painel/emails` de um *assistente de configuração* em um **provisionador automático**: descobrir a zona DNS pelo domínio, criar automaticamente qualquer TXT exigido, fazer polling até validação, prosseguir para o Zoho e só interromper em erro irrecuperável ou ausência de acesso administrativo.

---

## 2. Decisão de arquitetura (PENDENTE — bloqueia a próxima etapa)

O requisito real do produto é **multi-tenant**: cada cliente no **próprio** Zoho. O código atual é **mono-organização (MOROX)**.

```
HOJE (implementado)              ALVO (requisito)
GuiX                             GuiX
└─ Zoho MOROX                    ├─ Cliente A → Zoho A
   ├─ cliente1.com.br            ├─ Cliente B → Zoho B
   ├─ cliente2.com.br            ├─ Cliente C → Zoho C
   └─ cliente3.com.br            └─ Cliente D → Zoho D
```

**Fork a decidir (como o cliente conecta o Zoho):**

- **(B) App OAuth único da GuiX + consentimento do cliente — recomendado.** `client_id`/`client_secret` globais (app GuiX); por cliente só `refresh_token`, `zoid`, `dc`. Exige registrar app "Server-based" no Zoho com a redirect URI da GuiX.
- **(A) Credenciais próprias por cliente.** Cada cliente cria o próprio Self Client e cola `client_id`/`client_secret`/`refresh_token`. Sem app da GuiX, mas alto atrito e propenso a erro.

Ponto de produto em aberto: o cliente terá **admin da própria org** (GuiX só provisiona) ou a GuiX será **admin delegada**? Isso define os escopos do consentimento.

> Nuance técnica: `client_id`/`client_secret` pertencem ao **app OAuth do desenvolvedor**, não à organização. Um mesmo app da GuiX pode ser autorizado por N orgs-clientes, gerando um refresh token distinto por org. Logo, no modelo B não é necessário client_id/secret por cliente.

---

## 3. O que já está pronto e em produção

### Camada DNS agnóstica (concluída, publicada)
Os domínios GuiX (`guix.net.br`, `morox.com.br`) estão no **Vercel DNS** (`serviceType: zeit.world`), não no Cloudflare. Foi criada uma fachada que descobre o provedor e roteia.

- **Criados**: `site/lib/sites/spf.ts` (merge de SPF preservando includes de terceiros), `site/lib/sites/vercel-dns.ts` (CRUD no Vercel DNS, nome relativo ao apex, `teamId`, SPF via PATCH), `site/lib/sites/dns.ts` (fachada: Vercel prioritário, fallback Cloudflare).
- **Modificados**: `site/lib/sites/cloudflare-dns.ts`, `site/lib/sites/vercel-api.ts` (`vercelFetch` exportado; `anexarDominioVercel` recebe `gravarTxt`), `site/lib/emails/provisionar.ts` (usa a fachada), `site/app/api/painel/emails/route.ts`, `site/app/painel/emails/page.tsx`, `site/.env.example`, `docs/emails.md`.
- **Produção**: `VERCEL_TEAM_ID=team_v7SXdKJsRwzV8wNhJAbCqV2e` criado no projeto `guix` (`prj_6bXOMVKycIL1s0yDULYH4XjjpoVj`) — era a causa raiz do `forbidden` na API de DNS da Vercel.
- **Deploy**: `next build` OK + deploy Vercel com alias `https://guix.net.br`. Verificado: `GET /api/painel/emails` → `401` sem auth (código novo servindo).
- Typecheck `npx tsc --noEmit` limpo.

### Integração Zoho existente (mono-org)
- `site/lib/emails/zoho.ts` — credenciais **globais** via env; `obterZoid()` devolve a org única; cache de access token global (`let`).
- `site/lib/emails/provisionar.ts` — resolve `zoid` uma vez por execução e provisiona **dentro da MOROX**.
- `listarContas(zoid)` lista caixas de **toda a org** (dedup só por e-mail).
- `MAX_CONTAS = 5`.

### Entrada única do motor
Os 3 pontos de entrada convergem em `provisionarEmails({ id, projetoId, cliente, dominio, contas, usuario })`:
- `site/app/api/painel/emails/route.ts` (POST)
- `site/app/api/painel/emails/[id]/continuar/route.ts`
- `site/app/api/cron/emails/route.ts`

→ Basta `provisionarEmails` resolver a credencial por `projetoId` para os 3 herdarem o comportamento multi-tenant.

---

## 4. Arquitetura-alvo (multi-tenant)

- **Nova entidade `ZohoCredencial`** por projeto (chave = `projetoId` = id do orçamento), persistida no R2 **criptografada**. Campos: `refreshToken`, `zoid`, `dc` (`com`/`eu`/`in`/`com.cn`), `clientId`/`clientSecret` (só no modelo A), `conectadoEm`, `conectadoPor`, `escopos`, `status`.
- **`zoho.ts` stateless**: remover `credenciais()` e o cache global; todas as funções recebem `ctx { clientId, clientSecret, refreshToken, dc, zoid }`; cache de access token por credencial (chave = hash do refresh token); `raizZoho()/subdominioZoho()` derivam do `dc` do cliente.
- **`provisionar.ts`**: resolve a credencial pelo `projetoId`; sem credencial conectada → falha clara ("Zoho do cliente não conectado").
- **Fluxo de conexão OAuth**:
  - `GET /api/painel/emails/zoho/autorizar?projetoId=…` → redirect para `accounts.zoho.{dc}/oauth/v2/auth`.
  - `GET /api/painel/emails/zoho/callback?code=&state=` → troca code por `refresh_token`, descobre `zoid`, grava credencial cifrada.
  - `status` e `desconectar`.
- **Guardas**: `route.ts` deixa de bloquear por `ZOHO_*` global; checagem Zoho passa a ser por projeto.
- **Env novas**: `ZOHO_OAUTH_CLIENT_ID`, `ZOHO_OAUTH_CLIENT_SECRET`, `ZOHO_OAUTH_REDIRECT_URI`, `EMAIL_CRED_KEY` (cifragem).

---

## 5. Plano por ondas

| Onda | Escopo |
| --- | --- |
| **A — Modelo + persistência** | Store de credenciais cifradas, tipos, `zoho.ts` stateless, `provisionar.ts` resolvendo credencial por projeto (sem UI). |
| **B — Fluxo de conexão** | Rotas `autorizar`/`callback`/`status`/`desconectar` (OAuth) + descoberta de `zoid`/`dc`. |
| **C — Painel** | Botão "Conectar Zoho" por projeto, status/reconectar/desconectar; remover avisos de config Zoho global. |
| **D — Validação e travas** | Provisionamento ponta a ponta com 1 cliente real, revisão sistemática de bugs, guardrails (bloquear provisionar sem Zoho conectado). |

**Próximo passo ao retomar**: definir modelo **A** ou **B** + ponto de acesso (admin do cliente) e iniciar a **Onda A**.

---

## 6. Riscos e pendências

1. **`VERCEL_TOKEN` temporário** (gerado pelo CLI, `expiresAt ≈ 1794025124`). Gerar token permanente e atualizar a env de produção.
2. **Cota Zoho (org MOROX, zoid `907178437`)**: plano free **5/5**. No modelo mono-org a cota é compartilhada por todos os domínios; não comporta caixas de cliente. (No modelo multi-tenant o limite passa a ser por cliente.)
3. **`CF_API_TOKEN` é `sensitive`** em produção — não auditável via API.
4. **Histórico**: 3 execuções em `erro`, todas de `guix.net.br`.
5. **Grant codes Zoho** usados durante o diagnóstico já foram consumidos (`invalid_code` em reuso). O refresh token de produção segue válido (3 escopos, `expires_in=3600`).
6. **`runner-pos-pago.ts`** ainda usa Cloudflare direto (fora do escopo de e-mail; migrar depois se necessário).

---

## 7. Variáveis de ambiente relevantes

**Hoje (mono-org, a descontinuar como credencial global):**
```env
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ZOID=907178437
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_MAIL_API_URL=https://mail.zoho.com/api
```

**Infra já em produção:** `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `GUIX_VERCEL_PROJETO`, `CF_API_TOKEN`, `CRON_SECRET` (+ R2).

**A criar (multi-tenant):** `ZOHO_OAUTH_CLIENT_ID`, `ZOHO_OAUTH_CLIENT_SECRET`, `ZOHO_OAUTH_REDIRECT_URI`, `EMAIL_CRED_KEY`.

---

## 8. Arquivos-chave

| Arquivo | Papel |
| --- | --- |
| `site/lib/emails/zoho.ts` | Cliente Zoho (a virar stateless/multi-tenant). |
| `site/lib/emails/provisionar.ts` | Orquestrador (resolve credencial por projeto). |
| `site/lib/emails/store.ts` | Persistência de execuções (R2). |
| `site/lib/emails/acesso.ts` | Auth do painel (whitelist). |
| `site/lib/sites/dns.ts` | Fachada DNS agnóstica (Vercel/Cloudflare). |
| `site/lib/sites/vercel-dns.ts`, `site/lib/sites/spf.ts` | Vercel DNS + merge SPF. |
| `site/lib/orcamentos/store.ts` | Orçamentos (o `projetoId` referencia o orçamento). |
| `site/app/api/painel/emails/**` | Rotas do painel (GET/POST, `[id]/continuar`, `[id]/verificar`). |
| `site/app/api/cron/emails/route.ts` | Retomada durável via Vercel Cron. |
| `docs/emails.md` | Referência do módulo. |
