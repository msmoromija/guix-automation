/**
 * Cria marcadores .keep nas pastas da biblioteca no R2.
 * Uso: node --env-file=site/.env.local scripts/seed-r2-pastas.mjs
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const NICHOS = [
  "barbearia",
  "salao",
  "estetica",
  "petshop",
  "academia",
  "contabilidade",
  "advocacia",
  "clinica",
  "generico",
];
const CATS = ["hero", "servico", "sobre", "profissional", "galeria", "promocao", "evento"];

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET || "guix-imagens";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const keys = [];
for (const n of NICHOS) {
  for (const c of CATS) keys.push(`imagens/${n}/${c}/.keep`);
}

for (const Key of keys) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: "",
      ContentType: "text/plain",
    }),
  );
  console.log("ok", Key);
}

console.log(`Pronto: ${keys.length} pastas em ${bucket}`);
