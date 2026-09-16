-- Grupos de Estudio, Arena y Marcador Global necesitan mostrar el apodo de
-- OTROS usuarios (nunca nombre real ni foto — profiles solo tiene id,
-- apodo, created_at, así que es seguro abrirlo a cualquier autenticado).
create policy "profiles_select_apodo_autenticados" on public.profiles
  for select using (auth.role() = 'authenticated');
