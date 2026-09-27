import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { calificar, sumarPuntosClan } from "@/lib/banco";
import { reclamarSesion } from "@/lib/sesiones";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const respuestas = body?.respuestas;
  if (!respuestas || typeof respuestas !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const reclamo = await reclamarSesion(user.id, body?.sesion_id, ["examen"]);
  if (!reclamo.ok) return NextResponse.json({ error: reclamo.error }, { status: reclamo.status });

  const resultado = await calificar(respuestas, reclamo.sesion.items_ids);
  const admin = createServiceRoleClient();

  const { error } = await admin.from("historial_examenes").insert({
    user_id: user.id,
    aciertos: resultado.aciertos,
    total: resultado.total,
    desglose: resultado.porMateria,
  });
  if (error) console.error("[examen] error al guardar historial:", error.message);
  await sumarPuntosClan(user.id, resultado.aciertos);

  return NextResponse.json(resultado);
}
