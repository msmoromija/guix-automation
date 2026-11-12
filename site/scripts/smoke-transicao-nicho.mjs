import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const ts = require("typescript");
const Module = require("module");
const resolverOriginal = Module._resolveFilename;

Module._resolveFilename = function (request, parent, ...args) {
  const resolvido = request.startsWith("@/") ? path.join(root, request.slice(2)) : request;
  return resolverOriginal.call(this, resolvido, parent, ...args);
};

require.extensions[".ts"] = (modulo, arquivo) => {
  const fonte = fs.readFileSync(arquivo, "utf8");
  const compilado = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  modulo._compile(compilado, arquivo);
};

const {
  detectarNichoSolicitado,
  pedidoApenasTrocaNicho,
  prepararModeloParaTransicao,
} = require("../lib/estudio/troca-nicho.ts");
const { resolverMidia } = require("../lib/estudio/resolver-midia.ts");
const { BUSCA_FOTO } = require("../lib/media/catalogo.ts");
const { expedientePadrao, expedienteParaSchema } = require("../lib/estudio/expediente.ts");

const diasFechados = expedientePadrao().map((dia) => ({ ...dia, aberto: false, pausa: false }));
assert.deepEqual(expedienteParaSchema(diasFechados), []);
const somenteQuarta = expedientePadrao().map((dia) => ({
  ...dia,
  aberto: dia.dia === "qua",
  inicio: "10:00",
  fim: "12:00",
  pausa: false,
}));
assert.deepEqual(expedienteParaSchema(somenteQuarta), [
  { dia: "qua", label: "Quarta", intervalos: ["10:00", "10:30", "11:00", "11:30"] },
]);

const pedidoDentista = "Eu só pedi para ele alterar o nicho para dentista";
assert.equal(detectarNichoSolicitado(pedidoDentista), "dentista");
assert.equal(pedidoApenasTrocaNicho(pedidoDentista, "dentista"), true);

const pedidoContabilidade = "Troque o modelo de barbearia para contabilidade";
assert.equal(detectarNichoSolicitado(pedidoContabilidade), "contabilidade");
assert.equal(pedidoApenasTrocaNicho(pedidoContabilidade, "contabilidade"), true);

const pedidoNutricionista = "A barbearia agora é uma nutricionista, altere o modelo para este";
assert.equal(detectarNichoSolicitado(pedidoNutricionista), "nutricionista");
assert.equal(pedidoApenasTrocaNicho(pedidoNutricionista, "nutricionista"), true);

const pedidoComposto = "Troque o modelo de barbearia para dentista e troque todas as fotos";
assert.equal(detectarNichoSolicitado(pedidoComposto), "dentista");
assert.equal(pedidoApenasTrocaNicho(pedidoComposto, "dentista"), false);

const modeloOriginal = JSON.parse(fs.readFileSync(path.join(root, "content/exemplos/dentista.site.json"), "utf8"));
const expediente = [{ dia: "seg", label: "Segunda", intervalos: ["09:00", "09:30"] }];
const modelo = prepararModeloParaTransicao(modeloOriginal, "dentista", {
  nome: "Odonto Aurora",
  whatsapp: "5571999990000",
  email: "contato@odontoaurora.com.br",
  cidade: "Salvador",
  estado: "BA",
  enderecoCompleto: "Rua das Flores, 10, Salvador - BA",
  redes: { instagram: "https://instagram.com/odontoaurora" },
  horario: "Segunda, 9h às 10h",
  expediente,
});
const empresa = modelo.empresa;
const textoModelo = JSON.stringify(modelo);

assert.equal(empresa.nome, "Odonto Aurora");
assert.equal(empresa.whatsapp, "5571999990000");
assert.equal(empresa.email, "contato@odontoaurora.com.br");
assert.equal(empresa.endereco.completo, "Rua das Flores, 10, Salvador - BA");
assert.deepEqual(empresa.expediente, expediente);
assert.equal(empresa.redes[0].url, "https://instagram.com/odontoaurora");
assert.equal(modelo.profissionais.itens.length, 0);
assert.equal(modelo.promocoes.itens.length, 0);
assert.equal(modelo.eventos.itens.length, 0);
assert.ok(modelo.servicos.itens.every((item) => (
  item.preco === 0 &&
  item.preco_label === "Consulte valores" &&
  item.duracao_minutos === 0 &&
  item.duracao_label === "A confirmar"
)));
assert.ok(!textoModelo.includes("Consultório Costa Clara"));
assert.ok(!textoModelo.includes("Marina Costa"));
assert.ok(!textoModelo.includes("R$ 250"));
assert.ok(!textoModelo.includes("30/11/2026"));
assert.ok(modelo.servicos.itens.every((item) => item.imagem.alt === "Imagem ilustrativa"));

const semHorario = prepararModeloParaTransicao(modeloOriginal, "dentista");
assert.deepEqual(semHorario.empresa.expediente, []);
assert.equal(semHorario.empresa.horario_resumo, "");

const fetchOriginal = globalThis.fetch;
process.env.UNSPLASH_ACCESS_KEY = "smoke-test";
const consultas = [];
globalThis.fetch = async (entrada) => {
  const url = new URL(String(entrada));
  consultas.push(url.searchParams.get("query"));
  return new Response(JSON.stringify({
    results: [{
      id: "imagem-dentista",
      description: "Dental clinic",
      alt_description: "Dental clinic",
      urls: {
        thumb: "https://images.unsplash.com/photo-test?fit=crop",
        regular: "https://images.unsplash.com/photo-test?fit=crop",
        full: "https://images.unsplash.com/photo-test?fit=crop",
      },
      links: {
        html: "https://unsplash.com/photos/test",
        download_location: "https://api.unsplash.com/photos/test/download",
      },
      user: { name: "Photographer", links: { html: "https://unsplash.com/@photographer" } },
    }],
  }), { status: 200, headers: { "content-type": "application/json" } });
};

try {
  const resultadoMidia = await resolverMidia({
    midia: {
      fotos: [
        { slot: "hero", indice: 0, busca: "barber shop haircut" },
        { slot: "profissional", indice: 0, busca: "woman dentist portrait" },
      ],
    },
  }, "dentista");
  assert.deepEqual(consultas, [BUSCA_FOTO.dentista.query.hero]);
  assert.ok(resultadoMidia.midia.fotos[0].src);
  assert.equal(resultadoMidia.midia.fotos[1].src, undefined);
  assert.match(resultadoMidia.aviso_estrutura, /Retratos da equipe não são escolhidos automaticamente/);
} finally {
  globalThis.fetch = fetchOriginal;
  delete process.env.UNSPLASH_ACCESS_KEY;
}

console.log("OK transição de nicho: destino, conteúdo demonstrativo e dados fornecidos");
