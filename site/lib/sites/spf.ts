/**
 * Mescla os mecanismos de um SPF existente com os desejados, preservando a política final.
 * Evita sobrescrever includes de terceiros (Resend, Google, etc.) já presentes no domínio.
 */
export function mesclarSpf(atual: string, desejado: string) {
  const atuais = atual.trim().split(/\s+/);
  const desejados = desejado.trim().split(/\s+/);
  const ehPolitica = (parte: string) => /^[~?+-]?all$/i.test(parte);
  const politica = atuais.find(ehPolitica) || desejados.find(ehPolitica) || "~all";
  const mecanismos = atuais.slice(1).filter((parte) => !ehPolitica(parte));
  for (const mecanismo of desejados.slice(1).filter((parte) => !ehPolitica(parte))) {
    if (!mecanismos.some((atualMec) => atualMec.toLowerCase() === mecanismo.toLowerCase())) {
      mecanismos.push(mecanismo);
    }
  }
  return ["v=spf1", ...mecanismos, politica].join(" ");
}
