// Genera supabase/seed/0002_modo_basico_seed.sql a partir de
// supabase/seed/modo_basico.json, con un TRUNCATE al inicio, para poder
// cargarlo por el SQL Editor de Supabase sin necesitar la Secret key.
//
// Uso: node scripts/generate-modo-basico-sql.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function sqlStr(v) {
  if (v === null || v === undefined) return "null";
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  const jsonPath = path.join(root, "supabase/seed/modo_basico.json");
  const items = JSON.parse(await readFile(jsonPath, "utf-8"));

  const rows = items.map((it) => {
    const opciones = sqlStr(JSON.stringify(it.opciones));
    return `  (${sqlStr(it.id_item)}, ${sqlStr(it.asignatura)}, ${it.nivel}, ${sqlStr(it.instruccion)}, ${sqlStr(it.oracion)}, ${opciones}::jsonb, ${sqlStr(it.respuesta_correcta)}, ${sqlStr(it.explicacion)})`;
  });

  const sql = `-- Seed generado automáticamente por scripts/generate-modo-basico-sql.mjs
-- a partir de supabase/seed/modo_basico.json — no editar a mano.
--
-- Aplícalo DESPUÉS de supabase/migrations/0002_modo_basico.sql, pegándolo
-- completo en el SQL Editor de Supabase.
truncate table public.modo_basico_items restart identity cascade;

insert into public.modo_basico_items
  (id_item, asignatura, nivel, instruccion, oracion, opciones, respuesta_correcta, explicacion)
values
${rows.join(",\n")}
on conflict (id_item) do update set
  asignatura = excluded.asignatura,
  nivel = excluded.nivel,
  instruccion = excluded.instruccion,
  oracion = excluded.oracion,
  opciones = excluded.opciones,
  respuesta_correcta = excluded.respuesta_correcta,
  explicacion = excluded.explicacion;
`;

  const outPath = path.join(root, "supabase/seed/0002_modo_basico_seed.sql");
  await writeFile(outPath, sql, "utf-8");
  console.log(`✔ ${items.length} filas → ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
