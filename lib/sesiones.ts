import { createServiceRoleClient } from "@/lib/supabase/server";

export type TipoSesion = "materias" | "diagnostico" | "examen" | "arena" | "mundo";

// Tiempo máximo entre armar el set y calificarlo: el cronómetro de cada
// modo (ver las páginas) + 5 min de gracia por red lenta. El cronómetro
// del cliente auto-envía al llegar a 0, así que un envío honesto siempre
// cae dentro. null = sin límite (Mundo no tiene cronómetro).
const GRACIA_SEG = 5 * 60;
const DURACION_MAX_SEG: Record<TipoSesion, number | null> = {
  materias: 20 * 60,
  diagnostico: 60 * 60,
  examen: 3 * 60 * 60,
  arena: 2 * 60,
  mundo: null,
};

export type Sesion = {
  id: string;
  user_id: string;
  tipo: TipoSesion;
  materia: string | null;
  nivel: number | null;
  items_ids: string[];
  created_at: string;
  calificada_at: string | null;
};

/** Guarda el set exacto que armó el servidor y regresa su id. */
export async function crearSesion(
  userId: string,
  tipo: TipoSesion,
  itemsIds: string[],
  extra: { materia?: string; nivel?: number } = {}
): Promise<string> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("sesiones_quiz")
    .insert({
      user_id: userId,
      tipo,
      items_ids: itemsIds,
      materia: extra.materia ?? null,
      nivel: extra.nivel ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`No se pudo crear la sesión de quiz: ${error?.message}`);
  }
  return data.id;
}

/** Sesión sin calificar del usuario (sin marcarla), o null. */
export async function leerSesionAbierta(
  userId: string,
  sesionId: unknown,
  tipo: TipoSesion
): Promise<Sesion | null> {
  if (typeof sesionId !== "string") return null;
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("sesiones_quiz")
    .select("*")
    .eq("id", sesionId)
    .eq("user_id", userId)
    .eq("tipo", tipo)
    .is("calificada_at", null)
    .maybeSingle();
  return (data as Sesion | null) ?? null;
}

type Reclamo = { ok: true; sesion: Sesion } | { ok: false; status: number; error: string };

/**
 * Marca la sesión como calificada de forma atómica (el UPDATE solo pega si
 * `calificada_at` sigue en null), así cada set se califica UNA sola vez
 * aunque lleguen dos peticiones al mismo tiempo.
 */
export async function reclamarSesion(
  userId: string,
  sesionId: unknown,
  tipos: TipoSesion[]
): Promise<Reclamo> {
  if (typeof sesionId !== "string") {
    return { ok: false, status: 400, error: "Falta sesion_id." };
  }
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("sesiones_quiz")
    .update({ calificada_at: new Date().toISOString() })
    .eq("id", sesionId)
    .eq("user_id", userId)
    .in("tipo", tipos)
    .is("calificada_at", null)
    .select("*")
    .maybeSingle();

  if (!data) {
    return { ok: false, status: 409, error: "Este intento no existe o ya fue calificado." };
  }

  const sesion = data as Sesion;
  const max = DURACION_MAX_SEG[sesion.tipo];
  if (max !== null) {
    const transcurrido = (Date.now() - new Date(sesion.created_at).getTime()) / 1000;
    if (transcurrido > max + GRACIA_SEG) {
      return { ok: false, status: 410, error: "Se acabó el tiempo de este intento." };
    }
  }
  return { ok: true, sesion };
}
