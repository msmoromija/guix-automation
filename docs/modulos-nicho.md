# Módulos por nicho

O núcleo continua igual para todo mundo: empresa, tema, contato, WhatsApp, FAQ, privacidade, rodapé e SEO. O que muda é o módulo do que o negócio vende. Forçar todo mundo no card "serviço + duração + profissional" produz uma página parecida e esconde a oferta real.

Versão alvo do contrato: 1.1.0. Os protótipos já publicados permanecem em 1.0.0. Não se reabre a barbearia para encaixar campo de clínica.

## O que entra no núcleo, para todos

Profissional ganha dois campos opcionais, vazios quando não existem:

- `registro_tipo`: CRM, CRO, OAB, CRECI ou vazio
- `registro`: o número, em texto

A demonstração pode deixar os dois vazios. O site do cliente real mostra o número. Isso vale para advogado, médico, dentista e corretor sem inventar número fictício na vitrine.

## Agenda

A agenda deixa de desenhar uma linha do primeiro horário ao último. Ela lista só os intervalos que existem. Se há um buraco entre manhã e tarde, a tela mostra os dois blocos.

O horário escolhido passa a respeitar a duração do item marcado. Uma consulta de 50 minutos não ocupa o mesmo espaço de um corte de unha de 15 minutos. Na versão 1.0 a duração aparece no card e a grade ignora isso. Na 1.1 a grade usa `duracao_minutos`.

## Clínica

Não é a estética. A oferta é consulta, exame e corpo clínico.

Campos do catálogo, além do serviço atual:

- especialidade
- tipo: consulta, exame ou procedimento
- preparo: texto curto do que fazer antes, ou vazio
- convênio: lista dos convênios aceitos naquele item, ou "somente particular"

Campos da empresa:

- convênios aceitos na casa
- aviso de que o site marca horário e não faz diagnóstico

A home mostra especialidades e convênios antes da galeria. A agenda pede especialidade, profissional, particular ou convênio, dia e hora. O WhatsApp confirma com esses dados.

## Dentista

Mesmo módulo da clínica, com `registro_tipo` CRO. O catálogo usa procedimentos com duração real: avaliação, limpeza, restauração, manutenção de aparelho. Convênio entra do mesmo jeito. Antes e depois, se existir, fica na galeria, com autorização implícita só de foto de estoque na demonstração. Foto de paciente real não entra sem arquivo do cliente.

## Imobiliária

Aqui o card de serviço não é a vitrine. A vitrine é o imóvel.

Cada imóvel tem:

- código
- finalidade: venda ou aluguel
- tipo: apartamento, casa, sala, terreno
- preço e `preco_label`
- bairro, cidade
- quartos, banheiros, vagas
- área em m²
- fotos, no mesmo formato de imagem já usado
- status: disponível ou reservado
- corretor responsável, pelo id do profissional

A home abre na busca: finalidade, tipo e bairro. O resultado é a grade de imóveis. O botão do card é "Agendar visita" e leva a `/agendar?imovel={codigo}`. A mensagem de WhatsApp leva código, endereço resumido, dia e hora.

Serviços da imobiliária, como avaliação ou administração de aluguel, continuam existindo, numa seção secundária. Eles não substituem a lista.

CRECI fica em `registro` do corretor.

## O que não vai para o Lovable

Clínica, dentista e imobiliária não ganham prompt de cinco créditos. A página sairia com a cara da barbearia e sem convênio, sem CRM e sem lista de imóveis. Esses três módulos são construídos neste repositório, em cima do núcleo, quando as demos atuais estiverem baixadas em `prototipos/`.
