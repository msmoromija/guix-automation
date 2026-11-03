export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** DDD + número (10 ou 11 dígitos). Aceita +55 / 55 na frente. */
export function normalizarTelefoneBr(valor: string) {
  let digitos = soDigitos(valor);
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 10 || digitos.length === 11) return digitos;
  return null;
}

function mesmoDigito(valor: string) {
  return /^(\d)\1+$/.test(valor);
}

function digitoCpf(cpf: string, tamanho: number) {
  let soma = 0;
  for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function cpfValido(cpf: string) {
  if (cpf.length !== 11 || mesmoDigito(cpf)) return false;
  return digitoCpf(cpf, 9) === Number(cpf[9]) && digitoCpf(cpf, 10) === Number(cpf[10]);
}

function digitoCnpj(cnpj: string, pesos: number[]) {
  const soma = pesos.reduce((total, peso, indice) => total + Number(cnpj[indice]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cnpjValido(cnpj: string) {
  if (cnpj.length !== 14 || mesmoDigito(cnpj)) return false;
  const primeiro = digitoCnpj(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digitoCnpj(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13]);
}

export function validarDocumento(valor: string) {
  const digitos = soDigitos(valor);
  if (digitos.length === 11 && cpfValido(digitos)) return digitos;
  if (digitos.length === 14 && cnpjValido(digitos)) return digitos;
  return null;
}
