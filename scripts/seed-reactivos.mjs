// Carga por lotes del banco de reactivos (spec §8.1): lee un JSON con el
// esquema canónico y lo sube a Supabase por upsert (id_reactivo), validando
// ids únicos y que respuesta_correcta exista en opciones. Úsalo cada vez que
// agregues o corrijas reactivos — es seguro correrlo varias veces.
//
// Uso: node scripts/seed-reactivos.mjs [ruta-al-json]
//   (por defecto usa supabase/seed/reactivos.json)
//
// Requiere en el entorno:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SECRET_KEY   (nunca la publishable/anon — este script necesita
//                          escribir en una tabla sin policies para el cliente)

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SECRET_KEY en el entorno (revisa .env.local)."
  );
  process.exit(1);
}

async function main() {
  const jsonPath = path.resolve(root, process.argv[2] || "supabase/seed/reactivos.json");
  const reactivos = JSON.parse(await readFile(jsonPath, "utf-8"));

  // -------- validación --------
  const ids = new Set();
  for (const r of reactivos) {
    if (!r.id_reactivo) throw new Error("Reactivo sin id_reactivo.");
    if (ids.has(r.id_reactivo)) throw new Error(`id_reactivo duplicado: ${r.id_reactivo}`);
    ids.add(r.id_reactivo);
    if (!["A", "B", "C", "D"].includes(r.respuesta_correcta)) {
      throw new Error(`${r.id_reactivo}: respuesta_correcta inválida.`);
    }
    if (!(r.respuesta_correcta in r.opciones)) {
      throw new Error(`${r.id_reactivo}: la respuesta_correcta no existe en opciones.`);
    }
    if (!["Español","Habilidad Verbal","Matemáticas","Habilidad Matemática","Biología","Física","Química","Historia","Geografía","Formación Cívica y Ética"].includes(r.asignatura)) {
      throw new Error(`${r.id_reactivo}: asignatura desconocida "${r.asignatura}".`);
    }
  }
  console.log(`✔ Validación ok: ${reactivos.length} reactivos.`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { error, count } = await supabase
    .from("reactivos")
    .upsert(reactivos, { onConflict: "id_reactivo", count: "exact" });

  if (error) {
    console.error("✘ Error al subir a Supabase:", error.message);
    process.exit(1);
  }
  console.log(`✔ Subidos/actualizados ${count ?? reactivos.length} reactivos en la tabla reactivos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
