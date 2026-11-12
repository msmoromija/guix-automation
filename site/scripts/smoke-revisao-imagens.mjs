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

const { limparIdentidadeExemplo, repararParaSchema } = require("../lib/automacao/limpar-exemplo.ts");
const { revisarSiteFinal } = require("../lib/estudio/revisao-final.ts");
const { escolherImagensDoNicho } = require("../lib/media/escolher-imagens.ts");
const { aplicarPedido } = require("../lib/estudio/aplicar-pedido.ts");
const { visualPadrao } = require("../lib/estudio/visual.ts");

const modeloDentista = JSON.parse(
  fs.readFileSync(path.join(root, "content/exemplos/dentista.site.json"), "utf8"),
);
const limpo = limparIdentidadeExemplo(structuredClone(modeloDentista), {
  clienteId: "smoke-cliente",
  nicho: "dentista",
  nome: "Odonto Aurora",
});
assert.equal(limpo.profissionais.itens.length, 0, "não herdar equipe e retratos do modelo");

const reparado = repararParaSchema(limpo, {
  clienteId: "smoke-cliente",
  nicho: "dentista",
  nome: "Odonto Aurora",
});
assert.ok(
  reparado.empresa.expediente.every((dia) => dia.intervalos.length === 0),
  "não criar horários sem confirmação",
);

const modeloSalao = JSON.parse(
  fs.readFileSync(path.join(root, "content/exemplos/salao.site.json"), "utf8"),
);
const equipeOriginal = modeloSalao.profissionais.itens;
const modeloComDuplicata = structuredClone(modeloSalao);
modeloComDuplicata.profissionais.itens.push({
  ...structuredClone(equipeOriginal[0]),
  id: "pro_helena_duplicada",
  foto: { id: "img_sem_foto", src: "", alt: "Helena Prado" },
});
const equipeNormalizada = repararParaSchema(modeloComDuplicata, {
  clienteId: "smoke-cliente",
  nicho: "salao",
  nome: "Salão Aurora",
});
assert.equal(
  equipeNormalizada.profissionais.itens.length,
  equipeOriginal.length,
  "remover duplicatas de equipe na normalização do site",
);
assert.ok(equipeNormalizada.profissionais.itens[0].foto.src, "preservar retrato no registro mantido");

const resultadoEquipe = aplicarPedido(
  structuredClone(modeloSalao),
  visualPadrao("salao"),
  {
    profissionais: {
      acrescentar: [
        {
          nome: equipeOriginal[0].nome,
          cargo: equipeOriginal[0].cargo,
          descricao: equipeOriginal[0].descricao,
        },
      ],
    },
  },
  "salao",
);
assert.equal(
  resultadoEquipe.site.profissionais.itens.length,
  equipeOriginal.length,
  "não acrescentar um profissional que já está na equipe",
);
assert.ok(
  resultadoEquipe.site.profissionais.itens[0].foto.src,
  "manter a foto já associada ao registro original",
);

const fetchOriginal = globalThis.fetch;
const envOriginal = {
  unsplash: process.env.UNSPLASH_ACCESS_KEY,
  openai: process.env.OPENAI_API_KEY,
  site: process.env.NEXT_PUBLIC_SITE_URL,
  vercel: process.env.VERCEL_URL,
  r2: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].map((key) => process.env[key]),
};
process.env.UNSPLASH_ACCESS_KEY = "smoke-test";
delete process.env.R2_ACCOUNT_ID;
delete process.env.R2_ACCESS_KEY_ID;
delete process.env.R2_SECRET_ACCESS_KEY;

try {
  globalThis.fetch = async (entrada) => {
    const url = new URL(String(entrada));
    assert.equal(url.hostname, "api.unsplash.com");
    return new Response(
      JSON.stringify({
        results: Array.from({ length: 12 }, (_, indice) => ({
          id: `foto-${indice}`,
          description: "Dental clinic",
          alt_description: "Dental clinic",
          urls: {
            thumb: `https://images.unsplash.com/foto-${indice}?fit=crop`,
            regular: `https://images.unsplash.com/foto-${indice}?fit=crop`,
            full: `https://images.unsplash.com/foto-${indice}?fit=crop`,
          },
          links: {
            html: `https://unsplash.com/photos/foto-${indice}`,
            download_location: `https://api.unsplash.com/photos/foto-${indice}/download`,
          },
          user: { name: "Photographer", links: { html: "https://unsplash.com/@photographer" } },
        })),
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const imagens = await escolherImagensDoNicho({
    nicho: "dentista",
    sugestoes: Array.from({ length: 6 }, (_, indice) => ({
      categoria: "galeria",
      tags: ["consultorio", "odontologia"],
      motivo: `ambiente ${indice + 1}`,
    })),
  });
  assert.equal(imagens.length, 6);
  assert.equal(new Set(imagens.map((imagem) => imagem.src)).size, 6, "não repetir foto dentro do mesmo site");
} finally {
  globalThis.fetch = fetchOriginal;
}

process.env.OPENAI_API_KEY = "smoke-test";
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.VERCEL_URL;
let revisoes = 0;
globalThis.fetch = async (entrada) => {
  assert.match(String(entrada), /api\.openai\.com/);
  revisoes += 1;
  const resultado =
    revisoes === 1
      ? {
          correcoes: [
            {
              caminho: "hero.titulo",
              valor: "Atendimento odontológico cuidadoso",
              motivo: "coerência com o segmento",
            },
            {
              caminho: "empresa.endereco.completo",
              valor: "Rua inventada, 99",
              motivo: "sugestão insegura",
            },
          ],
          imagens_problematicas: [],
          pendencias: [{ caminho: "empresa.endereco.completo", motivo: "Confirme o endereço real." }],
          resumo: "Revisão inicial.",
        }
      : {
          correcoes: [],
          imagens_problematicas: [],
          pendencias: [{ caminho: "empresa.endereco.completo", motivo: "Confirme o endereço real." }],
          resumo: "Há uma pendência de confirmação.",
        };
  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(resultado) } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

try {
  const revisao = await revisarSiteFinal({
    nicho: "dentista",
    pedido: "Revise o site inteiro",
    fatosConfirmados: { nome: "Odonto Aurora", endereco: "Av. Central, 10" },
    site: {
      meta: { nicho: "dentista" },
      empresa: { nome: "Odonto Aurora", endereco: { completo: "Av. Central, 10" } },
      hero: { titulo: "Barbearia", imagem: { src: "/uploads/foto.jpg", alt: "Ambiente clínico" } },
    },
  });
  assert.equal(revisoes, 2, "verificar novamente após aplicar correções");
  assert.equal(revisao.site.hero.titulo, "Atendimento odontológico cuidadoso");
  assert.equal(revisao.site.empresa.endereco.completo, "Av. Central, 10", "não inventar endereço");
  assert.equal(revisao.revisado, false, "não declarar revisão completa com imagem inacessível");
  assert.match(revisao.aviso, /não puderam ser inspecionadas|não puderam ser inspecionada/i);
} finally {
  globalThis.fetch = fetchOriginal;
  for (const [key, value] of [
    ["UNSPLASH_ACCESS_KEY", envOriginal.unsplash],
    ["OPENAI_API_KEY", envOriginal.openai],
    ["NEXT_PUBLIC_SITE_URL", envOriginal.site],
    ["VERCEL_URL", envOriginal.vercel],
  ]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].forEach((key, indice) => {
    const value = envOriginal.r2[indice];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
}

console.log("OK rotação de imagens, equipe sem duplicatas e revisão segura");
