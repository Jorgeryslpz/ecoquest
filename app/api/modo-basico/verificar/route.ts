import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Recibe el id_item y la palabra elegida por el usuario, y el backend
// decide si es correcta — el cliente nunca sabe la respuesta hasta que
// contesta. Nunca se confía en el cliente para calificar.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const idItem = body?.id_item;
  const respuesta = body?.respuesta;

  if (typeof idItem !== "string" || typeof respuesta !== "string") {
    return NextResponse.json({ error: "id_item y respuesta son requeridos" }, { status: 400 });
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

  return NextResponse.json({
    correcto: respuesta === data.respuesta_correcta,
    respuesta_correcta: data.respuesta_correcta,
    explicacion: data.explicacion,
  });
}
