import { carregarExemplo } from "../lib/automacao/carregar-exemplo";
import { limparIdentidadeExemplo, repararParaSchema } from "../lib/automacao/limpar-exemplo";
import { validarSiteJson } from "../lib/automacao/validar-site";
import { aplicarEstudio, minutosDeRotulo, tituloVenha } from "../lib/estudio/aplicar";
import { visualPadrao } from "../lib/estudio/visual";

async function main() {
  const falhas: string[] = [];
  const ok = (cond: boolean, msg: string) => {
    if (!cond) falhas.push(msg);
  };

  ok(minutosDeRotulo("1 h") === 60, "1 h");
  ok(minutosDeRotulo("1h30") === 90, "1h30");
  ok(tituloVenha("Atalaia") === "Venha à Atalaia", "venha atalaia");
  ok(tituloVenha(undefined, "Aracaju") === "Venha a Aracaju", "venha cidade");

  const bruto = await carregarExemplo("barbearia");
  const end = ((bruto.empresa as { endereco?: { bairro?: string; cidade?: string } }).endereco || {});
  const site = limparIdentidadeExemplo(structuredClone(bruto), {
    clienteId: "t_smoke",
    nicho: "barbearia",
    nome: "A Corte do Marco",
  });
  ok(!("__guix_modelo" in site), "sem campo extra no site");
  ok(Array.isArray((site.promocoes as { itens?: unknown[] }).itens) && (site.promocoes as { itens: unknown[] }).itens.length === 0, "sem promoções do exemplo");
  ok(Array.isArray((site.eventos as { itens?: unknown[] }).itens) && (site.eventos as { itens: unknown[] }).itens.length === 0, "sem eventos do exemplo");

  aplicarEstudio(site, {
    entrada: {
      clienteId: "t_smoke",
      nicho: "barbearia",
      nome: "A Corte do Marco",
      slogan: "Corte na hora",
      cidade: "Aracaju",
      estado: "SE",
    },
    visual: visualPadrao("barbearia"),
    servicos: [{ nome: "Corte", preco: "Sob consulta", duracao: "1 h", descricao: "Corte masculino." }],
    aplicarServicos: true,
    aplicarProfissionais: true,
    preservarModeloQuandoVazio: true,
    bairroModelo: end.bairro,
    cidadeModelo: end.cidade,
  });
  repararParaSchema(site, {
    clienteId: "t_smoke",
    nicho: "barbearia",
    nome: "A Corte do Marco",
    cidade: "Aracaju",
    estado: "SE",
  });

  const texto = JSON.stringify(site);
  ok(!texto.includes("__guix_modelo"), "schema limpo");
  ok(!/Jardins/i.test(texto), "sem bairro do exemplo");
  ok(!/Vila Norte/i.test(texto), "sem marca do exemplo");
  ok((site.contato as { titulo?: string }).titulo === "Venha a Aracaju", "contato usa a cidade do cliente");
  ok((site.empresa as { email?: string }).email === "nao-informado@guix.invalid", "email não fictício entregável");
  const item = ((site.servicos as { itens: Array<{ preco: number; duracao_minutos: number; preco_label: string }> }).itens)[0];
  ok(item.preco === 0 && item.duracao_minutos === 60 && item.preco_label === "Sob consulta", "preço e duração do cliente");

  const validacao = await validarSiteJson(site);
  ok(validacao.ok, validacao.ok ? "schema" : validacao.erros.slice(0, 6).join(" | "));

  if (falhas.length) {
    console.error(falhas.join("\n"));
    process.exit(1);
  }
  console.log("smoke ok");
}

void main();
