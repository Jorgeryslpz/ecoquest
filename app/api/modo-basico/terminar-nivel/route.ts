import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { reclamarSesion } from "@/lib/sesiones";

// Los aciertos se cuentan aquí, a partir de las respuestas que ya guardó
// /api/modo-basico/verificar — el cliente ya no manda su propio puntaje.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const reclamo = await reclamarSesion(user.id, body?.sesion_id, ["mundo"]);
  if (!reclamo.ok) return NextResponse.json({ error: reclamo.error }, { status: reclamo.status });
  const { materia, nivel } = reclamo.sesion;

  const admin = createServiceRoleClient();
  const { count: aciertos, error: errConteo } = await admin
    .from("sesion_respuestas")
    .select("*", { count: "exact", head: true })
    .eq("sesion_id", reclamo.sesion.id)
    .eq("correcta", true);
  if (errConteo) return NextResponse.json({ error: errConteo.message }, { status: 500 });

  const { data: previo } = await admin
    .from("mundos_progreso")
    .select("mejor_aciertos")
    .eq("user_id", user.id)
    .eq("materia", materia)
    .eq("nivel", nivel)
    .maybeSingle();

  const mejor = Math.max(previo?.mejor_aciertos ?? 0, aciertos ?? 0);
  const { error } = await admin.from("mundos_progreso").upsert(
    {
      user_id: user.id,
      materia,
      nivel,
      mejor_aciertos: mejor,
      aprobado: mejor >= 6,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,materia,nivel" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, aciertos: aciertos ?? 0, mejor });
}
