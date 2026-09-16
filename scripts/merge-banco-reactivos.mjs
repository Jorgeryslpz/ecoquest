// Combina los 11 archivos del banco real (data/banco_2231/*.json) en
// supabase/seed/reactivos.json, con el mapeo exacto a las columnas de la
// tabla `reactivos` (ver supabase/migrations/0001_init_schema.sql).
//
// Uso: node scripts/merge-banco-reactivos.mjs
//
// Mapeo de columnas (el banco real ya trae los nombres de campo correctos,
// solo dos cosas necesitan conversión):
//   - dificultad: el banco trae "fácil"/"media"/"difícil" (texto); la tabla
//     usa smallint 1/2/3 con CHECK (dificultad in (1,2,3)). Se mapea aquí.
//   - id_texto: el banco no lo trae (cada reactivo de comprensión repite su
//     propio texto_lectura en vez de compartir un id). Se deja en null;
//     no rompe nada, solo no deduplica el texto en la base de datos.
//
// "Historia de México" e "Historia Universal" se mantienen como dos
// asignaturas separadas (decisión confirmada: no hay fuente oficial
// gratuita que aclare el desglose sin la guía completa de
// miderechomilugar.gob.mx, y el banco real ya las desarrolla por separado
// con 200 reactivos cada una). La spec §0 quedó actualizada a 11 materias,
// con la cuota de 12 que tenía "Historia" combinada dividida en 6 y 6.

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const bancoDir = path.join(root, "data/banco_2231");

const DIFICULTAD_MAP = { "fácil": 1, "media": 2, "difícil": 3 };

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

// asignatura tal como viene en el archivo -> asignatura canónica (aquí no
// se renombra nada; el banco ya trae los 11 nombres correctos)
const ASIGNATURA_MAP = Object.fromEntries(
  MATERIAS_VALIDAS.map((m) => [m, { asignatura: m, prefijoSubtemario: null }])
);

async function main() {
  const archivos = (await readdir(bancoDir)).filter((f) => f.endsWith(".json"));
  const reactivos = [];
  const idsVistos = new Set();
  const resumenPorAsignatura = {};

  for (const archivo of archivos) {
    const raw = JSON.parse(await readFile(path.join(bancoDir, archivo), "utf-8"));
    const items = Array.isArray(raw) ? raw : Object.values(raw).find((v) => Array.isArray(v));
    if (!items) throw new Error(`${archivo}: no encontré un arreglo de reactivos.`);

    for (const it of items) {
      const map = ASIGNATURA_MAP[it.asignatura];
      if (!map) throw new Error(`${archivo}: asignatura sin mapeo "${it.asignatura}".`);

      if (idsVistos.has(it.id_reactivo)) {
        throw new Error(`id_reactivo duplicado: ${it.id_reactivo}`);
      }
      idsVistos.add(it.id_reactivo);

      if (!["A", "B", "C", "D"].every((k) => k in it.opciones)) {
        throw new Error(`${it.id_reactivo}: faltan opciones A-D.`);
      }
      if (!["A", "B", "C", "D"].includes(it.respuesta_correcta)) {
        throw new Error(`${it.id_reactivo}: respuesta_correcta inválida "${it.respuesta_correcta}".`);
      }

      const dificultad = DIFICULTAD_MAP[it.dificultad];
      if (!dificultad) {
        throw new Error(`${it.id_reactivo}: dificultad desconocida "${it.dificultad}".`);
      }

      const subtemario = map.prefijoSubtemario
        ? `${map.prefijoSubtemario}: ${it.subtemario}`
        : it.subtemario ?? null;

      reactivos.push({
        id_reactivo: it.id_reactivo,
        asignatura: map.asignatura,
        subtemario,
        dificultad,
        id_texto: null,
        texto_lectura: it.texto_lectura ?? null,
        enunciado: it.enunciado,
        opciones: it.opciones,
        respuesta_correcta: it.respuesta_correcta,
        feedback: it.feedback,
      });

      resumenPorAsignatura[map.asignatura] = (resumenPorAsignatura[map.asignatura] ?? 0) + 1;
    }
  }

  for (const r of reactivos) {
    if (!MATERIAS_VALIDAS.includes(r.asignatura)) {
      throw new Error(`Asignatura fuera de las 11 canónicas: ${r.asignatura}`);
    }
  }

  const outPath = path.join(root, "supabase/seed/reactivos.json");
  await writeFile(outPath, JSON.stringify(reactivos, null, 2), "utf-8");

  console.log(`✔ ${reactivos.length} reactivos combinados → ${path.relative(root, outPath)}`);
  for (const [m, n] of Object.entries(resumenPorAsignatura).sort()) {
    console.log(`  ${m.padEnd(28)} ${n}`);
  }
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});
