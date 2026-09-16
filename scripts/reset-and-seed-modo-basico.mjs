// Borra todo lo que haya en public.modo_basico_items y carga
// supabase/seed/modo_basico.json completo vía API (service role).
//
// Uso: node --env-file=.env.local scripts/reset-and-seed-modo-basico.mjs
//
// Requiere que supabase/migrations/0002_modo_basico.sql ya esté aplicado
// (la tabla debe existir).

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
  const jsonPath = path.join(root, "supabase/seed/modo_basico.json");
  const items = JSON.parse(await readFile(jsonPath, "utf-8"));
  console.log(`Cargando ${items.length} ítems desde ${path.relative(root, jsonPath)}...`);

  const { error: delError } = await supabase
    .from("modo_basico_items")
    .delete()
    .not("id", "is", null);
  if (delError) {
    console.error("✘ Error al borrar (¿ya aplicaste la migración 0002?):", delError.message);
    process.exit(1);
  }
  console.log("✔ Tabla modo_basico_items vaciada.");

  const LOTE = 100;
  let subidos = 0;
  for (let i = 0; i < items.length; i += LOTE) {
    const lote = items.slice(i, i + LOTE);
    const { error } = await supabase.from("modo_basico_items").insert(lote);
    if (error) {
      console.error(`✘ Error insertando lote ${i}-${i + lote.length}:`, error.message);
      process.exit(1);
    }
    subidos += lote.length;
    console.log(`  ... ${subidos}/${items.length}`);
  }

  const { count } = await supabase
    .from("modo_basico_items")
    .select("*", { count: "exact", head: true });
  console.log(`✔ Listo. Total en la tabla ahora: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
