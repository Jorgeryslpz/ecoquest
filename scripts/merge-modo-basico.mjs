// Valida data/modo_basico_330.json (11 materias × 3 niveles × 10 = 330) y
// lo copia a supabase/seed/modo_basico.json. El archivo ya trae los campos
// con el nombre exacto de las columnas de modo_basico_items, así que no
// hace falta transformar nada — solo validar.
//
// Uso: node scripts/merge-modo-basico.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MATERIAS_VALIDAS = [
  "Español",
  "Habilidad Verbal",
  "Matemáticas",
  "Habilidad Matemática",
  "Biología",
  "Física",
  "Química",
  "Historia de México",
  "Historia Universal",
  "Geografía",
  "Formación Cívica y Ética",
];

async function main() {
  const rawPath = path.join(root, "data/modo_basico_330.json");
  const items = JSON.parse(await readFile(rawPath, "utf-8"));

  const idsVistos = new Set();
  const resumen = {};

  for (const it of items) {
    if (idsVistos.has(it.id_item)) throw new Error(`id_item duplicado: ${it.id_item}`);
    idsVistos.add(it.id_item);

    if (!MATERIAS_VALIDAS.includes(it.asignatura)) {
      throw new Error(`${it.id_item}: asignatura desconocida "${it.asignatura}".`);
    }
    if (![1, 2, 3].includes(it.nivel)) {
      throw new Error(`${it.id_item}: nivel inválido "${it.nivel}".`);
    }
    if (!Array.isArray(it.opciones) || it.opciones.length !== 4) {
      throw new Error(`${it.id_item}: debe tener exactamente 4 opciones.`);
    }
    if (!it.opciones.includes(it.respuesta_correcta)) {
      throw new Error(`${it.id_item}: respuesta_correcta no está en opciones.`);
    }
    if (!it.oracion.includes("___")) {
      throw new Error(`${it.id_item}: la oración no trae el hueco "___".`);
    }

    const key = `${it.asignatura} · nivel ${it.nivel}`;
    resumen[key] = (resumen[key] ?? 0) + 1;
  }

  const outPath = path.join(root, "supabase/seed/modo_basico.json");
  await writeFile(outPath, JSON.stringify(items, null, 2), "utf-8");

  console.log(`✔ ${items.length} ítems validados → ${path.relative(root, outPath)}`);
  for (const [k, n] of Object.entries(resumen).sort()) {
    if (n !== 10) console.log(`  ⚠ ${k}: ${n} (se esperaban 10)`);
  }
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});
