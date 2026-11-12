/** Corretor leve de digitação em português. Só sugere quando a troca é segura. */

const LIVRES = new Set(
  ["whatsapp", "instagram", "facebook", "tiktok", "youtube", "linkedin", "pix", "cnpj", "email", "online", "delivery", "combo", "fade", "blog", "wifi", "site", "spa", "petshop", "guix", "https", "www", "app"].map(fold),
);

const LISTA = `
não você vocês também até já só mais muito pouco quase sempre nunca ainda aqui ali onde quando porque pois mas para com sem sob sobre entre desde durante depois antes agora hoje amanhã ontem semana mês ano anos dia dias vez vezes cada todo toda todos todas algum alguma alguns algumas nenhum nenhuma outro outra outros outras mesmo mesma mesmos mesmas esse essa estes estas este esta isto isso aquilo aquele aquela aqueles aquelas ele ela eles elas nós meu minha meus minhas seu sua seus suas nosso nossa nossos nossas dele dela deles delas quem qual quais quanto quantos como bem mal tão tão
horário horários endereço endereços telefone telefones serviço serviços preço preços agendar agendamento agendamentos atendimento atendimentos qualidade experiência profissional profissionais cliente clientes cuidado cuidados corte cortes barba barbas cabelo cabelos unha unhas sobrancelha sobrancelhas massagem massagens consulta consultas promoção promoções funcionamento segunda terça quarta quinta sexta sábado domingo manhã tarde noite horas minutos rua avenida bairro cidade estado contato mensagem reserva reservar aberto fechado fechada tradição moderno moderna clássico clássica conforto higiene equipe espaço casa família resultado resultados tratamento tratamentos especial especiais completo completa personalizado personalizada exclusivo exclusiva ambiente acolhedor acolhedora pontual pontualidade confiança segurança praticidade rapidez atenção detalhe detalhes estilo visual imagem marca nome frase sobre início galeria agenda evento eventos dúvida dúvidas pergunta perguntas resposta respostas legenda botão cor cores fonte tema logo foto fotos capa texto textos descrição título subtítulo valor duração preferência melhor melhores bom boa ótimo ótima excelente rápido rápida fácil simples claro clara escuro escura quente limpo limpa novo nova antigo antiga local localizado localizada centro próximo próxima perto longe dentro fora junto acima abaixo
somos estamos temos fazem fazemos oferece oferecemos cuidar cuida cuidamos corta cortamos recebe recebemos espera esperamos conheça venha visite agende reserve escolha escolhe precisamos precisa podem pode quer querem gosta gostam fica ficam abre abrem fecha fecham trabalha trabalhamos atende atendemos marca marcamos confirma confirmamos envia enviamos chama chamar falar fale falam escreva clique clica veja saber saiba fazer feito será estava chegou chega chegam volta voltam leva levam traz trazem deixa deixam usa usamos usar usado usada
beleza saúde presença história região capital litoral interior praia jardim vila esquina número complemento mapa chegar estacionamento acessível acessibilidade crianças criança adulto adultos homem homens mulher mulheres pele rosto corpo mãos pés maquiagem design coloração luzes navalha toalha bebida café água música climatizado pontualidade combinado encaixe lista espera confirmação lembrete acolhimento bem-estar ofício barbearia salão estética advocacia contabilidade academia dentista odontológico consultório limpeza restauração clareamento urgência avaliação profilaxia resina psicologia psicóloga psicólogo sessão terapia casal adolescente nutricionista nutrição plano alimentar reconsulta cardápio consulta honorários tributos impostos treino musculação aula aulas banho tosa ração veterinário veterinária cliente atendimento horário marcado combinado reserva confirma joão josé antônio andré luís mário ângela júlia
pessoas pessoa tempo tempos lugar lugares forma formas parte partes vida vidas trabalho casa casas nome nomes coisa coisas caso casos exemplo exemplos momento momentos jeito jeitos modo modos tipo tipos nível níveis área áreas ponto pontos linha linhas lado lados frente fundo meio meio começo fim primeiro primeira segundo segunda terceiro terceira novo nova grande pequeno pequena alto alta baixo baixa bom boa melhor pior certo certa errado errada pronto pronta cheio cheia vazio vazia aberto aberta fechado fechada
quero queremos queria gostaria preciso precisamos pode podemos poderia poderiam deve devem deveria deveria fazer faz feito feita fazeremos venha vem vêm vindo ir indo vou vai vão fomos foi foram será serão seria seriam está estão estava estavam esteja estejam seja sejam tem têm tinha tinham tenha tenham há haver houve
obrigado obrigada por favor claro combina combinamos encontramos encontra encontra-se fica situado situada localizada localizado perto próximo próximo
`.trim();

function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const PALAVRAS = [...new Set(LISTA.split(/\s+/).filter(Boolean))];
const DIC = new Set(PALAVRAS);
const POR_FOLHA = new Map<string, string[]>();
const POR_LETRA = new Map<string, string[]>();

for (const w of PALAVRAS) {
  const f = fold(w);
  const folhas = POR_FOLHA.get(f) || [];
  folhas.push(w);
  POR_FOLHA.set(f, folhas);
  const chave = `${f[0]}:${f.length}`;
  const bolsa = POR_LETRA.get(chave) || [];
  bolsa.push(w);
  POR_LETRA.set(chave, bolsa);
}

function dist1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  if (a.length === b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++diff > 1) return false;
    return diff === 1;
  }
  const [curta, longa] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let pulos = 0;
  while (i < curta.length && j < longa.length) {
    if (curta[i] === longa[j]) {
      i++;
      j++;
    } else {
      pulos++;
      j++;
      if (pulos > 1) return false;
    }
  }
  return true;
}

function casar(original: string, sugestao: string) {
  const inicial = original[0] || "";
  const minuscula = inicial.toLocaleLowerCase("pt-BR");
  if (inicial !== minuscula) return sugestao[0].toLocaleUpperCase("pt-BR") + sugestao.slice(1);
  return sugestao;
}

export function sugestoes(bruta: string): string[] {
  const palavra = bruta.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
  if (palavra.length < 3 || palavra.length > 28 || /\d/.test(palavra)) return [];
  if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ].*[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(palavra)) return [];
  const low = palavra.toLocaleLowerCase("pt-BR");
  const f = fold(low);
  if (!f || LIVRES.has(f) || DIC.has(low)) return [];
  const acento = (POR_FOLHA.get(f) || []).filter((w) => w !== low).slice(0, 3);
  if (acento.length) return acento.map((w) => casar(palavra, w));
  if (palavra.length < 4 || palavra[0] !== palavra[0].toLocaleLowerCase("pt-BR")) return [];
  const perto: string[] = [];
  for (const n of [f.length - 1, f.length, f.length + 1]) {
    for (const w of POR_LETRA.get(`${f[0]}:${n}`) || []) {
      const fw = fold(w);
      if (fw.slice(0, 3) !== f.slice(0, 3)) continue;
      if (dist1(f, fw)) perto.push(w);
      if (perto.length >= 3) break;
    }
    if (perto.length >= 3) break;
  }
  return perto.map((w) => casar(palavra, w));
}
