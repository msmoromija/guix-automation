#!/usr/bin/env node
/**
 * Monta o projeto do site-cliente a partir de uma pasta de pacote GuiX já extraída
 * (meta.json + site.json + visual.json + assets/).
 *
 * Uso:
 *   node scripts/montar-projeto-cliente.mjs --pacote caminho/pasta-extraida [--cliente slug] [--out clientes/slug/repo]
 *
 * O que faz:
 * 1. Lê meta/site/visual/fonts do pacote
 * 2. Copia o template prototipos/<nicho>
 * 3. Injeta site.json + visual + assets em public/assets
 * 4. Gera config/dna.json, CHECKLIST.md e faz git init
 */
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import {
  ROOT,
  arg,
  flag,
  existe,
  localizarRaizPacote,
  lerJson,
  normalizarSrcAssets,
  copiarTemplateNicho,
  copiarAssets,
  resolverNicho,
  montarClienteId,
} from "./lib/pacote-utils.mjs";

const pacoteIn = arg("pacote");
if (!pacoteIn) {
  console.error(
    "Uso: node scripts/montar-projeto-cliente.mjs --pacote <pasta-do-zip-extraido> [--cliente slug] [--out pasta] [--skip-git]",
  );
  process.exit(1);
}

const raiz = await localizarRaizPacote(path.resolve(pacoteIn));
const meta = (await lerJson(path.join(raiz, "meta.json"), false)) || {};
const siteBruto = await lerJson(path.join(raiz, "site.json"), true);
const visual = (await lerJson(path.join(raiz, "visual.json"), false)) || {};
const fonts = (await lerJson(path.join(raiz, "fonts.json"), false)) || {};
const manifesto = (await lerJson(path.join(raiz, "manifesto.json"), false)) || [];

const nicho = resolverNicho(meta, siteBruto);
const clienteId = montarClienteId(meta, arg("cliente"));
const nome = String(meta.nome || siteBruto?.empresa?.nome || clienteId);
const outRepo = path.resolve(
  ROOT,
  arg("out", path.join("clientes", clienteId, "repo")),
);

console.log(`→ nicho: ${nicho}`);
console.log(`→ cliente: ${clienteId}`);
console.log(`→ destino: ${outRepo}`);

await copiarTemplateNicho(nicho, outRepo);

const site = normalizarSrcAssets(siteBruto);
if (fonts.font_heading || fonts.font_body) {
  site.tema = {
    ...(site.tema || {}),
    ...(fonts.font_heading ? { font_heading: fonts.font_heading } : {}),
    ...(fonts.font_body ? { font_body: fonts.font_body } : {}),
  };
}

const contentDir = path.join(outRepo, "src", "content");
await mkdir(contentDir, { recursive: true });
await writeFile(path.join(contentDir, "site.json"), JSON.stringify(site, null, 2), "utf8");

const configDir = path.join(outRepo, "config");
await mkdir(configDir, { recursive: true });
await writeFile(path.join(configDir, "site.json"), JSON.stringify(site, null, 2), "utf8");
await writeFile(path.join(configDir, "visual.json"), JSON.stringify(visual, null, 2), "utf8");
await writeFile(path.join(configDir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
await writeFile(path.join(configDir, "fonts.json"), JSON.stringify(fonts, null, 2), "utf8");
await writeFile(path.join(configDir, "manifesto.json"), JSON.stringify(manifesto, null, 2), "utf8");

const org = process.env.GUIX_SITES_GIT_ORG || "guix-sites";
const dna = {
  versao: "1.0.0",
  clienteId,
  nicho,
  nome,
  token: meta.token || "",
  geradoEm: new Date().toISOString(),
  origemPacote: path.relative(ROOT, raiz),
  conectividade: {
    agendamento: visual.agendamento !== false,
    whatsappFlutuante: visual.whatsappFlutuante !== false,
    otpEmail: true,
    otpSms: true,
    notificarNegocioWhatsapp: true,
    notificarNegocioEmail: true,
    cancelamentoAntecedenciaHoras: 3,
    modoConfirmacaoAgenda: visual.modoConfirmacaoAgenda || "automatico",
  },
  supabase: {
    habilitado: false,
    tabelas: ["clientes", "agendamentos", "sessoes_otp", "mensagens"],
    authClientes: true,
  },
  git: {
    repoSugerido: `site-${clienteId}`,
    branchPadrao: "main",
    org,
  },
};
await writeFile(path.join(configDir, "dna.json"), JSON.stringify(dna, null, 2), "utf8");

const assets = await copiarAssets(raiz, outRepo);
console.log(`→ assets: ${assets.copiados} arquivo(s)`);

const checklist = `# Checklist — ${nome}

Gerado automaticamente a partir do pacote GuiX (\`${meta.token || clienteId}\`).

## Já feito pelo script
- [x] Template \`prototipos/${nicho}\` copiado
- [x] \`src/content/site.json\` injetado
- [x] \`config/visual.json\`, \`meta.json\`, \`dna.json\`
- [x] Assets em \`public/assets/\` (${assets.copiados})

## Próximos passos (publicação)
1. \`cd ${path.relative(ROOT, outRepo).replace(/\\\\/g, "/")}\`
2. \`npm install\`
3. \`npm run dev\` — conferir textos, fotos, WhatsApp e agenda
4. Criar repo remoto: \`${org}/site-${clienteId}\`
5. \`git remote add origin … && git push -u origin main\`
6. Deploy Vercel (root = esta pasta) + domínio do cliente
7. Configurar e-mail profissional @domínio
8. Marcar **Publicado** em https://guix.net.br/painel/aprovacoes

## Contato do pacote
- WhatsApp: ${meta.whatsapp || "—"}
- E-mail: ${meta.email || "—"}
- Cidade: ${meta.cidade || "—"}
`;

await writeFile(path.join(outRepo, "CHECKLIST.md"), checklist, "utf8");

await writeFile(
  path.join(outRepo, "GUIX.md"),
  `# ${nome}

Site-cliente montado pelo motor GuiX a partir do ZIP de entrega.

| Campo | Valor |
| --- | --- |
| Cliente | \`${clienteId}\` |
| Nicho | ${nicho} |
| Token | \`${meta.token || "—"}\` |
| Repo | \`${org}/site-${clienteId}\` |

Comandos:

\`\`\`bash
npm install
npm run dev
npm run build
\`\`\`
`,
  "utf8",
);

// package.json name
try {
  const pkgPath = path.join(outRepo, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.name = `site-${clienteId}`;
  pkg.private = true;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
} catch {
  /* template sem package.json */
}

if (!flag("skip-git")) {
  const gitDir = path.join(outRepo, ".git");
  if (!(await existe(gitDir))) {
    const init = spawnSync("git", ["init", "-b", "main"], { cwd: outRepo, encoding: "utf8" });
    if (init.status !== 0) {
      console.warn("git init falhou:", init.stderr || init.stdout);
    } else {
      spawnSync("git", ["add", "."], { cwd: outRepo, encoding: "utf8" });
      spawnSync(
        "git",
        ["commit", "-m", `chore: monta site ${clienteId} a partir do pacote GuiX`],
        { cwd: outRepo, encoding: "utf8" },
      );
      console.log("→ git: commit inicial");
    }
  }
}

console.log("");
console.log("ok projeto montado");
console.log(`  pasta: ${outRepo}`);
console.log(`  repo sugerido: ${org}/site-${clienteId}`);
console.log(`  checklist: ${path.join(outRepo, "CHECKLIST.md")}`);
