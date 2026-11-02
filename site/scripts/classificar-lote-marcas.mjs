import { mkdir, readdir, copyFile } from "node:fs/promises";
import path from "node:path";

const origem = path.resolve("tmp-marcas-lote");
const files = (await readdir(origem)).filter((n) => /\.jpe?g$/i.test(n) && !n.startsWith("_")).sort();

/** Índices do contato visual da folha (ordem alfabética = ordem do zip). */
const mapa = {
  estetica: [...Array.from({ length: 23 }, (_, i) => i)],
  petshop: [...Array.from({ length: 15 }, (_, i) => i + 23)],
  academia: [...Array.from({ length: 16 }, (_, i) => i + 38)],
  contabilidade: [54, 55, 56, 57, 59, 60, 61, 62, 63, 64, 65, 66, 67],
  advocacia: [58, ...Array.from({ length: 16 }, (_, i) => i + 68)],
};

for (const [nicho, idxs] of Object.entries(mapa)) {
  const dest = path.resolve(`tmp-marcas-${nicho}`);
  await mkdir(dest, { recursive: true });
  let n = 0;
  for (const i of idxs) {
    const nome = files[i];
    if (!nome) continue;
    n += 1;
    await copyFile(path.join(origem, nome), path.join(dest, nome));
  }
  console.log(nicho, n, "arquivos");
}
