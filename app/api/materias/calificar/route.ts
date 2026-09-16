import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { calificar, sumarPuntosClan } from "@/lib/banco";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const tipo = body?.tipo;
  const materia = body?.materia;
  const respuestas = body?.respuestas;

  if (
    (tipo !== "materias" && tipo !== "diagnostico") ||
    !respuestas ||
    typeof respuestas !== "object"
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  if (tipo === "materias" && typeof materia !== "string") {
    return NextResponse.json({ error: "Falta la materia." }, { status: 400 });
  }

  const resultado = await calificar(respuestas);
  const admin = createServiceRoleClient();

  if (tipo === "materias") {
    await admin.from("historial_materias").insert({
      user_id: user.id,
      materia,
      aciertos: resultado.aciertos,
      total: resultado.total,
      reactivos_ids: resultado.detalle.map((d) => d.id_reactivo),
    });
    await sumarPuntosClan(user.id, resultado.aciertos);
  } else {
    const { data: existente } = await admin
      .from("diagnostico_resultados")
      .select("completado")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existente?.completado) {
      return NextResponse.json({ error: "El diagnóstico ya se hizo una vez." }, { status: 409 });
    }
    await admin.from("diagnostico_resultados").upsert({
      user_id: user.id,
      completado: true,
      resultados: resultado.porMateria,
    });
  }

  return NextResponse.json(resultado);
}
