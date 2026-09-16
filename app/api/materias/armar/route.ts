import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { armarDiagnostico, armarSet, MATERIAS } from "@/lib/banco";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const diagnostico = searchParams.get("diagnostico") === "1";

  if (diagnostico) {
    const admin = createServiceRoleClient();
    const { data: existente } = await admin
      .from("diagnostico_resultados")
      .select("completado")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existente?.completado) {
      return NextResponse.json({ error: "El diagnóstico ya se hizo una vez." }, { status: 409 });
    }
    const preguntas = await armarDiagnostico();
    return NextResponse.json({ preguntas });
  }

  const materia = searchParams.get("materia");
  if (!materia || !MATERIAS.includes(materia as (typeof MATERIAS)[number])) {
    return NextResponse.json({ error: "materia inválida" }, { status: 400 });
  }

  // Evitar repetir reactivos usados en los últimos 2 intentos de esta
  // materia (spec §5) — si el banco no alcanza sin repetir, armarSet ya
  // se encarga de permitirlo.
  const admin = createServiceRoleClient();
  const { data: intentosRecientes } = await admin
    .from("historial_materias")
    .select("reactivos_ids")
    .eq("user_id", user.id)
    .eq("materia", materia)
    .order("created_at", { ascending: false })
    .limit(2);

  const excluirIds = (intentosRecientes ?? []).flatMap((i) => i.reactivos_ids ?? []);
  const preguntas = await armarSet(materia, 20, excluirIds);

  return NextResponse.json({ preguntas });
}
