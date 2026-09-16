-- ECOEMS Quest — "Mundo de Preguntas", formato nuevo (reemplaza por
-- completo el formato viejo de niveles con reactivos A-D y cronómetro).
--
-- Tabla independiente de `reactivos`: la estructura es distinta (oración
-- con hueco + 4 palabras para elegir, sin opciones A-D, sin cronómetro).
--
-- Cómo aplicar: pega este archivo completo en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/ttabnvvakwahghligxtm/sql/new)
-- y ejecútalo. Luego aplica supabase/seed/0002_modo_basico_seed.sql.

create table public.modo_basico_items (
  id uuid primary key default gen_random_uuid(),
  id_item text not null unique,
  asignatura text not null,
  nivel smallint not null check (nivel in (1, 2, 3)),
  instruccion text not null,
  oracion text not null,
  opciones jsonb not null,
  respuesta_correcta text not null,
  explicacion text not null,
  created_at timestamptz not null default now()
);

-- Igual que `reactivos`: RLS activado y SIN policies para
-- authenticated/anon. Solo el backend (service_role) puede leer esta
-- tabla, así la respuesta_correcta nunca puede llegar al cliente por una
-- consulta directa — el cliente solo recibe las preguntas (sin la
-- respuesta) a través del endpoint /api/modo-basico, y la calificación la
-- hace el backend en /api/modo-basico/verificar.
alter table public.modo_basico_items enable row level security;

create index modo_basico_items_asignatura_nivel_idx
  on public.modo_basico_items (asignatura, nivel);
