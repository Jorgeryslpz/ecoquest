// Convierte data/banco_maestro_raw.json (formato original entregado) al
// esquema canónico de la spec §8.1 y lo guarda en supabase/seed/reactivos.json.
//
// Uso: node scripts/transform-banco-maestro.mjs
//
// IMPORTANTE: el archivo original NO trae `subtemario` ni `dificultad` por
// reactivo. Para no inventar contenido que no nos dieron, este script deja
// subtemario en null y dificultad en 2 (media) para todos — son huecos
// reales del banco, no datos inventados. Ver el resumen que imprime al final.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MATERIA_MAP = {
  "ESPAÑOL": { nombre: "Español", prefijo: "ESP" },
  "HABILIDAD VERBAL": { nombre: "Habilidad Verbal", prefijo: "HVE" },
  "MATEMÁTICAS": { nombre: "Matemáticas", prefijo: "MAT" },
  "HABILIDAD MATEMÁTICA": { nombre: "Habilidad Matemática", prefijo: "HMA" },
  "BIOLOGÍA": { nombre: "Biología", prefijo: "BIO" },
  "FÍSICA": { nombre: "Física", prefijo: "FIS" },
  "QUÍMICA": { nombre: "Química", prefijo: "QUI" },
  "HISTORIA": { nombre: "Historia", prefijo: "HIS" },
  "GEOGRAFÍA": { nombre: "Geografía", prefijo: "GEO" },
  "FORMACIÓN CÍVICA Y ÉTICA": { nombre: "Formación Cívica y Ética", prefijo: "FCE" },
};

async function main() {
  const rawPath = path.join(root, "data/banco_maestro_raw.json");
  const raw = JSON.parse(await readFile(rawPath, "utf-8"));

  const reactivos = [];
  const resumen = [];

  for (const materiaBloque of raw.materias) {
    const map = MATERIA_MAP[materiaBloque.nombre];
    if (!map) {
      throw new Error(`Materia sin mapeo: "${materiaBloque.nombre}"`);
    }
    let n = 0;
    for (const r of materiaBloque.reactivos) {
      n++;
      const id_reactivo = `${map.prefijo}-${String(n).padStart(2, "0")}`;
      const opciones = r.opciones;
      if (!["A", "B", "C", "D"].every((k) => k in opciones)) {
        throw new Error(`${id_reactivo}: faltan opciones A-D`);
      }
      if (!["A", "B", "C", "D"].includes(r.respuesta)) {
        throw new Error(`${id_reactivo}: respuesta_correcta inválida "${r.respuesta}"`);
      }
      reactivos.push({
        id_reactivo,
        asignatura: map.nombre,
        subtemario: null,
        dificultad: 2,
        id_texto: null,
        texto_lectura: null,
        enunciado: r.pregunta,
        opciones,
        respuesta_correcta: r.respuesta,
        feedback: r.explicacion,
      });
    }
    resumen.push(`${map.nombre.padEnd(28)} ${n} reactivos`);
  }

  const ids = new Set(reactivos.map((r) => r.id_reactivo));
  if (ids.size !== reactivos.length) {
    throw new Error("Hay id_reactivo duplicados tras la conversión.");
  }

  const outPath = path.join(root, "supabase/seed/reactivos.json");
  await writeFile(outPath, JSON.stringify(reactivos, null, 2), "utf-8");

  console.log(`✔ ${reactivos.length} reactivos convertidos → ${path.relative(root, outPath)}`);
  console.log(resumen.join("\n"));
  console.log(
    "\n⚠ subtemario=null y dificultad=2 en todos: el banco original no traía esos campos por reactivo."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
