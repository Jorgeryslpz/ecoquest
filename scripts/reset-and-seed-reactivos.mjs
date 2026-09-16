// Borra TODO lo que haya en public.reactivos y carga supabase/seed/reactivos.json
// completo, en lotes, vía API (service role). Equivalente en efecto a correr
// supabase/seed/0001_reactivos_seed.sql en el SQL Editor.
//
// Uso: node --env-file=.env.local scripts/reset-and-seed-reactivos.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  const jsonPath = path.join(root, "supabase/seed/reactivos.json");
  const reactivos = JSON.parse(await readFile(jsonPath, "utf-8"));
  console.log(`Cargando ${reactivos.length} reactivos desde ${path.relative(root, jsonPath)}...`);

  const { count: antes } = await supabase
    .from("reactivos")
    .select("*", { count: "exact", head: true });
  console.log(`Reactivos existentes antes de borrar: ${antes ?? 0}`);

  const { error: delError } = await supabase
    .from("reactivos")
    .delete()
    .not("id", "is", null); // filtro que matchea todas las filas (delete requiere un filtro)
  if (delError) {
    console.error("✘ Error al borrar:", delError.message);
    process.exit(1);
  }
  console.log("✔ Tabla reactivos vaciada.");

  const LOTE = 250;
  let subidos = 0;
  for (let i = 0; i < reactivos.length; i += LOTE) {
    const lote = reactivos.slice(i, i + LOTE);
    const { error } = await supabase.from("reactivos").insert(lote);
    if (error) {
      console.error(`✘ Error insertando lote ${i}-${i + lote.length}:`, error.message);
      process.exit(1);
    }
    subidos += lote.length;
    console.log(`  ... ${subidos}/${reactivos.length}`);
  }

  const { count: despues } = await supabase
    .from("reactivos")
    .select("*", { count: "exact", head: true });
  console.log(`✔ Listo. Total en la tabla ahora: ${despues}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
