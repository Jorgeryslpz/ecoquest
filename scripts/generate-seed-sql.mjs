// Genera supabase/seed/0001_reactivos_seed.sql a partir de
// supabase/seed/reactivos.json, para poder cargar el banco pegando el SQL
// en el editor de Supabase SIN necesitar la Secret key todavía.
//
// Uso: node scripts/generate-seed-sql.mjs

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
  const jsonPath = path.join(root, "supabase/seed/reactivos.json");
  const reactivos = JSON.parse(await readFile(jsonPath, "utf-8"));

  const rows = reactivos.map((r) => {
    const opciones = sqlStr(JSON.stringify(r.opciones));
    return `  (${sqlStr(r.id_reactivo)}, ${sqlStr(r.asignatura)}, ${sqlStr(r.subtemario)}, ${r.dificultad}, ${sqlStr(r.id_texto)}, ${sqlStr(r.texto_lectura)}, ${sqlStr(r.enunciado)}, ${opciones}::jsonb, ${sqlStr(r.respuesta_correcta)}, ${sqlStr(r.feedback)})`;
  });

  const sql = `-- Seed generado automáticamente por scripts/generate-seed-sql.mjs
-- a partir de supabase/seed/reactivos.json — no editar a mano, vuelve a
-- correr el script si cambia el banco.
--
-- Aplícalo DESPUÉS de supabase/migrations/0001_init_schema.sql, pegándolo
-- completo en el SQL Editor de Supabase.
--
-- TRUNCATE borra cualquier reactivo previo (p.ej. el banco de prueba de
-- 128) antes de cargar este banco completo. CASCADE también borra las
-- filas de "repaso" que apunten a esos reactivos — no hay problema porque
-- todavía no hay usuarios reales en producción.
truncate table public.reactivos restart identity cascade;

insert into public.reactivos
  (id_reactivo, asignatura, subtemario, dificultad, id_texto, texto_lectura, enunciado, opciones, respuesta_correcta, feedback)
values
${rows.join(",\n")}
on conflict (id_reactivo) do update set
  asignatura = excluded.asignatura,
  subtemario = excluded.subtemario,
  dificultad = excluded.dificultad,
  id_texto = excluded.id_texto,
  texto_lectura = excluded.texto_lectura,
  enunciado = excluded.enunciado,
  opciones = excluded.opciones,
  respuesta_correcta = excluded.respuesta_correcta,
  feedback = excluded.feedback;
`;

  const outPath = path.join(root, "supabase/seed/0001_reactivos_seed.sql");
  await writeFile(outPath, sql, "utf-8");
  console.log(`✔ ${reactivos.length} filas → ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
