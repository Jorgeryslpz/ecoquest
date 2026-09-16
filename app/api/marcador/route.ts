import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Calculado al vuelo cada vez que alguien abre la pantalla (no hay
// despliegue en producción todavía para un cron real de "cada hora" como
// pide la spec — documentado en el README). Score = trofeos*2 + progreso
// de Mundo de Preguntas*8.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const admin = createServiceRoleClient();
  const [{ data: trofeos }, { data: progreso }, { data: profiles }] = await Promise.all([
    admin.from("trofeos_liga").select("user_id, trofeos"),
    admin.from("mundos_progreso").select("user_id, mejor_aciertos"),
    admin.from("profiles").select("id, apodo"),
  ]);

  const apodoPorId = new Map((profiles ?? []).map((p) => [p.id, p.apodo]));
  const trofeosPorId = new Map((trofeos ?? []).map((t) => [t.user_id, t.trofeos]));
  const mundosPorId = new Map<string, number>();
  for (const row of progreso ?? []) {
    mundosPorId.set(row.user_id, (mundosPorId.get(row.user_id) ?? 0) + row.mejor_aciertos);
  }

  const userIds = new Set([...trofeosPorId.keys(), ...mundosPorId.keys(), user.id]);
  const tabla = Array.from(userIds).map((id) => {
    const score = (trofeosPorId.get(id) ?? 0) * 2 + (mundosPorId.get(id) ?? 0) * 8;
    return { id, apodo: apodoPorId.get(id) ?? "Aspirante", score, tu: id === user.id };
  });
  tabla.sort((a, b) => b.score - a.score);

  const posicion = tabla.findIndex((t) => t.tu) + 1;

  // Cachea el resultado en marcador_global (para cuando exista un cron real).
  await admin.from("marcador_global").upsert(
    tabla.map((t) => ({ user_id: t.id, score: t.score, updated_at: new Date().toISOString() }))
  );

  return NextResponse.json({ top: tabla.slice(0, 10), posicion, total: tabla.length });
}
