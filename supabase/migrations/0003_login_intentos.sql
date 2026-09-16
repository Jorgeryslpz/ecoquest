-- Bloqueo temporal tras 5 intentos fallidos de login (spec §1.2).
-- Tabla aparte de `profiles` porque el login puede fallar ANTES de saber
-- el user_id (contraseña incorrecta) — se indexa por correo.
--
-- Mismo criterio que `reactivos`: RLS activo, SIN policies para
-- authenticated/anon. Solo /api/auth/login (con service_role) puede leer
-- y escribir esta tabla.

create table public.login_intentos (
  email text primary key,
  intentos smallint not null default 0,
  bloqueado_hasta timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.login_intentos enable row level security;
