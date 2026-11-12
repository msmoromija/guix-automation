import { randomInt } from "crypto";
import {
  descobrirZonaDns,
  gravarRegistroDnsGenerico,
  listarRegistrosDnsGenerico,
} from "@/lib/sites/dns";
import { anexarDominioVercel, vercelConfigurado } from "@/lib/sites/vercel-api";
import {
  adicionarDominio,
  criarConta,
  detalheDominio,
  emailDeConta,
  habilitarHosting,
  listarContas,
  obterZoid,
  raizZoho,
  subdominioZoho,
  txtVerificacao,
  verificarDominioTxt,
  verificarMx,
  verificarSpf,
  zohoConfigurado,
} from "./zoho";
import {
  gravarExecucao,
  lerExecucao,
  novaExecucao,
  novoIdExecucao,
  type ExecucaoEmails,
  type PassoLog,
} from "./store";
import { txtPublicoPresente } from "./verificar-dominio";

export const MAX_CONTAS = 5;

export type EntradaEmails = {
  /** Quando informado, reutiliza o id (permite acompanhar o progresso desde o disparo). */
  id?: string;
  projetoId: string;
  cliente: string;
  dominio: string;
  contas: string[];
  usuario: string;
};

export function normalizarDominio(valor: string) {
  return valor
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^www\./, "")
    .toLowerCase()
    .trim();
}

function pedaco(fonte: string, tamanho: number) {
  let saida = "";
  for (let i = 0; i < tamanho; i += 1) saida += fonte[randomInt(fonte.length)];
  return saida;
}

/** Senha provisória: ≥8 caracteres, com dígito e caractere especial. */
function senhaProvisoria() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const digitos = "23456789";
  const especiais = "!@#$%&*";
  return `${pedaco(letras, 7)}${pedaco(digitos, 2)}${pedaco(especiais, 1)}`;
}

async function poll(vezes: number, intervaloMs: number, fn: () => Promise<boolean>) {
  for (let i = 0; i < vezes; i += 1) {
    if (await fn()) return true;
    if (i < vezes - 1) await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  return false;
}

function apiTemporariamenteIndisponivel(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  return (
    /HTTP\s*(?:408|429|5\d{2})/i.test(mensagem) ||
    /fetch failed|network error|timed? ?out|socket hang up|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|UND_ERR_CONNECT_TIMEOUT/i.test(
      mensagem,
    )
  );
}

/**
 * Executa as etapas de provisionamento após validar acesso administrativo ao DNS.
 * Grava o progresso no R2 a cada etapa, então o painel acompanha em tempo real.
 * Idempotente: pode ser reexecutado para concluir etapas pendentes.
 */
export async function provisionarEmails(entrada: EntradaEmails): Promise<ExecucaoEmails> {
  const id = entrada.id || novoIdExecucao();
  const exec =
    (entrada.id ? await lerExecucao(entrada.id) : null) ||
    novaExecucao({
      id,
      projetoId: entrada.projetoId,
      cliente: entrada.cliente,
      dominio: normalizarDominio(entrada.dominio),
      contas: entrada.contas.slice(0, MAX_CONTAS),
      usuario: entrada.usuario,
    });
  exec.status = "em_configuracao";
  exec.concluidoEm = null;
  exec.erro = null;
  exec.passos = exec.passos.filter((passo) => passo.chave !== "falha" && passo.chave !== "api_retry");
  await gravarExecucao(exec);

  const registrar = async (passo: Omit<PassoLog, "em">) => {
    const atual = exec.passos.findIndex((item) => item.chave === passo.chave);
    const novoPasso = { ...passo, em: new Date().toISOString() };
    if (atual >= 0) exec.passos[atual] = novoPasso;
    else exec.passos.push(novoPasso);
    await gravarExecucao(exec);
  };

  const aguardarPropagacao = async (chave: string, titulo: string, detalhe: string) => {
    exec.status = "em_configuracao";
    exec.concluidoEm = new Date().toISOString();
    await registrar({ chave, titulo, status: "aviso", detalhe });
    return gravarExecucao(exec);
  };

  const falhar = async (titulo: string, erro: unknown) => {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (apiTemporariamenteIndisponivel(erro)) {
      const ultimoErro = [...exec.passos].reverse().find((passo) => passo.status === "erro");
      if (ultimoErro) {
        ultimoErro.status = "aviso";
        ultimoErro.detalhe = `Falha temporária de API. Nova tentativa automática. ${mensagem}`;
      }
      return aguardarPropagacao(
        "api_retry",
        `Nova tentativa: ${titulo}`,
        `Integração temporariamente indisponível; o motor tentará novamente automaticamente. ${mensagem}`,
      );
    }
    exec.status = "erro";
    exec.erro = mensagem;
    exec.concluidoEm = new Date().toISOString();
    await registrar({ chave: "falha", titulo, status: "erro", detalhe: mensagem });
    return gravarExecucao(exec);
  };

  if (!zohoConfigurado()) {
    return falhar(
      "Zoho não configurado",
      "Defina ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET e ZOHO_REFRESH_TOKEN no ambiente.",
    );
  }

  const dominio = exec.dominio;
  if (!dominio.includes(".") || !/^[a-z0-9.-]+$/.test(dominio)) {
    return falhar("Domínio inválido", "Informe um domínio válido, como cliente.com.br.");
  }

  let zona: Awaited<ReturnType<typeof descobrirZonaDns>>;
  try {
    zona = await descobrirZonaDns(dominio);
  } catch (erro) {
    return falhar("Falha ao validar a zona DNS", erro);
  }
  if (!zona.ok) return falhar("Acesso DNS indisponível", zona.aviso || "Não foi possível localizar uma zona DNS autorizada.");
  await registrar({
    chave: "dns_zone",
    titulo: "Zona DNS localizada",
    status: "ok",
    detalhe: `${zona.zona} · provedor ${zona.provedor === "vercel" ? "Vercel DNS" : "Cloudflare"}`,
  });

  let zoid = "";
  try {
    zoid = await obterZoid();
    await registrar({ chave: "zoho_org", titulo: "Organização Zoho localizada", status: "ok", detalhe: `zoid ${zoid}` });
  } catch (erro) {
    return falhar("Não foi possível acessar a organização Zoho", erro);
  }

  // Etapa 1 — anexar e verificar o domínio na Vercel.
  const projetoVercel = process.env.GUIX_VERCEL_PROJETO?.trim() || "";
  if (vercelConfigurado() && projetoVercel) {
    try {
      const resultado = await anexarDominioVercel({
        projeto: projetoVercel,
        dominio,
        gravarTxt: (registro) =>
          gravarRegistroDnsGenerico({ type: "TXT", name: registro.name, content: registro.content, zona }),
      });
      await registrar({
        chave: "vercel_dominio",
        titulo: "Domínio na Vercel",
        status: resultado.ok ? "ok" : resultado.pendente ? "aviso" : "erro",
        detalhe: resultado.ok ? "Domínio presente no projeto Vercel." : resultado.aviso,
      });
      if (resultado.pendente) {
        return aguardarPropagacao(
          "vercel_dominio",
          "Aguardando validação da Vercel",
          resultado.aviso || "A Vercel está aguardando propagação do TXT criado automaticamente.",
        );
      }
      if (!resultado.ok) {
        return falhar("A Vercel não confirmou o domínio", resultado.aviso || "Revise a verificação do domínio na Vercel.");
      }
    } catch (erro) {
      return falhar("Falha ao validar o domínio na Vercel", erro);
    }
  } else {
    return falhar(
      "Vercel não configurada",
      "Defina VERCEL_TOKEN e GUIX_VERCEL_PROJETO para verificar o domínio antes de criar as caixas.",
    );
  }

  // Etapa 2 — adicionar domínio no Zoho
  let detalhe = await detalheDominio(zoid, dominio);
  if (detalhe) {
    await registrar({ chave: "zoho_dominio", titulo: "Domínio no Zoho", status: "ok", detalhe: "Domínio já existia na organização." });
  } else {
    try {
      detalhe = await adicionarDominio(zoid, dominio);
      await registrar({ chave: "zoho_dominio", titulo: "Domínio adicionado no Zoho", status: "ok" });
    } catch (erro) {
      return falhar("Falha ao adicionar o domínio no Zoho", erro);
    }
  }

  // Etapas 3 e 4 — TXT de verificação + polling
  if (!detalhe.verificationStatus) {
    const valorTxt = txtVerificacao(detalhe);
    const txt = await gravarRegistroDnsGenerico({ type: "TXT", name: dominio, content: valorTxt, zona });
    await registrar({
      chave: "dns_txt",
      titulo: "Registro TXT de verificação",
      status: txt.ok ? "ok" : "erro",
      detalhe: txt.ok ? `${valorTxt} (${txt.acao})` : txt.aviso,
    });
    if (!txt.ok) return falhar("Não foi possível gravar o TXT no DNS", txt.aviso || "Falha no provedor de DNS.");

    const txtPropagado = await poll(8, 5_000, () => txtPublicoPresente(dominio, valorTxt));
    if (!txtPropagado) {
      return aguardarPropagacao(
        "verificar_txt",
        "Aguardando propagação do TXT do Zoho",
        "O TXT foi criado no provedor de DNS; a consulta DNS pública ainda não o encontrou.",
      );
    }

    const verificado = await poll(6, 10_000, () => verificarDominioTxt(zoid, dominio));
    await registrar({
      chave: "verificar_txt",
      titulo: "Verificação do TXT",
      status: verificado ? "ok" : "aviso",
      detalhe: verificado ? "Domínio verificado." : "Ainda não propagou — retomada automática programada.",
    });
    if (!verificado) {
      return aguardarPropagacao(
        "verificar_txt",
        "Aguardando propagação do TXT do Zoho",
        "O registro foi criado automaticamente no provedor de DNS. Nova tentativa automática em instantes.",
      );
    }
    detalhe = (await detalheDominio(zoid, dominio)) || detalhe;
  } else {
    await registrar({ chave: "verificar_txt", titulo: "Verificação do TXT", status: "ok", detalhe: "Domínio já verificado." });
  }

  // Etapa 5 — habilitar Email Hosting
  if (!detalhe.mailHostingEnabled) {
    try {
      await habilitarHosting(zoid, dominio);
      await registrar({ chave: "hosting", titulo: "Email Hosting habilitado", status: "ok" });
    } catch (erro) {
      return falhar("Falha ao habilitar o Email Hosting", erro);
    }
  } else {
    await registrar({ chave: "hosting", titulo: "Email Hosting habilitado", status: "ok", detalhe: "Já estava ativo." });
  }

  // Etapa 6 — MX + verificação
  const registrosMx = [
    { alvo: subdominioZoho("mx"), prioridade: 10 },
    { alvo: subdominioZoho("mx2"), prioridade: 20 },
    { alvo: subdominioZoho("mx3"), prioridade: 50 },
  ];
  const mxAtual = await listarRegistrosDnsGenerico({ type: "MX", name: dominio, zona });
  if (!mxAtual.ok) return falhar("Não foi possível consultar os MX existentes", mxAtual.aviso || "Falha na API de DNS.");
  const mxZohoEsperado = new Set(registrosMx.map((mx) => mx.alvo.replace(/\.$/, "").toLowerCase()));
  const mxDeOutroProvedor = mxAtual.registros
    .map((registro) => registro.content.replace(/\.$/, "").toLowerCase())
    .filter((alvo) => !mxZohoEsperado.has(alvo));
  if (mxDeOutroProvedor.length) {
    return falhar(
      "Migração de e-mail necessária",
      `O domínio já possui MX externos (${[...new Set(mxDeOutroProvedor)].join(", ")}). Os registros atuais foram preservados para evitar interrupção do e-mail.`,
    );
  }

  const falhasMx: string[] = [];
  for (const mx of registrosMx) {
    const resultado = await gravarRegistroDnsGenerico({
      type: "MX",
      name: dominio,
      content: mx.alvo,
      zona,
      priority: mx.prioridade,
    });
    if (!resultado.ok && resultado.aviso) falhasMx.push(resultado.aviso);
  }
  await registrar({
    chave: "dns_mx",
    titulo: "Registros MX",
    status: falhasMx.length ? "aviso" : "ok",
    detalhe: falhasMx.length
      ? falhasMx.join(" · ")
      : registrosMx.map((mx) => `${mx.alvo} (${mx.prioridade})`).join(", "),
  });
  const mxOk = await poll(4, 8_000, () => verificarMx(zoid, dominio));
  await registrar({
    chave: "verificar_mx",
    titulo: "Verificação do MX",
    status: mxOk ? "ok" : "aviso",
    detalhe: mxOk ? "MX validado no Zoho." : "Ainda não propagou.",
  });
  if (!mxOk) {
    return aguardarPropagacao(
      "verificar_mx",
      "Aguardando propagação dos registros MX",
      "Os MX foram criados automaticamente. Nova tentativa automática em instantes.",
    );
  }

  // Etapa 6 (cont.) — SPF + verificação
  const valorSpf = `v=spf1 include:${raizZoho()} ~all`;
  const spf = await gravarRegistroDnsGenerico({ type: "TXT", name: dominio, content: valorSpf, zona });
  await registrar({
    chave: "dns_spf",
    titulo: "Registro SPF",
    status: spf.ok ? "ok" : "erro",
    detalhe: spf.ok ? valorSpf : spf.aviso,
  });
  if (!spf.ok) return falhar("Não foi possível gravar o SPF no DNS", spf.aviso || "Falha no provedor de DNS.");

  const spfOk = await poll(4, 8_000, () => verificarSpf(zoid, dominio));
  await registrar({
    chave: "verificar_spf",
    titulo: "Verificação do SPF",
    status: spfOk ? "ok" : "aviso",
    detalhe: spfOk ? "SPF validado no Zoho." : "Ainda não propagou.",
  });
  if (!spfOk) {
    return aguardarPropagacao(
      "verificar_spf",
      "Aguardando propagação do SPF",
      "O SPF foi criado automaticamente. Nova tentativa automática em instantes.",
    );
  }

  // Etapa 7 — criar as caixas
  let existentes: string[] = [];
  try {
    existentes = (await listarContas(zoid)).map(emailDeConta).filter(Boolean).map((e) => e.toLowerCase());
  } catch (erro) {
    return falhar("Não foi possível consultar as caixas existentes", erro);
  }

  for (const email of exec.contas) {
    const chaveConta = `conta:${email}`;
    if (existentes.includes(email.toLowerCase())) {
      const detalheAnterior = exec.passos.find((passo) => passo.chave === chaveConta)?.detalhe || "";
      const senhaAnterior = detalheAnterior.match(/Senha provisória:\s*\S+/)?.[0];
      if (!exec.contasCriadas.some((conta) => conta.email.toLowerCase() === email.toLowerCase())) {
        exec.contasCriadas.push({ email, criadoEm: new Date().toISOString() });
      }
      await registrar({
        chave: chaveConta,
        titulo: `Caixa ${email}`,
        status: "ok",
        detalhe: senhaAnterior ? detalheAnterior : "Já existia.",
      });
      continue;
    }
    try {
      const senha = senhaProvisoria();
      const { zuid } = await criarConta(zoid, {
        email,
        senha,
        firstName: email.split("@")[0].slice(0, 30),
        lastName: exec.cliente.slice(0, 30) || "Cliente",
      });
      if (!exec.contasCriadas.some((conta) => conta.email.toLowerCase() === email.toLowerCase())) {
        exec.contasCriadas.push({ email, criadoEm: new Date().toISOString(), zuid });
      }
      await registrar({
        chave: chaveConta,
        titulo: `Caixa ${email}`,
        status: "ok",
        detalhe: `Senha provisória: ${senha} — troca obrigatória no 1º acesso.`,
      });
    } catch (erro) {
      await registrar({
        chave: chaveConta,
        titulo: `Caixa ${email}`,
        status: "erro",
        detalhe: erro instanceof Error ? erro.message : "Falha ao criar a caixa.",
      });
      exec.erro = "Uma ou mais caixas não foram criadas.";
    }
  }

  // Etapa 8 — relatório final
  const pendentes = exec.contas.length - exec.contasCriadas.length;
  exec.status = pendentes > 0 ? "erro" : "configurado";
  exec.concluidoEm = new Date().toISOString();
  await registrar({
    chave: "relatorio",
    titulo: pendentes > 0 ? "Concluído com pendências" : "E-mails configurados",
    status: pendentes > 0 ? "aviso" : "ok",
    detalhe: `${exec.contasCriadas.length}/${exec.contas.length} caixas · domínio ${dominio}`,
  });
  return gravarExecucao(exec);
}
