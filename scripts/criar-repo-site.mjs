#!/usr/bin/env node
/**
 * Monta a pasta git de um site-cliente a partir do DNA GuiX + site.json.
 *
 * Uso:
 *   node scripts/criar-repo-site.mjs --cliente lucia-batos --nicho estetica --nome "Lucia Batos" --site path/to/site.json
 *
 * Gera:
 *   clientes/<cliente>/repo/   (git init + README + DNA + site.json)
 *
 * Próximo passo (manual ou CI): git remote add + push para GUIX_SITES_GIT_ORG.
 */
import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] || fallback;
}

function slug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const cliente = slug(arg("cliente"));
const nicho = arg("nicho", "generico");
const nome = arg("nome", cliente || "Negócio");
const sitePath = arg("site", "");
const outRoot = path.resolve(root, arg("out", path.join("clientes", cliente || "demo", "repo")));

if (!cliente) {
  console.error("Uso: --cliente id [--nicho estetica] [--nome Nome] [--site site.json] [--out pasta]");
  process.exit(1);
}

const dna = {
  versao: "1.0.0",
  clienteId: cliente,
  nicho,
  nome,
  geradoEm: new Date().toISOString(),
  conectividade: {
    agendamento: true,
    whatsappFlutuante: true,
    otpEmail: true,
    otpSms: true,
    notificarNegocioWhatsapp: true,
    notificarNegocioEmail: true,
    cancelamentoAntecedenciaHoras: 3,
  },
  supabase: {
    habilitado: false,
    tabelas: ["clientes", "agendamentos", "sessoes_otp", "mensagens"],
    authClientes: true,
    nota: "Ligar SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no deploy do cliente.",
  },
  git: {
    repoSugerido: `site-${cliente}`,
    branchPadrao: "main",
    org: process.env.GUIX_SITES_GIT_ORG || "guix-sites",
  },
  env: {
    obrigatorias: ["NEXT_PUBLIC_SITE_URL"],
    opcionais: ["RESEND_API_KEY", "TWILIO_ACCOUNT_SID", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  },
};

await mkdir(outRoot, { recursive: true });
await mkdir(path.join(outRoot, "config"), { recursive: true });
await mkdir(path.join(outRoot, "supabase"), { recursive: true });

await writeFile(path.join(outRoot, "config", "dna.json"), JSON.stringify(dna, null, 2), "utf8");

if (sitePath) {
  const abs = path.resolve(process.cwd(), sitePath);
  await access(abs);
  const raw = await readFile(abs, "utf8");
  JSON.parse(raw);
  await writeFile(path.join(outRoot, "config", "site.json"), raw, "utf8");
} else {
  await writeFile(
    path.join(outRoot, "config", "site.json"),
    JSON.stringify({ schema_version: "1.0.0", empresa: { nome }, _nota: "Substitua pelo site.json gerado pelo motor." }, null, 2),
    "utf8",
  );
}

await writeFile(
  path.join(outRoot, "supabase", "README.md"),
  `# Supabase — ${nome}

Tabelas DNA: \`clientes\`, \`agendamentos\`, \`sessoes_otp\`, \`mensagens\`.

1. Crie o projeto no Supabase.
2. Rode as migrations quando o motor publicar \`migrations/\`.
3. Preencha \`SUPABASE_URL\` e chaves no deploy do site.
`,
  "utf8",
);

await writeFile(
  path.join(outRoot, "README.md"),
  `# ${nome}

Site-cliente GuiX (\`${cliente}\` / ${nicho}).

## DNA
- Agendamento + OTP + WhatsApp/e-mail de notificação
- Supabase preparado (ainda off até ligar as envs)
- Repo sugerido: \`${dna.git.org}/site-${cliente}\`

## Conteúdo
- \`config/site.json\` — contrato 1.0.0
- \`config/dna.json\` — conectividade e provisionamento

Gerado por \`scripts/criar-repo-site.mjs\`.
`,
  "utf8",
);

await writeFile(
  path.join(outRoot, ".gitignore"),
  `node_modules/\n.env\n.env.local\n.DS_Store\ndist/\n.next/\n`,
  "utf8",
);

const gitDir = path.join(outRoot, ".git");
try {
  await access(gitDir);
} catch {
  const init = spawnSync("git", ["init", "-b", "main"], { cwd: outRoot, encoding: "utf8" });
  if (init.status !== 0) {
    console.error(init.stderr || "git init falhou");
    process.exit(1);
  }
  spawnSync("git", ["add", "."], { cwd: outRoot, encoding: "utf8" });
  spawnSync("git", ["commit", "-m", "chore: DNA inicial do site-cliente GuiX"], { cwd: outRoot, encoding: "utf8" });
}

console.log(`ok ${outRoot}`);
console.log(`repo sugerido: ${dna.git.org}/site-${cliente}`);
console.log(`próximo: cd ${outRoot} && git remote add origin … && git push -u origin main`);
