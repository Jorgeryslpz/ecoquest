-- ECOEMS Quest — Esquema inicial (Etapa 1)
-- Incluye ya las tablas de Competir y Rachas (diagrama de flujo v1.2), aunque su
-- lógica de negocio se construya en etapas posteriores.
--
-- Cómo aplicar: pega este archivo completo en el SQL Editor de tu proyecto
-- Supabase (https://supabase.com/dashboard/project/ttabnvvakwahghligxtm/sql/new)
-- y ejecútalo. Luego aplica supabase/seed/0001_reactivos_seed.sql.

-- =========================================================================
-- EXTENSIONES
-- =========================================================================
create extension if not exists "pgcrypto";

-- =========================================================================
-- PERFILES (extiende auth.users)
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  apodo text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- =========================================================================
-- BANCO DE REACTIVOS
-- Sin políticas para 'authenticated'/'anon': con RLS activo y cero policies,
-- el acceso queda denegado por defecto para esos roles. Solo el backend
-- (service_role, que ignora RLS) puede leer esta tabla — así la respuesta
-- correcta y el feedback JAMÁS pueden llegar al cliente por una consulta
-- directa a Supabase, sin importar lo que haga el frontend.
-- =========================================================================
create table public.reactivos (
  id uuid primary key default gen_random_uuid(),
  id_reactivo text not null unique,
  asignatura text not null,
  subtemario text,
  dificultad smallint not null default 2 check (dificultad in (1,2,3)),
  id_texto text,
  texto_lectura text,
  enunciado text not null,
  opciones jsonb not null,
  respuesta_correcta text not null check (respuesta_correcta in ('A','B','C','D')),
  feedback text not null,
  created_at timestamptz not null default now()
);
alter table public.reactivos enable row level security;
create index reactivos_asignatura_idx on public.reactivos (asignatura);
create index reactivos_subtemario_idx on public.reactivos (asignatura, subtemario);

-- =========================================================================
-- SUSCRIPCIÓN Y PAGOS — solo lectura para el usuario, solo escritura desde
-- el backend (service_role / webhook de Stripe). Nunca desde el cliente.
-- =========================================================================
create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('1_mes','6_meses','1_anio')),
  estado text not null default 'activa' check (estado in ('activa','vencida','cancelada')),
  inicio timestamptz not null default now(),
  fin timestamptz not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);
alter table public.suscripciones enable row level security;
create index suscripciones_user_idx on public.suscripciones (user_id, estado);

create policy "suscripciones_select_own" on public.suscripciones
  for select using (auth.uid() = user_id);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_payment_intent_id text,
  plan text not null check (plan in ('1_mes','6_meses','1_anio')),
  monto_mxn integer not null,
  estado text not null check (estado in ('exitoso','fallido','pendiente')),
  created_at timestamptz not null default now()
);
alter table public.pagos enable row level security;
create index pagos_user_idx on public.pagos (user_id);

create policy "pagos_select_own" on public.pagos
  for select using (auth.uid() = user_id);

-- =========================================================================
-- MONEDERO TUTORIA — mismo criterio: solo lectura para el cliente.
-- =========================================================================
create table public.monedero_tutoria (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saldo_mxn integer not null default 0,
  mensajes_mes_usados integer not null default 0,
  mensajes_extra integer not null default 0,
  ciclo_inicio date not null default current_date,
  updated_at timestamptz not null default now()
);
alter table public.monedero_tutoria enable row level security;

create policy "monedero_select_own" on public.monedero_tutoria
  for select using (auth.uid() = user_id);

create table public.recargas_monedero (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('abono','compra_mensajes')),
  monto_mxn integer not null,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);
alter table public.recargas_monedero enable row level security;

create policy "recargas_select_own" on public.recargas_monedero
  for select using (auth.uid() = user_id);

-- registro de uso de TutorIA, solo para limitar 30 msj/hora (anti-abuso)
create table public.tutoria_uso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.tutoria_uso enable row level security;
create index tutoria_uso_user_idx on public.tutoria_uso (user_id, created_at);

create policy "tutoria_uso_select_own" on public.tutoria_uso
  for select using (auth.uid() = user_id);
create policy "tutoria_uso_insert_own" on public.tutoria_uso
  for insert with check (auth.uid() = user_id);

-- =========================================================================
-- PROGRESO — el cliente puede insertar/actualizar SU PROPIO progreso, pero
-- la calificación (qué respuesta es correcta) siempre la calcula el backend
-- antes de escribir; el cliente nunca decide su propio puntaje.
-- =========================================================================
create table public.diagnostico_resultados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completado boolean not null default false,
  resultados jsonb,
  created_at timestamptz not null default now()
);
alter table public.diagnostico_resultados enable row level security;

create policy "diagnostico_select_own" on public.diagnostico_resultados
  for select using (auth.uid() = user_id);
create policy "diagnostico_upsert_own" on public.diagnostico_resultados
  for insert with check (auth.uid() = user_id);
create policy "diagnostico_update_own" on public.diagnostico_resultados
  for update using (auth.uid() = user_id);

create table public.mundos_progreso (
  user_id uuid not null references auth.users(id) on delete cascade,
  materia text not null,
  nivel integer not null,
  mejor_aciertos integer not null default 0,
  estrellas integer not null default 0,
  aprobado boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, materia, nivel)
);
alter table public.mundos_progreso enable row level security;

create policy "mundos_select_own" on public.mundos_progreso
  for select using (auth.uid() = user_id);
create policy "mundos_upsert_own" on public.mundos_progreso
  for insert with check (auth.uid() = user_id);
create policy "mundos_update_own" on public.mundos_progreso
  for update using (auth.uid() = user_id);

create table public.historial_materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia text not null,
  aciertos integer not null,
  total integer not null,
  created_at timestamptz not null default now()
);
alter table public.historial_materias enable row level security;
create index historial_materias_user_idx on public.historial_materias (user_id);

create policy "historial_materias_select_own" on public.historial_materias
  for select using (auth.uid() = user_id);
create policy "historial_materias_insert_own" on public.historial_materias
  for insert with check (auth.uid() = user_id);

create table public.historial_examenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aciertos integer not null,
  total integer not null,
  desglose jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.historial_examenes enable row level security;
create index historial_examenes_user_idx on public.historial_examenes (user_id);

create policy "historial_examenes_select_own" on public.historial_examenes
  for select using (auth.uid() = user_id);
create policy "historial_examenes_insert_own" on public.historial_examenes
  for insert with check (auth.uid() = user_id);

create table public.repaso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  id_reactivo text not null references public.reactivos(id_reactivo) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, id_reactivo)
);
alter table public.repaso enable row level security;

create policy "repaso_select_own" on public.repaso
  for select using (auth.uid() = user_id);
create policy "repaso_insert_own" on public.repaso
  for insert with check (auth.uid() = user_id);
create policy "repaso_delete_own" on public.repaso
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- COMPETIR — Trofeos/Liga, Clanes, Battle Royale, Arena, Marcador Global
-- (esquema de la Etapa 1; lógica en Etapas 5-7). Nunca se expone nombre
-- real ni foto de perfil — solo apodo (columna profiles.apodo).
-- =========================================================================
create table public.trofeos_liga (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trofeos integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.trofeos_liga enable row level security;

create policy "trofeos_select_all" on public.trofeos_liga
  for select using (auth.role() = 'authenticated');
create policy "trofeos_upsert_own" on public.trofeos_liga
  for insert with check (auth.uid() = user_id);
create policy "trofeos_update_own" on public.trofeos_liga
  for update using (auth.uid() = user_id);

create table public.clanes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,
  creado_por uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.clanes enable row level security;

create policy "clanes_select_all" on public.clanes
  for select using (auth.role() = 'authenticated');
create policy "clanes_insert_own" on public.clanes
  for insert with check (auth.uid() = creado_por);

create table public.clan_miembros (
  clan_id uuid not null references public.clanes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  puntos_semana integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);
alter table public.clan_miembros enable row level security;

create policy "clan_miembros_select_all" on public.clan_miembros
  for select using (auth.role() = 'authenticated');
create policy "clan_miembros_insert_own" on public.clan_miembros
  for insert with check (auth.uid() = user_id);
create policy "clan_miembros_delete_own" on public.clan_miembros
  for delete using (auth.uid() = user_id);
create policy "clan_miembros_update_own" on public.clan_miembros
  for update using (auth.uid() = user_id);

-- salas efímeras: se crean y se destruyen por partida (docx §8). Solo se
-- conserva el resultado final por jugador en resultados_battle_royale.
create table public.salas_battle_royale (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  anfitrion_id uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'lobby' check (estado in ('lobby','en_curso','terminada')),
  created_at timestamptz not null default now(),
  terminada_at timestamptz
);
alter table public.salas_battle_royale enable row level security;

create policy "salas_br_select_all" on public.salas_battle_royale
  for select using (auth.role() = 'authenticated');
create policy "salas_br_insert_own" on public.salas_battle_royale
  for insert with check (auth.uid() = anfitrion_id);
create policy "salas_br_update_anfitrion" on public.salas_battle_royale
  for update using (auth.uid() = anfitrion_id);

create table public.resultados_battle_royale (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references public.salas_battle_royale(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  puntaje integer not null default 0,
  posicion integer,
  created_at timestamptz not null default now()
);
alter table public.resultados_battle_royale enable row level security;

create policy "resultados_br_select_all" on public.resultados_battle_royale
  for select using (auth.role() = 'authenticated');
create policy "resultados_br_insert_own" on public.resultados_battle_royale
  for insert with check (auth.uid() = user_id);

create table public.duelos_arena (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rival_id uuid references auth.users(id) on delete set null,
  aciertos_user integer not null,
  aciertos_rival integer not null,
  trofeos_cambio integer not null,
  resultado text not null check (resultado in ('gano','perdio','empate')),
  created_at timestamptz not null default now()
);
alter table public.duelos_arena enable row level security;

create policy "duelos_select_participante" on public.duelos_arena
  for select using (auth.uid() = user_id or auth.uid() = rival_id);
create policy "duelos_insert_own" on public.duelos_arena
  for insert with check (auth.uid() = user_id);

-- recalculado periódicamente (cron, cada hora) — no en tiempo real (docx §8)
create table public.marcador_global (
  user_id uuid primary key references auth.users(id) on delete cascade,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.marcador_global enable row level security;

create policy "marcador_select_all" on public.marcador_global
  for select using (auth.role() = 'authenticated');

-- =========================================================================
-- RACHAS DE ESTUDIO — se calculan con un proceso diario a medianoche en la
-- zona horaria del usuario (cron), nunca en tiempo real (docx §7-8).
-- =========================================================================
create table public.rachas_estudio (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dias_actuales integer not null default 0,
  mejor_racha integer not null default 0,
  congelados_disponibles integer not null default 0 check (congelados_disponibles between 0 and 2),
  modo_vacaciones boolean not null default false,
  vacaciones_inicio date,
  vacaciones_fin date,
  ultima_actividad date,
  zona_horaria text not null default 'America/Mexico_City',
  updated_at timestamptz not null default now()
);
alter table public.rachas_estudio enable row level security;

create policy "rachas_select_own" on public.rachas_estudio
  for select using (auth.uid() = user_id);
create policy "rachas_update_own" on public.rachas_estudio
  for update using (auth.uid() = user_id);

-- =========================================================================
-- ALTA AUTOMÁTICA: al crear un usuario en auth.users, se le crean sus filas
-- base (perfil, monedero, trofeos, racha) con SECURITY DEFINER para que
-- corra con privilegios de servidor sin necesitar policies de INSERT desde
-- el cliente en estas tablas "de arranque".
-- =========================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, apodo)
  values (new.id, 'Aspirante' || substr(new.id::text, 1, 4));

  insert into public.monedero_tutoria (user_id) values (new.id);
  insert into public.trofeos_liga (user_id) values (new.id);
  insert into public.rachas_estudio (user_id) values (new.id);
  insert into public.marcador_global (user_id) values (new.id);
  insert into public.diagnostico_resultados (user_id, completado) values (new.id, false);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
