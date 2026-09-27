import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { calificar } from "@/lib/banco";
import { BOTS_ARRANQUE_FRIO } from "@/lib/liga";
import { reclamarSesion } from "@/lib/sesiones";

// El rival se decide AQUÍ, en el servidor, en el mismo momento en que se
// califica — nunca se recibe del cliente, para que no se pueda fabricar un
// rival fácil y ganar trofeos gratis.
async function elegirRival(admin: ReturnType<typeof createServiceRoleClient>, propioId: string) {
  const { data: duelos } = await admin
    .from("duelos_arena")
    .select("user_id, aciertos_user")
    .neq("user_id", propioId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (duelos && duelos.length > 0) {
    const row = duelos[Math.floor(Math.random() * duelos.length)];
    const { data: perfil } = await admin
      .from("profiles")
      .select("apodo")
      .eq("id", row.user_id)
      .maybeSingle();
    return { nombre: perfil?.apodo ?? "Aspirante", aciertos: row.aciertos_user };
  }

  const { data: hist } = await admin
    .from("historial_materias")
    .select("user_id, aciertos, total")
    .neq("user_id", propioId)
    .limit(50);

  if (hist && hist.length > 0) {
    const row = hist[Math.floor(Math.random() * hist.length)];
    const { data: perfil } = await admin
      .from("profiles")
      .select("apodo")
      .eq("id", row.user_id)
      .maybeSingle();
    const escalado = Math.round((row.aciertos / row.total) * 5);
    return { nombre: perfil?.apodo ?? "Aspirante", aciertos: Math.min(5, Math.max(0, escalado)) };
  }

  // Arranque en frío: todavía no hay otros usuarios con historial.
  const nombre = BOTS_ARRANQUE_FRIO[Math.floor(Math.random() * BOTS_ARRANQUE_FRIO.length)];
  return { nombre, aciertos: Math.floor(Math.random() * 4) + 1 };
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const respuestas = body?.respuestas;
  if (!respuestas || typeof respuestas !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  // Solo se califica el set que armó /api/arena/duelo para este usuario,
  // una vez y dentro del tiempo del duelo — no una lista que mande el cliente.
  const reclamo = await reclamarSesion(user.id, body?.sesion_id, ["arena"]);
  if (!reclamo.ok) return NextResponse.json({ error: reclamo.error }, { status: reclamo.status });

  const resultado = await calificar(respuestas, reclamo.sesion.items_ids);
  const admin = createServiceRoleClient();
  const rival = await elegirRival(admin, user.id);

  let cambio: number;
  let desenlace: "gano" | "perdio" | "empate";
  if (resultado.aciertos > rival.aciertos) {
    cambio = 20;
    desenlace = "gano";
  } else if (resultado.aciertos < rival.aciertos) {
    cambio = -15;
    desenlace = "perdio";
  } else {
    cambio = 5;
    desenlace = "empate";
  }

  const { data: nuevoTotal, error: errTrofeos } = await admin.rpc("sumar_trofeos", {
    p_user: user.id,
    p_cambio: cambio,
  });
  const { error: errDuelo } = await admin.from("duelos_arena").insert({
    user_id: user.id,
    aciertos_user: resultado.aciertos,
    aciertos_rival: rival.aciertos,
    trofeos_cambio: cambio,
    resultado: desenlace,
  });
  if (errTrofeos || errDuelo) {
    console.error("[arena] error al guardar el duelo:", errTrofeos?.message, errDuelo?.message);
    return NextResponse.json({ error: "No se pudo guardar el duelo." }, { status: 500 });
  }

  return NextResponse.json({
    ...resultado,
    rival: rival.nombre,
    aciertosRival: rival.aciertos,
    cambio,
    desenlace,
    trofeosTotal: nuevoTotal,
  });
}
