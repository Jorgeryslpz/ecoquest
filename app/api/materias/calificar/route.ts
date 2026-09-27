import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { calificar, sumarPuntosClan } from "@/lib/banco";
import { reclamarSesion } from "@/lib/sesiones";

// Califica Materias y Diagnóstico. El tipo y la materia salen de la sesión
// que armó el servidor, no de lo que diga el cliente.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const respuestas = body?.respuestas;
  if (!respuestas || typeof respuestas !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // Si el diagnóstico ya está hecho, no se gasta la sesión.
  if (body?.tipo === "diagnostico") {
    const { data: existente } = await admin
      .from("diagnostico_resultados")
      .select("completado")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existente?.completado) {
      return NextResponse.json({ error: "El diagnóstico ya se hizo una vez." }, { status: 409 });
    }
  }

  const reclamo = await reclamarSesion(user.id, body?.sesion_id, ["materias", "diagnostico"]);
  if (!reclamo.ok) return NextResponse.json({ error: reclamo.error }, { status: reclamo.status });
  const { sesion } = reclamo;

  const resultado = await calificar(respuestas, sesion.items_ids);

  if (sesion.tipo === "materias") {
    const { error } = await admin.from("historial_materias").insert({
      user_id: user.id,
      materia: sesion.materia,
      aciertos: resultado.aciertos,
      total: resultado.total,
      reactivos_ids: sesion.items_ids,
    });
    if (error) console.error("[materias] error al guardar historial:", error.message);
    await sumarPuntosClan(user.id, resultado.aciertos);
  } else {
    // El filtro `completado = false` evita que dos diagnósticos armados en
    // paralelo se guarden los dos: solo el primero pega.
    const { data: guardado, error } = await admin
      .from("diagnostico_resultados")
      .update({ completado: true, resultados: resultado.porMateria })
      .eq("user_id", user.id)
      .eq("completado", false)
      .select("user_id")
      .maybeSingle();
    if (error) console.error("[diagnostico] error al guardar:", error.message);
    if (!guardado) {
      return NextResponse.json({ error: "El diagnóstico ya se hizo una vez." }, { status: 409 });
    }
  }

  return NextResponse.json(resultado);
}
