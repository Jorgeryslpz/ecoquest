import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("mundos_progreso")
    .select("materia, nivel, mejor_aciertos")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const progreso: Record<string, Record<number, number>> = {};
  for (const row of data ?? []) {
    progreso[row.materia] ??= {};
    progreso[row.materia][row.nivel] = row.mejor_aciertos;
  }
  return NextResponse.json({ progreso });
}
