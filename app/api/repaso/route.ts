import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Usa el cliente atado a la sesión (no service_role): las policies de
// `repaso` ya permiten que cada usuario inserte/borre sus propias filas.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

  const { id_reactivo } = await request.json().catch(() => ({}));
  if (typeof id_reactivo !== "string") {
    return NextResponse.json({ error: "id_reactivo requerido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("repaso")
    .upsert({ user_id: user.id, id_reactivo }, { onConflict: "user_id,id_reactivo" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
