# Módulo de e-mails profissionais — GuiX

Provisionamento automatizado de caixas de e-mail no **Zoho Mail** dentro do painel interno da GuiX (`/painel/emails`). Compartilha a autenticação do painel. A lista exibe **todos os orçamentos** (aprovados ou não), permitindo testar o motor mesmo sem a compra aprovada.

## Fluxo de negócio

1. Comercial gera o orçamento (`/painel/orcamentos`) e informa o domínio do cliente.
2. Cliente paga — o orçamento passa a `status: "pago"` no R2.
3. Suporte abre `/painel/emails` e vê os projetos na lista (a coluna **Orçamento** indica o status; também aparecem projetos não aprovados, para testes).
4. Seleciona o projeto, confere o domínio já preenchido, escolhe até 5 caixas e clica em **Configurar E-mails**.
5. O motor descobre a zona DNS (Cloudflare ou Vercel DNS, conforme onde o domínio realmente vive), associa o domínio à Vercel, publica automaticamente os desafios DNS e aguarda Vercel/Zoho confirmarem.
6. Depois cria/valida MX e SPF, provisiona as caixas e mostra o relatório no painel.

## Pré-requisitos

- O domínio precisa estar em uma zona acessível por **um** destes provedores: **Cloudflare** (token com **Zone Read** + **DNS Edit**; o Zone ID é descoberto pelo domínio) ou **Vercel DNS** (nameservers `vercel-dns.com`; usa `VERCEL_TOKEN` + `VERCEL_TEAM_ID`). O backend detecta o provedor automaticamente.
- Conta **Zoho Mail** com as scopes da Admin API.
- Projeto **Vercel** configurado (`VERCEL_TOKEN` + `GUIX_VERCEL_PROJETO`).
- `CRON_SECRET` configurado no ambiente de produção (habilita a retomada pelo Vercel Cron; sem ele, a retomada em segundo plano fica apenas a cargo do painel aberto).
- Se já houver MX de outro provedor, o fluxo para e preserva os registros existentes para evitar interrupção do e-mail.

## Variáveis de ambiente

```env
# Zoho Mail Admin API (OAuth 2.0 com refresh token)
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ZOID=                         # opcional (evita 1 chamada à API)
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_MAIL_API_URL=https://mail.zoho.com/api

# Cloudflare DNS (Zone Read + DNS Edit; o Zone ID é descoberto pelo domínio).
# Opcional: domínios no Vercel DNS dispensa o Cloudflare e usa o VERCEL_TOKEN + VERCEL_TEAM_ID abaixo.
CF_API_TOKEN=

# Vercel — associa e verifica o domínio no projeto configurado.
# VERCEL_TEAM_ID é obrigatório quando o domínio pertence a um team.
VERCEL_TOKEN=
VERCEL_TEAM_ID=
GUIX_VERCEL_PROJETO=               # slug do projeto Vercel onde o domínio é anexado

# Autentica o cron que retoma execuções pendentes de propagação DNS
CRON_SECRET=
```

### Obtendo o refresh token do Zoho

1. Em https://api-console.zoho.com crie um **Self Client**.
2. Gere um *grant token* com as scopes:
   - `ZohoMail.organization.domains.ALL`
   - `ZohoMail.organization.accounts.ALL`
   - `ZohoMail.partner.organization.ALL` (permite descobrir a organização automaticamente; sem ele, defina `ZOHO_ZOID`)
3. Troque o grant token por um **refresh token**:

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=$ZOHO_CLIENT_ID" \
  -d "client_secret=$ZOHO_CLIENT_SECRET" \
  -d "code=<GRANT_TOKEN>"
```

4. Guarde o `refresh_token` em `ZOHO_REFRESH_TOKEN`. O módulo renova o *access token* automaticamente (cache de 1 h).

> Contas em outras regiões: use `https://accounts.zoho.eu` + `https://mail.zoho.eu/api` (ou `.in` / `.com.cn`).

## Automação e controle de domínio

O backend detecta automaticamente onde o domínio vive e usa o provedor correspondente: **Vercel DNS** (quando o domínio tem nameservers `vercel-dns.com` e está no team configurado) ou **Cloudflare** (busca a zona ativa mais específica pelo token administrativo). Nos dois casos não há desafio TXT manual da GuiX nem necessidade de informar Zone/Team por cliente.

Depois de associar o domínio à Vercel, o backend consulta o desafio retornado pela API. Se houver TXT, cria-o no provedor de DNS detectado, consulta o DNS público, chama o endpoint de verificação da Vercel e repete a consulta até confirmar. O Zoho segue o mesmo princípio: publica o TXT de verificação no provedor detectado e aguarda a confirmação pela Admin API.

Se uma propagação exceder a rodada atual, a execução fica pendente. Enquanto o painel estiver aberto, ele retoma a cada 15 segundos; com o painel fechado, o agendador do servidor (`/api/cron/emails`) assume. MX e SPF também são verificados antes de criar caixas. O SPF existente é mesclado para evitar múltiplos registros SPF; MX de outro provedor não é sobrescrito sem uma migração explícita.

> **Plano Vercel.** O projeto está no plano **Hobby**, que só aceita cron **uma vez por dia** (agendas com mais de uma execução diária falham no deploy). Por isso o agendador roda diariamente como rede de segurança. Para retomada quase imediata mesmo com o painel fechado, aponte um agendador externo (Cloudflare Worker Cron Trigger, GitHub Actions ou similar) para `GET /api/cron/emails` com `Authorization: Bearer <CRON_SECRET>`; o endpoint aceita qualquer frequência.

## Fluxo automatizado (8 etapas)

Executado por `provisionarEmails` em `site/lib/emails/provisionar.ts`, gravando o progresso no R2 a cada passo:

1. Descobrir e validar a zona DNS pelo domínio (Vercel DNS ou Cloudflare).
2. Associar o domínio à Vercel; publicar o TXT de desafio se solicitado e aguardar `verified=true`.
3. Adicionar o domínio à organização Zoho; publicar e validar o TXT de verificação.
4. Habilitar Email Hosting.
5. Consultar MX existentes; interromper sem alteração se apontarem para outro provedor.
6. Criar/validar MX (`mx.zoho.com` 10 / `mx2` 20 / `mx3` 50) e mesclar/validar SPF.
7. Criar as caixas (até 5) apenas depois das verificações.
8. Relatório final.

É **idempotente**: reexecuções atualizam os passos existentes, reutilizam os recursos já criados e retomam automaticamente quando DNS ainda propaga.

## Acesso

Login por **e-mail autorizado + senha de orçamentos**. A lista de e-mails vem de `EMAILS_PAINEL` (`site/lib/cupons/auth.ts`) somada a `GUIX_OPS_EMAILS` — por padrão `msmoromija@gmail.com` e `atendimento@guix.net.br`. A senha é a mesma do painel de orçamentos (`SENHA_PAINEL_COMERCIAL`). Automação pode usar `Authorization: Bearer <PAINEL_MIDIA_TOKEN|GUIX_OPS_TOKEN>`.

## API

As rotas do módulo usam `?email=&senha=` (login) ou o token de serviço descrito acima. Sem `email`, a rota aceita apenas a senha (compatibilidade com links internos antigos) — a tela do módulo sempre envia o e-mail.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/painel/emails` | Todos os orçamentos (qualquer status) + histórico de execuções |
| `POST` | `/api/painel/emails` | Inicia o provisionamento (`projetoId`, `dominio`, `contas[]`) → devolve `{ id }` |
| `GET` | `/api/painel/emails/{id}` | Execução com passos, contas criadas e erro |
| `POST` | `/api/painel/emails/{id}/continuar` | Reinicia manualmente uma execução que terminou em erro |
| `GET` | `/api/cron/emails` | Retoma uma execução pendente (chamada pelo Vercel Cron) |

O primeiro `POST` grava a execução antes de responder e inicia o motor em segundo plano via `after()`. O endpoint `/api/cron/emails`, agendado em `site/vercel.json`, retoma uma execução pendente por rodada e exige `Authorization: Bearer <CRON_SECRET>` (a Vercel envia esse cabeçalho automaticamente quando `CRON_SECRET` existe no ambiente). Como o projeto está no plano Hobby, o agendador interno roda uma vez por dia; para retomada frequente use um agendador externo no mesmo endpoint. O endpoint de retomada manual continua disponível apenas para execuções que terminaram em erro.

## Persistência (R2)

| Chave | Conteúdo |
| --- | --- |
| `emails/_indice.json` | Índice das execuções mais recentes |
| `emails/<id>.json` | Execução: projeto, domínio, passos, contas criadas, estado e erro |

## Segurança

- Tokens do Zoho/Vercel/Cloudflare **nunca** vão ao frontend — todo o provisionamento roda no backend (`runtime = "nodejs"`).
- As senhas provisórias das caixas aparecem apenas no log da execução (painel interno autenticado) e exigem troca no primeiro acesso.

## Arquivos

```
site/lib/emails/zoho.ts          # cliente da Zoho Mail Admin API (OAuth + endpoints)
site/lib/emails/provisionar.ts   # orquestração das 8 etapas + senha provisória
site/lib/emails/store.ts         # persistência das execuções no R2
site/lib/sites/dns.ts            # fachada agnóstica (descobre Vercel DNS ou Cloudflare)
site/lib/sites/vercel-dns.ts     # gravar/listar registros no Vercel DNS
site/lib/sites/cloudflare-dns.ts # gravarRegistroDns() — TXT/MX/CNAME (Cloudflare)
site/lib/sites/spf.ts            # mesclagem de SPF compartilhada
site/lib/sites/vercel-api.ts     # anexarDominioVercel() + vercelFetch()
site/app/api/painel/emails/…     # API routes
site/app/painel/emails/page.tsx  # painel (tabela, configuração, progresso, histórico)
```
