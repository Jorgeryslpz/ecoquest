import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Para usar en Route Handlers y Server Components: obtiene el usuario de
 * la sesión (cookies) o null. No lanza error — cada caller decide qué
 * hacer si no hay sesión (redirect en páginas, 401 en API routes).
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Suscripción activa (o en periodo de prueba) del usuario, o null. */
export async function getSuscripcionActiva(userId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("user_id", userId)
    .eq("estado", "activa")
    .gt("fin", new Date().toISOString())
    .order("fin", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
