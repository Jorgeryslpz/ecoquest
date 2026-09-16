import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MATERIAS_MODO_BASICO } from "../route";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const { materia, nivel, aciertos } = await request.json().catch(() => ({}));
  if (
    !MATERIAS_MODO_BASICO.includes(materia) ||
    ![1, 2, 3].includes(nivel) ||
    typeof aciertos !== "number" ||
    aciertos < 0 ||
    aciertos > 10
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: previo } = await admin
    .from("mundos_progreso")
    .select("mejor_aciertos")
    .eq("user_id", user.id)
    .eq("materia", materia)
    .eq("nivel", nivel)
    .maybeSingle();

  const mejor = Math.max(previo?.mejor_aciertos ?? 0, aciertos);
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
  return NextResponse.json({ ok: true, mejor });
}
