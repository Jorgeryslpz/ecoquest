-- Cierra las trampas de Competencia (auditoría 2026-09-25).
--
-- Problema 1: varias tablas que alimentan puntajes tenían policies de
-- INSERT/UPDATE para el propio usuario. Como la publishable key y la sesión
-- viven en el navegador, cualquiera podía abrir la consola y escribir
-- directo, p. ej.:
--   supabase.from("trofeos_liga").update({ trofeos: 99999 }).eq("user_id", miId)
-- Desde ahora TODAS las escrituras de puntajes/progreso pasan por API
-- routes que usan service_role (que ignora RLS); el cliente solo lee.
--
-- Problema 2: los endpoints de calificar aceptaban cualquier lista de
-- id_reactivo que mandara el cliente (y Materias revela la respuesta
-- correcta después de calificar), así que se podía juntar un "set
-- perfecto" y reenviarlo para ganar siempre en Arena o inflar puntos de
-- grupo. Ahora cada set que arma el servidor se guarda en `sesiones_quiz`,
-- y solo se califica contra ESE set, una sola vez.
--
-- Cómo aplicar: pega este archivo completo en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/ttabnvvakwahghligxtm/sql/new)
-- y ejecútalo. El código nuevo depende de las tablas y funciones de abajo.

-- =========================================================================
-- 1. Quitar escrituras directas desde el cliente
-- =========================================================================
drop policy if exists "diagnostico_upsert_own" on public.diagnostico_resultados;
drop policy if exists "diagnostico_update_own" on public.diagnostico_resultados;

drop policy if exists "mundos_upsert_own" on public.mundos_progreso;
drop policy if exists "mundos_update_own" on public.mundos_progreso;

drop policy if exists "historial_materias_insert_own" on public.historial_materias;
drop policy if exists "historial_examenes_insert_own" on public.historial_examenes;

drop policy if exists "trofeos_upsert_own" on public.trofeos_liga;
drop policy if exists "trofeos_update_own" on public.trofeos_liga;

drop policy if exists "duelos_insert_own" on public.duelos_arena;

-- Crear/unirse a un grupo ahora pasa por /api/clanes (con insert directo
-- se podía entrar con puntos_semana = 99999). Salir del grupo (delete)
-- sigue permitido desde el cliente: solo borra tu propia fila.
drop policy if exists "clanes_insert_own" on public.clanes;
drop policy if exists "clan_miembros_insert_own" on public.clan_miembros;
drop policy if exists "clan_miembros_update_own" on public.clan_miembros;

-- Las rachas las calculará el servidor (cron), nunca el cliente.
drop policy if exists "rachas_update_own" on public.rachas_estudio;

-- Battle Royale no está en el MVP; se cierra para que no quede abierto.
drop policy if exists "resultados_br_insert_own" on public.resultados_battle_royale;

-- =========================================================================
-- 2. Sesiones de quiz: el set exacto que armó el servidor
-- =========================================================================
create table public.sesiones_quiz (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('materias', 'diagnostico', 'examen', 'arena', 'mundo')),
  materia text,
  nivel smallint,
  items_ids text[] not null,
  created_at timestamptz not null default now(),
  calificada_at timestamptz
);
-- RLS activo y SIN policies: solo el backend (service_role) la toca.
alter table public.sesiones_quiz enable row level security;
create index sesiones_quiz_user_idx on public.sesiones_quiz (user_id, created_at);

-- Respuestas pregunta por pregunta de Mundo de Preguntas (ahí el feedback
-- es inmediato, así que cada respuesta se fija en el momento: la primera
-- cuenta y no se puede cambiar después de ver la correcta).
create table public.sesion_respuestas (
  sesion_id uuid not null references public.sesiones_quiz(id) on delete cascade,
  item_id text not null,
  respuesta text not null,
  correcta boolean not null,
  created_at timestamptz not null default now(),
  primary key (sesion_id, item_id)
);
alter table public.sesion_respuestas enable row level security;

-- =========================================================================
-- 3. Sumas atómicas (antes: leer -> sumar en JS -> escribir, que pierde
--    puntos si llegan dos calificaciones al mismo tiempo)
-- =========================================================================
create function public.sumar_puntos_clan(p_user uuid, p_puntos integer)
returns void
language sql
security definer set search_path = public
as $$
  update public.clan_miembros
  set puntos_semana = puntos_semana + p_puntos
  where user_id = p_user;
$$;

create function public.sumar_trofeos(p_user uuid, p_cambio integer)
returns integer
language sql
security definer set search_path = public
as $$
  insert into public.trofeos_liga (user_id, trofeos)
  values (p_user, greatest(0, p_cambio))
  on conflict (user_id) do update
    set trofeos = greatest(0, public.trofeos_liga.trofeos + p_cambio),
        updated_at = now()
  returning trofeos;
$$;

-- Supabase le da EXECUTE a anon/authenticated por default en funciones de
-- `public`: hay que quitárselo explícitamente o cualquiera podría llamar
-- sumar_trofeos(su_id, 99999) desde el navegador.
revoke execute on function public.sumar_puntos_clan(uuid, integer) from public, anon, authenticated;
revoke execute on function public.sumar_trofeos(uuid, integer) from public, anon, authenticated;
grant execute on function public.sumar_puntos_clan(uuid, integer) to service_role;
grant execute on function public.sumar_trofeos(uuid, integer) to service_role;
