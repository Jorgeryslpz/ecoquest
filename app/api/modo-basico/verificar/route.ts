import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { leerSesionAbierta } from "@/lib/sesiones";

// Recibe el id_item y la palabra elegida por el usuario, y el backend
// decide si es correcta — el cliente nunca sabe la respuesta hasta que
// contesta. Nunca se confía en el cliente para calificar. La primera
// respuesta a cada ítem queda guardada en sesion_respuestas y es la que
// cuenta al terminar el nivel.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const idItem = body?.id_item;
  const respuesta = body?.respuesta;

  if (typeof idItem !== "string" || typeof respuesta !== "string") {
    return NextResponse.json({ error: "id_item y respuesta son requeridos" }, { status: 400 });
  }

  const sesion = await leerSesionAbierta(user.id, body?.sesion_id, "mundo");
  if (!sesion || !sesion.items_ids.includes(idItem)) {
    return NextResponse.json({ error: "Este ítem no es parte de tu nivel actual." }, { status: 409 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("modo_basico_items")
    .select("respuesta_correcta, explicacion")
    .eq("id_item", idItem)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
  }

  const correcto = respuesta === data.respuesta_correcta;
  const { error: errGuardar } = await supabase.from("sesion_respuestas").insert({
    sesion_id: sesion.id,
    item_id: idItem,
    respuesta,
    correcta: correcto,
  });
  if (errGuardar) {
    // 23505 = ya había una respuesta para este ítem: la primera es la que cuenta.
    const status = errGuardar.code === "23505" ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? "Ya respondiste esta pregunta." : errGuardar.message },
      { status }
    );
  }

  return NextResponse.json({
    correcto,
    respuesta_correcta: data.respuesta_correcta,
    explicacion: data.explicacion,
  });
}
