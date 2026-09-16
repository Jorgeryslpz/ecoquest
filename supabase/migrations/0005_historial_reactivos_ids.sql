-- Para poder evitar repetir reactivos de los últimos 2 intentos de
-- Materias (spec §5), necesitamos saber qué id_reactivo se usaron en cada
-- intento pasado.
alter table public.historial_materias
  add column reactivos_ids text[] not null default '{}';
