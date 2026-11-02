# Guix Automation

Matriz dos sites de presença digital. Um contrato de dados, várias peles de nicho. Guix é a marca do site de venda e fica de fora das demonstrações.

## Site da Guix

O site de venda fica em `site/`. Fundo claro, com a marca em texto. As sete demonstrações entram pelas páginas de cada casa.

```bash
cd site
npm run dev
```

Abre em http://localhost:3000. A publicação na Vercel usa a pasta `site` como raiz do projeto. A produção está em https://guix.net.br.

## Contas do Lovable

A barbearia já está numa conta e parou por falta de crédito. Quando o crédito voltar, use Retomar nesse projeto.

Cada conta nova recebe um nicho, num projeto vazio. Cole o arquivo inteiro uma vez e confira se o final ainda tem `SITE_JSON_END`. Se a ferramenta oferecer banco, login ou Supabase, recuse.

| Conta | Arquivo para colar | Para onde baixar |
| --- | --- | --- |
| A que já está aberta | retomar a barbearia, sem colar de novo | `prototipos/barbearia` |
| Conta nova | `prompts/lovable-salao.prompt.txt` | `prototipos/salao` |
| Conta nova | `prompts/lovable-estetica.prompt.txt` | `prototipos/estetica` |
| Conta nova | `prompts/lovable-petshop.prompt.txt` | `prototipos/petshop` |
| Conta nova | `prompts/lovable-academia.prompt.txt` | `prototipos/academia` |
| Conta nova | `prompts/lovable-contabilidade.prompt.txt` | `prototipos/contabilidade` |
| Conta nova | `prompts/lovable-advocacia.prompt.txt` | `prototipos/advocacia` |

O site da Guix não vai para o Lovable. Ele está em `site/` e serve as sete casas em `/casas/<nicho>/`, a partir do código em `prototipos/`. O desenho está em `docs/guix.md`.

A leitura do que cada conta publicou está em `docs/avaliacao-demos.md`. O prompt curto de correção visual, só para estética, academia, contabilidade e advocacia, está em `prompts/correcao-visual.prompt.txt`. Clínica, dentista e imobiliária estão descritos em `docs/modulos-nicho.md`.

## Mapa

| Caminho | Função |
| --- | --- |
| `docs/arquitetura.md` | Contrato, rotas, seções e checklist |
| `docs/guix.md` | Marca e site de venda |
| `schema/site.schema.json` | Validação da versão 1.0.0 |
| `exemplos/` | Conteúdo de cada demonstração |
| `prompts/` | Texto para colar no Lovable |
| `prototipos/` | Código baixado de cada conta |
